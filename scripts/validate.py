#!/usr/bin/env python3
"""
PatronAI — walidacja schema.sql + migrations/001..006 na lokalnym PostgreSQL 16.

Uruchamiane jako bieżący użytkownik (bez sudo): initdb + pg_ctl w /home/user/pgdata.

Kroki:
  1. start serwera PostgreSQL 16 (gniazdo UNIX w /tmp/pgsock, bez TCP),
  2. plik "up-only" = schema.sql + sekcje +migrate Up wszystkich migracji,
  3. wykonanie z ON_ERROR_STOP=1, następnie powtórka (test idempotencji seeda),
  4. kontrole: tabele, widoki, indeksy, triggery, sumy, statusy, FK, CHECK-i, migracje,
  5. druga baza: wszystkie sekcje +migrate Down w odwrotnej kolejności (test rollbacku).
"""
import os
import re
import shutil
import subprocess
import sys

PG_BIN = "/usr/lib/postgresql/16/bin"
PGDATA = "/home/user/pgdata"
SOCK = "/tmp/pgsock"
PGPORT = "5439"
DB = "patronai"
DB_ROLLBACK = "patronai_rollback"
BASE = "/home/user/patronai-db"
MIGRATIONS = [
    "001_create_schema_migrations.sql",
    "002_create_allocations.sql",
    "003_create_audit_reports.sql",
    "004_create_payment_orders.sql",
    "005_indexes_triggers_views.sql",
    "006_seed_demo_dataset.sql",
]


def psql(sql, db=DB):
    cmd = [f"{PG_BIN}/psql", "-h", SOCK, "-p", PGPORT, "-U", "postgres", "-d", db,
           "-X", "-q", "-A", "-t", "-v", "ON_ERROR_STOP=1", "-c", sql]
    return subprocess.run(cmd, capture_output=True, text=True)


def psql_file(path, db=DB):
    cmd = [f"{PG_BIN}/psql", "-h", SOCK, "-p", PGPORT, "-U", "postgres", "-d", db,
           "-X", "-q", "-v", "ON_ERROR_STOP=1", "-f", path]
    return subprocess.run(cmd, capture_output=True, text=True)


def split_section(text, section):
    if section == "up":
        m = re.search(r"--\s*\+migrate Up\s*-*\n(.*?)(?=--\s*\+migrate Down)", text, re.S)
    else:
        m = re.search(r"--\s*\+migrate Down\s*-*\n(.*)$", text, re.S)
    return m.group(1).strip() if m else ""


