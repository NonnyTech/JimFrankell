// Owner-supplied September 2026 media. No unconfirmed prices or ratings.
const arrivals = [
  {
    id: 201,
    slug: "jf-clock-spy-camera",
    name: "JF Clock Spy Camera",
    category: "Spy Cameras",
    image: "spy-clock",
    shortDescription: "Discreet camera in a digital clock design.",
  },
  {
    id: 202,
    slug: "jf-round-spy-camera",
    name: "JF Round Spy Camera",
    category: "Spy Cameras",
    image: "spy-round",
    shortDescription: "Compact camera in a round ceiling-style housing.",
  },
  {
    id: 203,
    slug: "jf-four-lens-solar-camera",
    name: "JF Solar Camera — 4 Working Lenses",
    category: "Solar Security Cameras",
    image: "camera-four",
    shortDescription:
      "Four working lenses in a multi-head solar camera design.",
    specifications: { "Working lenses": "4" },
  },
  {
    id: 204,
    slug: "jf-solar-panel",
    name: "JF Solar Panel",
    category: "Solar Panels",
    image: "panel",
    shortDescription: "Solar panels for home and business power systems.",
    video: "/videos/jf-solar-panels.mp4",
  },
  {
    id: 205,
    slug: "jf-hybrid-solar-inverter",
    name: "JF Hybrid Solar Inverter",
    category: "Inverters",
    image: "hybrid",
    shortDescription: "Hybrid solar inverter in a yellow metal housing.",
    video: "/videos/jf-hybrid-inverter.mp4",
  },
];

export const newProducts = arrivals.map(
  ({ image, specifications, video, ...p }, index) => ({
    ...p,
    brand: "Jim-Frankell Ltd",
    price: null,
    oldPrice: null,
    images: [`/images/products/jf/${image}-cutout.webp`],
    videos: video
      ? [{ src: video, title: `${p.name} — original product video` }]
      : [],
    description: `${p.shortDescription} Contact Jim-Frankell Ltd to confirm the available model, specifications, pricing and installation requirements.`,
    inStock: true,
    stockLabel: "Confirm availability",
    featured: true,
    featuredRank: index,
    bestSeller: false,
    specifications: {
      "Enquiry reference": `JF-${p.id}`,
      ...specifications,
      "Model & technical specifications": "Please confirm with our team",
    },
    warranty:
      "Please confirm the warranty and terms for your selected model before ordering.",
  }),
);
