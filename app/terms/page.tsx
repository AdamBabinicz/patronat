export default function Terms() {
  return (
    <main className="min-h-screen bg-background px-5 py-16 text-foreground">
      <article className="mx-auto max-w-3xl">
        <a href="/" className="text-sm text-muted-foreground">
          {" "}
          PatronAI
        </a>
        <h1 className="mt-10 text-5xl tracking-tight">Terms of Use</h1>
        {[
          [
            "1. Service",
            "PatronAI is a pilot interface that helps supporters identify and fund transparent club needs.",
          ],
          [
            "2. Pledges and payments",
            "Payment is processed through PayPal Sandbox in this demonstration. A pledge is confirmed only after the payment provider confirms the transaction.",
          ],
          [
            "3. Certificates",
            "Certificates are proof of a recorded contribution and do not constitute a tax document unless expressly stated.",
          ],
          [
            "4. Acceptable use",
            "Do not submit unlawful, misleading, harmful, or third-party confidential content. We may suspend abusive use.",
          ],
          [
            "5. Changes",
            "We may update these terms as the pilot evolves. The current version is published on this page.",
          ],
        ].map(([heading, body]) => (
          <section key={heading} className="mt-10">
            <h2 className="text-xl font-semibold">{heading}</h2>
            <p className="mt-3 leading-7 text-muted-foreground">{body}</p>
          </section>
        ))}
      </article>
    </main>
  );
}
