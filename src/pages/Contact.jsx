import { useRef, useState } from "react";
import { Mail, Phone, MapPin, Clock, ArrowUpRight } from "lucide-react";
import { businessConfig as b } from "../config/businessConfig.js";
import { WhatsAppButton } from "../components/UI.jsx";
import { sendContact } from "../services/contactService.js";
export default function Contact() {
  const [status, setStatus] = useState("");
  const sending = useRef(false);
  const submit = async (e) => {
    e.preventDefault();
    if (sending.current) return;
    const form = e.currentTarget;
    if (!form.reportValidity()) return;
    const data = Object.fromEntries(new FormData(form));
    if (!data.name.trim() || !data.subject.trim() || !data.message.trim()) {
      setStatus("invalid");
      return;
    }
    sending.current = true;
    setStatus("sending");
    try {
      await sendContact(data);
      setStatus("success");
      form.reset();
    } catch {
      setStatus("error");
    } finally {
      sending.current = false;
    }
  };
  return (
    <>
      <div className="page-heading photo-page-heading banner-contact">
        <div className="container">
          <p className="eyebrow">LET’S START A CONVERSATION</p>
          <h1>How can we help?</h1>
          <p>
            Product questions, power advice or your next order. We’re here to
            help.
          </p>
        </div>
      </div>
      <section className="container section contact-grid">
        <div>
          <h2>Get in touch</h2>
          <p>Tell us what you need and our team will get back to you.</p>
          <div className="contact-info">
            {[
              [
                Phone,
                "Phone",
                b.phone || "Contact number will be available soon",
                b.phone ? "tel:" + b.phone : null,
              ],
              [
                Mail,
                "Email",
                b.email || "Use the form to email our team",
                b.email ? "mailto:" + b.email : null,
              ],
              [MapPin, "Visit us", b.address, null],
              [Clock, "Business hours", b.businessHours, null],
            ].map(([Icon, title, value, href]) => (
              <div key={title}>
                <Icon size={23} />
                <span>
                  <strong>{title}</strong>
                  {href ? <a href={href}>{value}</a> : <p>{value}</p>}
                </span>
              </div>
            ))}
          </div>
          <div className="contact-whatsapp">
            <h3>Prefer a quick chat?</h3>
            <p>Talk through your requirements on WhatsApp.</p>
            <WhatsAppButton />
          </div>
        </div>
        <form className="contact-form" onSubmit={submit}>
          <h2>Send us a message</h2>
          <div className="form-grid">
            <label>
              Full name <span>*</span>
              <input
                name="name"
                autoComplete="name"
                required
                minLength={2}
                maxLength={100}
                placeholder="Your full name"
              />
            </label>
            <label>
              Email address <span>*</span>
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                placeholder="you@example.com"
              />
            </label>
            <label>
              Phone number
              <input
                name="phone"
                type="tel"
                autoComplete="tel"
                maxLength={30}
                pattern={String.raw`[+0-9\(\) .\-]{6,30}`}
                placeholder="Your phone number (optional)"
              />
            </label>
            <label>
              Subject <span>*</span>
              <input
                name="subject"
                required
                minLength={2}
                maxLength={150}
                placeholder="How can we help?"
              />
            </label>
          </div>
          <label>
            Message <span>*</span>
            <textarea
              name="message"
              rows={6}
              required
              minLength={10}
              maxLength={5000}
              placeholder="Tell us about the products or solution you need…"
            />
          </label>
          <div className="honeypot" aria-hidden="true">
            <label>
              Website
              <input name="website" tabIndex={-1} autoComplete="off" />
            </label>
          </div>
          <p className="form-note">
            We’ll use these details to respond to your enquiry.
          </p>
          <button className="button green" disabled={status === "sending"}>
            {status === "sending" ? "Sending…" : "Send message"}
            <ArrowUpRight size={18} />
          </button>
          <div role="status" className={`form-status ${status}`}>
            {status === "success"
              ? "Thank you! Your message has been sent successfully. We'll get back to you shortly."
              : status === "error"
                ? "We couldn't send your message right now. Please try again or contact us on WhatsApp."
                : status === "invalid"
                  ? "Please enter your name, subject and message."
                  : ""}
          </div>
        </form>
      </section>
    </>
  );
}
