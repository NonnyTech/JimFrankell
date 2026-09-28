import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  ShieldCheck,
} from "lucide-react";
import { WhatsAppButton } from "./UI.jsx";
import "../styles/hero-slideshow.css";

// Separate owner-supplied images. object-fit preserves their original proportions.
export const heroSlides = [
  {
    name: "Power for everyday living",
    src: "/images/hero/solar-family.webp",
    description:
      "Family beside a solar-powered home and energy storage systems",
  },
  {
    name: "Expert solar guidance",
    src: "/images/hero/solar-team.webp",
    description:
      "Two solar professionals reviewing a system beside solar panels",
  },
  {
    name: "A brighter home",
    src: "/images/hero/solar-garden.webp",
    description:
      "Family relaxing in the garden of a solar-powered home at sunset",
  },
  {
    name: "Energy for what matters",
    src: "/images/hero/solar-living.webp",
    description:
      "Family outside a modern home with solar panels and battery storage",
  },
];

export default function HeroSlideshow() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(
    () => typeof document !== "undefined" && document.hidden,
  );
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotion = () => setReducedMotion(media.matches);
    const onVisibility = () => setHidden(document.hidden);
    media.addEventListener("change", onMotion);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      media.removeEventListener("change", onMotion);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);
  useEffect(() => {
    if (paused || reducedMotion || focused || hidden) return;
    const timer = setInterval(
      () => setActive((index) => (index + 1) % heroSlides.length),
      6000,
    );
    return () => clearInterval(timer);
  }, [paused, reducedMotion, focused, hidden]);
  const select = (index) => {
    setActive((index + heroSlides.length) % heroSlides.length);
    setPaused(true);
  };
  return (
    <section
      className="photo-hero"
      aria-label="Solar and home energy highlights"
      aria-roledescription="carousel"
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setFocused(false);
      }}
    >
      <div className="photo-hero-scenes">
        {heroSlides.map((slide, index) => (
          <img
            key={slide.name}
            className={`photo-hero-scene ${index === active ? "is-active" : ""}`}
            src={slide.src}
            width={1774}
            height={887}
            alt={slide.description}
            fetchPriority={index === 0 ? "high" : "low"}
            decoding="async"
            aria-hidden={index !== active}
          />
        ))}
        <div className="photo-hero-shade" />
      </div>
      <div className="container photo-hero-content">
        <div className="photo-hero-copy">
          <p className="eyebrow">
            <span className="green-dot" /> SMART ENERGY. BETTER LIVING.
          </p>
          <h1>
            Power your home.
            <br />
            <span>Power your future.</span>
          </h1>
          <p className="photo-hero-description">
            Solar security cameras, inverters, lithium batteries and power
            solutions for homes and businesses in Lagos.
          </p>
          <div className="hero-buttons">
            <Link to="/shop" className="button green">
              Shop products <ArrowUpRight size={19} />
            </Link>
            <WhatsAppButton className="button outline" />
          </div>
          <div className="photo-hero-note">
            <ShieldCheck size={18} /> Quality you can trust. Support you can
            count on.
          </div>
        </div>
        <div className="slideshow-controls">
          <div className="slide-caption" aria-live={paused ? "polite" : "off"}>
            <span>0{active + 1} / 04</span>
            {heroSlides[active].name}
          </div>
          <div className="slide-buttons">
            <button
              aria-label="Previous image"
              onClick={() => select(active - 1)}
            >
              <ChevronLeft size={19} />
            </button>
            <div className="slide-dots">
              {heroSlides.map((slide, index) => (
                <button
                  key={slide.name}
                  aria-label={`Show image ${index + 1}: ${slide.name}`}
                  aria-pressed={index === active}
                  onClick={() => select(index)}
                >
                  <span />
                </button>
              ))}
            </div>
            <button aria-label="Next image" onClick={() => select(active + 1)}>
              <ChevronRight size={19} />
            </button>
            {!reducedMotion && (
              <button
                aria-label={paused ? "Play slideshow" : "Pause slideshow"}
                onClick={() => {
                  setPaused((value) => !value);
                  setFocused(false);
                }}
              >
                {paused ? <Play size={16} /> : <Pause size={16} />}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
