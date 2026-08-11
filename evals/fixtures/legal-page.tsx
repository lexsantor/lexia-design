// Eval fixture: bilingual legal page carrying the Tier-1 i18n, reveal and copy
// defects (LD-A11Y-03, LD-MOT-01, LD-I18N-01, LD-I18N-03, LD-SLOP-01, LD-UX-01).
import { NextIntlClientProvider } from "next-intl";
import { Reveal } from "@/components/Reveal";

export default function PrivacyPage({ messages }: { messages: Record<string, unknown> }) {
  return (
    <NextIntlClientProvider messages={messages}>
      <Reveal>
        <h1 className="text-5xl">Privacy policy</h1>
      </Reveal>

      <div className="grid grid-cols-[340px_1fr] gap-8">
        <aside className="order-last">
          <img src="/img/office.jpg" alt="Our office" width="340" height="440" />
        </aside>
        <Reveal>
          <p>
            We store your data in the European Union. Contact us at
            privacy@example.com or +34 900 000 000.
          </p>
          <p>
            This is not a formality, it is how we operate. Not only do we limit
            retention but also we publish every processor we use.
          </p>
        </Reveal>
      </div>

      <footer>
        <a href="/es/contacto/">Contacto</a>
        <a href="/ca/contacte/">Contacte</a>
      </footer>
    </NextIntlClientProvider>
  );
}