def main():
    failures = []
    os.makedirs(SOCK, exist_ok=True)
    shutil.rmtree(PGDATA, ignore_errors=True)
    os.makedirs(PGDATA, exist_ok=True)

    r = subprocess.run([f"{PG_BIN}/initdb", "-D", PGDATA, "-U", "postgres", "--auth=trust"],
                       capture_output=True, text=True)
    if r.returncode != 0:
        print("INITDB FAILED\n" + r.stderr[-3000:])
        return 1
    r = subprocess.run([f"{PG_BIN}/pg_ctl", "-D", PGDATA, "-l", "/tmp/pglog.txt", "-w",
                        "-o", f"-p {PGPORT} -k {SOCK} -c listen_addresses=''", "start"],
                       capture_output=True, text=True)
    print("start serwera:", (r.stdout + r.stderr).strip().splitlines()[-1])
    if r.returncode != 0:
        print("PG_CTL FAILED")
        return 1

    for db in (DB, DB_ROLLBACK):
        psql(f"DROP DATABASE IF EXISTS {db}", db="postgres")
        psql(f"CREATE DATABASE {db}", db="postgres")

    # --- 1. plik up-only ---------------------------------------------------
    up = ["-- ===== schema.sql (baseline) =====", open(f"{BASE}/schema.sql").read(), ""]
    for f in MIGRATIONS:
        up.append(f"\n-- ===== {f} (Up) =====")
        up.append(split_section(open(f"{BASE}/migrations/{f}").read(), "up"))
    open("/tmp/up.sql", "w").write("\n".join(up) + "\n")

    print("\n===== WYKONANIE: schema.sql + migracje 001–006 (Up) =====")
    r = psql_file("/tmp/up.sql")
    print("exit_code:", r.returncode)
    notices = [l for l in r.stderr.splitlines() if "NOTICE" in l]
    errors = [l for l in r.stderr.splitlines() if "ERROR" in l or "FATAL" in l]
    print("liczba NOTICE (pomijalne, IF NOT EXISTS):", len(notices))
    print("liczba ERROR:", len(errors))
    for e in errors[:20]:
        print("   ", e)
    if r.returncode != 0:
        failures.append("wykonanie UP nieudane")

    # --- 2. kontrole -------------------------------------------------------
    checks = {
        "tabele bazowe": "SELECT string_agg(table_name, ', ' ORDER BY table_name) FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'",
        "widoki": "SELECT string_agg(table_name, ', ' ORDER BY table_name) FROM information_schema.views WHERE table_schema='public'",
        "indeksy (nazwane _idx)": "SELECT count(*) FROM pg_indexes WHERE schemaname='public' AND indexname LIKE '%_idx'",
        "triggery": "SELECT count(*) FROM information_schema.triggers WHERE trigger_schema='public'",
        "wpisy rejestru": "SELECT count(*) FROM allocations",
        "SUMA PLN": "SELECT SUM(amount_pln_equivalent) FROM allocations",
        "waluty": "SELECT string_agg(currency || '=' || c, ' ' ORDER BY currency) FROM (SELECT currency, count(*) c FROM allocations GROUP BY currency) t",
        "statusy": "SELECT string_agg(status || '=' || c, ' ' ORDER BY status) FROM (SELECT status, count(*) c FROM allocations GROUP BY status) t",
        "typy wkładu": "SELECT string_agg(contribution_type || '=' || c, ' ' ORDER BY contribution_type) FROM (SELECT contribution_type, count(*) c FROM allocations GROUP BY contribution_type) t",
        "tiery barteru": "SELECT string_agg(barter_tier || ':' || ave_market_value, ', ' ORDER BY ave_market_value DESC) FROM allocations WHERE contribution_type='in_kind'",
        "raporty audytu": "SELECT count(*) FROM audit_reports",
        "audyty mismatch": "SELECT count(*) FROM audit_reports WHERE flag_status='mismatch'",
        "audyty match": "SELECT count(*) FROM audit_reports WHERE flag_status='match'",
        "pozycje JSON (line_items)": "SELECT count(*) FROM audit_reports WHERE jsonb_typeof(line_items)='array' AND jsonb_array_length(line_items)=2",
        "NIP 10 cyfr": "SELECT count(*) FROM audit_reports WHERE merchant_nip ~ '^[0-9]{10}$'",
        "zamowienia PayPal": "SELECT count(*) FROM payment_orders",
        "tryb PayPal": "SELECT string_agg(mode || '/' || status || '=' || c, ' ' ORDER BY mode) FROM (SELECT mode, status, count(*) c FROM payment_orders GROUP BY mode, status) t",
        "migracje": "SELECT string_agg(version, ',' ORDER BY version) FROM schema_migrations",
        "v_public_ledger": "SELECT count(*) FROM v_public_ledger",
        "v_certificate_verification": "SELECT count(*) FROM v_certificate_verification",
        "certyfikaty z hashem": "SELECT count(*) FROM v_certificate_verification WHERE is_hash_sealed",
        "v_ledger_totals suma": "SELECT SUM(total_pln_equivalent) FROM v_ledger_totals",
        "v_audit_flag_queue": "SELECT count(*) FROM v_audit_flag_queue",
        "FK audit_reports": "SELECT count(*) FROM pg_constraint WHERE conname='audit_reports_allocation_id_fkey' AND contype='f'",
        "FK payment_orders": "SELECT count(*) FROM pg_constraint WHERE conname='payment_orders_allocation_id_fkey' AND contype='f'",
        "CHECK allocations": "SELECT count(*) FROM pg_constraint WHERE contype='c' AND connamespace='public'::regnamespace AND conname LIKE 'allocations%chk'",
        "funkcja triggera": "SELECT count(*) FROM pg_proc WHERE proname='patronai_set_updated_at'",
    }
    print("\n===== KONTROLE DANYCH =====")
    for label, sql in checks.items():
        r = psql(sql)
        val = r.stdout.strip()
        print(f"  {label:28s} -> {val if r.returncode == 0 else 'BŁĄD: ' + r.stderr.strip()[:160]}")
        if r.returncode != 0:
            failures.append(f"kontrola: {label}")

    # --- 3. idempotencja ---------------------------------------------------
    r = psql_file("/tmp/up.sql")
    a = psql("SELECT count(*) FROM allocations").stdout.strip()
    u = psql("SELECT count(*) FROM audit_reports").stdout.strip()
    p = psql("SELECT count(*) FROM payment_orders").stdout.strip()
    s = psql("SELECT SUM(amount_pln_equivalent) FROM allocations").stdout.strip()
    print(f"\n  idempotencja (ponowne UP) -> error_code={r.returncode} "
          f"allocations={a} audits={u} payments={p} suma_pln={s}")
    if r.returncode != 0 or (a, u, p) != ("130", "130", "127"):
        failures.append("ponowne UP nie jest idempotentne")

    # --- 4. rollback -------------------------------------------------------
    print("\n===== TEST ROLLBACKU (006 → 001, wszystkie sekcje Down) =====")
    psql_file("/tmp/up.sql", db=DB_ROLLBACK)
    down = []
    for f in reversed(MIGRATIONS):
        down.append(f"\n-- ===== {f} (Down) =====")
        down.append(split_section(open(f"{BASE}/migrations/{f}").read(), "down"))
    open("/tmp/down.sql", "w").write("\n".join(down) + "\n")
    r = psql_file("/tmp/down.sql", db=DB_ROLLBACK)
    print("exit_code:", r.returncode)
    for e in [l for l in r.stderr.splitlines() if "ERROR" in l][:10]:
        print("   ", e)
    if r.returncode != 0:
        failures.append("rollback nieudany")
    else:
        left = psql("SELECT coalesce(string_agg(table_name, ', '), 'brak tabel') "
                    "FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'",
                    db=DB_ROLLBACK).stdout.strip()
        reg = psql("SELECT coalesce(to_regclass('public.schema_migrations')::text, 'usunieta')",
                   db=DB_ROLLBACK).stdout.strip()
        fn = psql("SELECT count(*) FROM pg_proc WHERE proname='patronai_set_updated_at'", db=DB_ROLLBACK).stdout.strip()
        vw = psql("SELECT count(*) FROM information_schema.views WHERE table_schema='public'", db=DB_ROLLBACK).stdout.strip()
        sq = psql("SELECT count(*) FROM pg_class WHERE relname='allocations_ledger_entry_no_seq'", db=DB_ROLLBACK).stdout.strip()
        print(f"  tabele po rollbacku      -> {left}")
        print(f"  schema_migrations        -> {reg}")
        print(f"  funkcja trig./widoki/seq -> {fn} / {vw} / {sq}")
        ok = ("brak tabel" in left and reg == "usunieta"
              and fn == "0" and vw == "0" and sq == "0")
        if not ok:
            failures.append("rollback pozostawil obiekty w bazie")

    r = subprocess.run([f"{PG_BIN}/pg_ctl", "-D", PGDATA, "-m", "fast", "stop"],
                       capture_output=True, text=True)
    print("\nstop serwera:", (r.stdout + r.stderr).strip().splitlines()[-1])

    print("\n===== WYNIK =====")
    if failures:
        print("NIEPOWODZENIA:")
        for f in failures:
            print("  -", f)
        return 1
    print("OK — schema.sql i migracje 001–006 wykonują się bez błędów; seed idempotentny; rollback czysty.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
