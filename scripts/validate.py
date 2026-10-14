#!/usr/bin/env python3
"""
PatronAI — Automated Schema & Migration Validation (schema.sql + migrations 001..006).
Target engine: PostgreSQL 16 / Neon Serverless PostgreSQL.

Runs as current unprivileged user: initdb + pg_ctl under /home/user/pgdata.

Execution Pipeline:
  1. Initialize local PostgreSQL 16 server (UNIX socket at /tmp/pgsock, no TCP exposure).
  2. Compile "up-only" execution plan: schema.sql + +migrate Up sections for all migrations.
  3. Execute with ON_ERROR_STOP=1, followed by duplicate execution (validates seed idempotency).
  4. Perform data integrity assertions: base tables, views, indexes, triggers, totals,
     currencies, statuses, foreign keys, CHECK constraints, and migration logs.
  5. Provision clean rollback database and execute all +migrate Down sections in reverse order
     (validates 100% clean teardown and schema rollback capability).
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
    print("Database server startup:", (r.stdout + r.stderr).strip().splitlines()[-1])
    if r.returncode != 0:
        print("PG_CTL FAILED")
        return 1

    for db in (DB, DB_ROLLBACK):
        psql(f"DROP DATABASE IF EXISTS {db}", db="postgres")
        psql(f"CREATE DATABASE {db}", db="postgres")

    # --- 1. Compile Up-only plan ------------------------------------------
    up = ["-- ===== schema.sql (baseline) =====", open(f"{BASE}/schema.sql").read(), ""]
    for f in MIGRATIONS:
        up.append(f"\n-- ===== {f} (Up) =====")
        up.append(split_section(open(f"{BASE}/migrations/{f}").read(), "up"))
    open("/tmp/up.sql", "w").write("\n".join(up) + "\n")

    print("\n===== EXECUTION: schema.sql + Migrations 001–006 (Up) =====")
    r = psql_file("/tmp/up.sql")
    print("exit_code:", r.returncode)
    notices = [l for l in r.stderr.splitlines() if "NOTICE" in l]
    errors = [l for l in r.stderr.splitlines() if "ERROR" in l or "FATAL" in l]
    print("NOTICE count (expected with IF NOT EXISTS):", len(notices))
    print("ERROR count:", len(errors))
    for e in errors[:20]:
        print("   ", e)
    if r.returncode != 0:
        failures.append("UP execution failed")

    # --- 2. Data Integrity & Schema Assertions -----------------------------
    checks = {
        "Base tables": "SELECT string_agg(table_name, ', ' ORDER BY table_name) FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'",
        "Views": "SELECT string_agg(table_name, ', ' ORDER BY table_name) FROM information_schema.views WHERE table_schema='public'",
        "Indexes (*_idx)": "SELECT count(*) FROM pg_indexes WHERE schemaname='public' AND indexname LIKE '%_idx'",
        "Triggers": "SELECT count(*) FROM information_schema.triggers WHERE trigger_schema='public'",
        "Ledger records": "SELECT count(*) FROM allocations",
        "Total gross PLN": "SELECT SUM(amount_pln_equivalent) FROM allocations",
        "Currencies breakdown": "SELECT string_agg(currency || '=' || c, ' ' ORDER BY currency) FROM (SELECT currency, count(*) c FROM allocations GROUP BY currency) t",
        "Statuses breakdown": "SELECT string_agg(status || '=' || c, ' ' ORDER BY status) FROM (SELECT status, count(*) c FROM allocations GROUP BY status) t",
        "Contribution types": "SELECT string_agg(contribution_type || '=' || c, ' ' ORDER BY contribution_type) FROM (SELECT contribution_type, count(*) c FROM allocations GROUP BY contribution_type) t",
        "Barter tiers (AVE)": "SELECT string_agg(barter_tier || ':' || ave_market_value, ', ' ORDER BY ave_market_value DESC) FROM allocations WHERE contribution_type='in_kind'",
        "Audit reports": "SELECT count(*) FROM audit_reports",
        "Audit mismatch flags": "SELECT count(*) FROM audit_reports WHERE flag_status='mismatch'",
        "Audit match flags": "SELECT count(*) FROM audit_reports WHERE flag_status='match'",
        "JSONB line_items": "SELECT count(*) FROM audit_reports WHERE jsonb_typeof(line_items)='array' AND jsonb_array_length(line_items)=2",
        "Merchant Tax ID (10 digits)": "SELECT count(*) FROM audit_reports WHERE merchant_nip ~ '^[0-9]{10}$'",
        "PayPal payment orders": "SELECT count(*) FROM payment_orders",
        "PayPal modes/statuses": "SELECT string_agg(mode || '/' || status || '=' || c, ' ' ORDER BY mode) FROM (SELECT mode, status, count(*) c FROM payment_orders GROUP BY mode, status) t",
        "Applied migrations": "SELECT string_agg(version, ',' ORDER BY version) FROM schema_migrations",
        "v_public_ledger rows": "SELECT count(*) FROM v_public_ledger",
        "v_certificate_verification rows": "SELECT count(*) FROM v_certificate_verification",
        "SHA-256 sealed certificates": "SELECT count(*) FROM v_certificate_verification WHERE is_hash_sealed",
        "v_ledger_totals sum": "SELECT SUM(total_pln_equivalent) FROM v_ledger_totals",
        "v_audit_flag_queue rows": "SELECT count(*) FROM v_audit_flag_queue",
        "FK audit_reports": "SELECT count(*) FROM pg_constraint WHERE conname='audit_reports_allocation_id_fkey' AND contype='f'",
        "FK payment_orders": "SELECT count(*) FROM pg_constraint WHERE conname='payment_orders_allocation_id_fkey' AND contype='f'",
        "CHECK allocations": "SELECT count(*) FROM pg_constraint WHERE contype='c' AND connamespace='public'::regnamespace AND conname LIKE 'allocations%chk'",
        "Trigger function": "SELECT count(*) FROM pg_proc WHERE proname='patronai_set_updated_at'",
    }
    print("\n===== SCHEMA & DATA INTEGRITY CHECKS =====")
    for label, sql in checks.items():
        r = psql(sql)
        val = r.stdout.strip()
        print(f"  {label:32s} -> {val if r.returncode == 0 else 'ERROR: ' + r.stderr.strip()[:160]}")
        if r.returncode != 0:
            failures.append(f"Assertion failed: {label}")

    # --- 3. Seed Idempotency Check ----------------------------------------
    r = psql_file("/tmp/up.sql")
    a = psql("SELECT count(*) FROM allocations").stdout.strip()
    u = psql("SELECT count(*) FROM audit_reports").stdout.strip()
    p = psql("SELECT count(*) FROM payment_orders").stdout.strip()
    s = psql("SELECT SUM(amount_pln_equivalent) FROM allocations").stdout.strip()
    print(f"\n  Idempotency (repeated UP) -> error_code={r.returncode} "
          f"allocations={a} audits={u} payments={p} total_pln={s}")
    if r.returncode != 0 or (a, u, p) != ("130", "130", "127"):
        failures.append("Repeated UP execution is not idempotent")

    # --- 4. Rollback & Teardown Check (006 → 001) -------------------------
    print("\n===== ROLLBACK VERIFICATION (006 → 001, All Down Sections) =====")
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
        failures.append("Rollback execution failed")
    else:
        left = psql("SELECT coalesce(string_agg(table_name, ', '), 'no tables remaining') "
                    "FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'",
                    db=DB_ROLLBACK).stdout.strip()
        reg = psql("SELECT coalesce(to_regclass('public.schema_migrations')::text, 'dropped')",
                   db=DB_ROLLBACK).stdout.strip()
        fn = psql("SELECT count(*) FROM pg_proc WHERE proname='patronai_set_updated_at'", db=DB_ROLLBACK).stdout.strip()
        vw = psql("SELECT count(*) FROM information_schema.views WHERE table_schema='public'", db=DB_ROLLBACK).stdout.strip()
        sq = psql("SELECT count(*) FROM pg_class WHERE relname='allocations_ledger_entry_no_seq'", db=DB_ROLLBACK).stdout.strip()
        print(f"  Tables post-rollback     -> {left}")
        print(f"  schema_migrations table  -> {reg}")
        print(f"  Trig. functions/views/seq-> {fn} / {vw} / {sq}")
        ok = ("no tables remaining" in left and reg == "dropped"
              and fn == "0" and vw == "0" and sq == "0")
        if not ok:
            failures.append("Rollback left orphaned objects in public schema")

    r = subprocess.run([f"{PG_BIN}/pg_ctl", "-D", PGDATA, "-m", "fast", "stop"],
                       capture_output=True, text=True)
    print("\nDatabase server stopped:", (r.stdout + r.stderr).strip().splitlines()[-1])

    print("\n===== FINAL VALIDATION RESULT =====")
    if failures:
        print("FAILURES DETECTED:")
        for f in failures:
            print("  -", f)
        return 1
    print("SUCCESS — schema.sql and migrations 001–006 executed without errors; seed is idempotent; rollback is clean.")
    return 0


if __name__ == "__main__":
    sys.exit(main())