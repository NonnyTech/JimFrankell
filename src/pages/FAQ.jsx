import { faqs } from "../data/faqs.js";
import { WhatsAppButton } from "../components/UI.jsx";
export default function FAQ() {
  return (
    <>
      <div className="page-heading photo-page-heading banner-faq">
        <div className="container"><p className="eyebrow">A LITTLE CLARITY GOES A LONG WAY</p>
        <h1>Frequently asked questions</h1>
        <p>Everything you need to take the next step.</p></div>
      </div>
      <section className="container section faq-wrap">
        {faqs.map(([q, a]) => (
          <details key={q}>
            <summary>
              {q}
              <span>+</span>
            </summary>
            <p>{a}</p>
          </details>
        ))}
        <div className="help-card">
          <h2>Still have a question?</h2>
          <p>Let’s find the right answer together.</p>
          <WhatsAppButton />
        </div>
      </section>
    </>
  );
}
