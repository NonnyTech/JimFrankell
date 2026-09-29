import { businessConfig as b } from "../config/businessConfig.js";
import { products } from "../data/products.js";
export const publicRoutes = ["/", "/shop", "/about", "/contact", "/faq"];
export const renderRoutes = [
  ...publicRoutes,
  "/cart",
  ...products.map((p) => `/product/${p.slug}`),
  "/404",
];
export function siteOrigin(value = b.websiteUrl) {
  if (!value) return "";
  const url = new URL(value);
  if (
    url.protocol !== "https:" ||
    url.pathname !== "/" ||
    url.search ||
    url.hash ||
    url.username ||
    url.password ||
    /^(localhost|127\.|example\.)/.test(url.hostname)
  )
    throw Error(
      "websiteUrl must be your real HTTPS origin, with no path or query.",
    );
  return url.origin;
}
export function pageSEO(pathname, search = "", origin = siteOrigin()) {
  const path = pathname.replace(/\/+$/, "") || "/";
  const product = products.find((p) => path === `/product/${p.slug}`);
  const info = {
    "/": [
      "Solar CCTV Cameras & Power Solutions in Lagos",
      `Shop solar security cameras, inverters, batteries and power solutions at ${b.companyName}, Lagos. Contact our team on WhatsApp for prices and advice.`,
    ],
    "/shop": [
      "Shop Solar Cameras, Inverters & Batteries in Lagos",
      "Explore solar CCTV cameras, spy cameras, solar panels, batteries, inverters and solar accessories. Compare products and request a quotation from our Lagos team.",
    ],
    "/about": [
      "About Our Solar & Security Business in Lagos",
      `Meet ${b.companyName}: solar security cameras, power products and solar accessories in Lagos. Learn about our approach and contact our team.`,
    ],
    "/contact": [
      "Contact Us in Lagos | Open 24 Hours",
      `Contact ${b.companyName} at ${b.address}. Call ${b.phone} or enquire on WhatsApp. Open 24 hours for product enquiries.`,
    ],
    "/faq": [
      "Solar Camera & Power Product FAQs",
      "Get answers about ordering solar security cameras, delivery enquiries, warranties, inverter selection and installation availability.",
    ],
    "/cart": [
      "Your Enquiry Cart",
      "Review your selected products and continue your enquiry on WhatsApp.",
    ],
  };
  const [title, description] = product
    ? [
        `${product.name} in Lagos`,
        `${product.shortDescription} Enquire with ${b.companyName}, Lagos, for confirmed pricing, availability, warranty and delivery.`,
      ]
    : info[path] || [
        "Page Not Found",
        "This page could not be found. Explore our solar security and power product catalog.",
      ];
  const indexable =
    !!origin && (publicRoutes.includes(path) || (product && !product.isSample));
  const filtered =
    path === "/shop" &&
    ["q", "category", "brand", "stock", "sort"].some((key) =>
      new URLSearchParams(search).has(key),
    );
  const canonical =
    origin && (info[path] || product)
      ? origin + (path === "/" ? "/" : path)
      : "";
  const image = product?.images[0] || "/images/brand/jf-share-logo.png";
  const graph = [];
  if (origin && indexable) {
    const businessId = origin + "/#business";
    graph.push({
      "@type": "Store",
      "@id": businessId,
      name: b.companyName,
      logo: origin + "/images/brand/jf-share-logo.png",
      url: origin + "/",
      telephone: `+${b.whatsappNumber}`,
      email: b.email,
      address: {
        "@type": "PostalAddress",
        streetAddress: b.address,
        addressLocality: "Lagos",
        addressCountry: "NG",
      },
      openingHours: "Mo-Su 00:00-23:59",
      image: origin + "/images/about-camera-installation.png",
      sameAs: Object.values(b.socialLinks).filter(Boolean),
    });
    graph.push({
      "@type": "WebSite",
      "@id": origin + "/#website",
      url: origin + "/",
      name: b.companyName,
      publisher: { "@id": businessId },
    });
    graph.push({
      "@type":
        path === "/contact"
          ? "ContactPage"
          : path === "/about"
            ? "AboutPage"
            : "WebPage",
      "@id": canonical + "#page",
      url: canonical,
      name: `${title} | ${b.companyName}`,
      description,
      isPartOf: { "@id": origin + "/#website" },
    });
    if (path !== "/")
      graph.push({
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: origin + "/",
          },
          ...(product
            ? [
                {
                  "@type": "ListItem",
                  position: 2,
                  name: "Shop",
                  item: origin + "/shop",
                },
              ]
            : []),
          {
            "@type": "ListItem",
            position: product ? 3 : 2,
            name: product?.name || title,
            item: canonical,
          },
        ],
      });
    // Quote-only products intentionally have no Offer, invented price or review.
    if (product)
      graph.push({
        "@type": "Product",
        name: product.name,
        description: product.description,
        image: product.images.map((img) => origin + img),
        url: canonical,
        sku: product.specifications["Enquiry reference"] || String(product.id),
        category: product.category,
      });
  }
  return {
    title: `${title} | ${b.companyName}`,
    description,
    shareTitle: product ? `${product.name} | ${b.companyName}` : `${b.companyName} | Solar & Security Solutions`,
    imageAlt: product ? product.name : `${b.companyName} green JF shield logo`,
    imageType: product ? "" : "image/png",
    imageSize: product ? null : 600,
    canonical,
    image: origin ? origin + image : "",
    robots:
      indexable && !filtered
        ? "index, follow, max-image-preview:large"
        : "noindex, follow",
    graph,
    verification: b.googleSiteVerification,
  };
}
export const escapeHTML = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
export function seoHead(seo) {
  const meta = (name, value, property = false) =>
    `<meta ${property ? "property" : "name"}="${name}" content="${escapeHTML(value)}" data-seo>`;
  return (
    `<title>${escapeHTML(seo.title)}</title>` +
    meta("description", seo.description) +
    meta("robots", seo.robots) +
    meta("og:title", seo.shareTitle || seo.title, true) +
    meta("og:description", seo.description, true) +
    meta("og:type", "website", true) +
    meta("og:site_name", b.companyName, true) +
    meta("og:locale", "en_NG", true) +
    meta("twitter:card", seo.imageSize ? "summary" : "summary_large_image") +
    meta("twitter:title", seo.title) +
    meta("twitter:description", seo.description) +
    (seo.canonical
      ? `<link rel="canonical" href="${escapeHTML(seo.canonical)}" data-seo>` +
        meta("og:url", seo.canonical, true)
      : "") +
    (seo.image
      ? meta("og:image", seo.image, true) +
        meta("og:image:alt", seo.imageAlt || seo.title, true) +
        (seo.imageType ? meta("og:image:type", seo.imageType, true) : "") +
        (seo.imageSize ? meta("og:image:width", seo.imageSize, true) + meta("og:image:height", seo.imageSize, true) : "") +
        meta("twitter:image", seo.image) + meta("twitter:image:alt", seo.imageAlt || seo.title)
      : "") +
    (seo.verification
      ? meta("google-site-verification", seo.verification)
      : "") +
    (seo.graph.length
      ? `<script type="application/ld+json" data-seo>${JSON.stringify({ "@context": "https://schema.org", "@graph": seo.graph }).replace(/</g, "\\u003c")}</script>`
      : "")
  );
}
