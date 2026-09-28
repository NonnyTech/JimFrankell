// Owner-supplied photography. Descriptive names identify the pictured designs;
// exact model, brand, pricing, availability and technical ratings need confirmation.
const photos = [
  [
    "Solar Camera & Floodlight",
    "camera-floodlight",
    "Combined lighting and camera design.",
  ],
  [
    "White Triple-Head Solar Camera",
    "white-triple-camera",
    "White multi-camera design with a solar panel.",
  ],
  [
    "4G Dual-Head Solar Camera",
    "4g-dual-camera",
    "Dual-camera design marked 4G with a solar panel.",
  ],
  [
    "Solar Camera & Floodlight Array",
    "camera-floodlight-array",
    "Multi-camera design with three light panels.",
  ],
  [
    "JF Solar Camera — 3 Working Lenses",
    "silver-multi-camera",
    "Three working lenses in a silver solar camera design.",
  ],
  [
    "JF Four-Lens Solar Camera — Black",
    "black-multi-camera",
    "Four working lenses in a black solar camera design.",
  ],
  [
    "White Dual-Head Solar Camera",
    "white-dual-camera",
    "White dual-camera design with a solar panel.",
  ],
  [
    "4G Solar Security Camera",
    "4g-solar-camera",
    "Solar camera design marked for 4G SIM connectivity.",
  ],
];
export const securityProducts = photos.map(
  ([name, image, shortDescription], index) => ({
    id: 101 + index,
    slug: image,
    name,
    category: "Solar Security Cameras",
    brand: "Jim-Frankell Ltd",
    price: null,
    oldPrice: null,
    shortDescription,
    description: `${shortDescription} Contact our team with reference SC-${String(index + 1).padStart(2, "0")} to confirm the exact model, price, availability, connectivity and installation requirements before ordering.`,
    images: [
      `/images/products/jf/${image === "camera-floodlight" ? "camera-floodlight-cutout" : image}.webp`,
      ...(image === "silver-multi-camera"
        ? ["/images/products/jf/silver-cutout.webp"]
        : []),
      ...(image === "black-multi-camera"
        ? ["/images/products/jf/branded-four-lens-cutout.webp"]
        : []),
    ],
    inStock: true, // Enables enquiry carts; not a stock assertion (see stockLabel).
    stockLabel: "Confirm availability",
    featured: true,
    featuredRank:
      image === "silver-multi-camera"
        ? 5
        : image === "black-multi-camera"
          ? 6
          : 100,
    bestSeller: false,
    specifications: {
      ...(image === "silver-multi-camera"
        ? { "Working lenses": "3" }
        : image === "black-multi-camera"
          ? { "Working lenses": "4" }
          : {}),
      "Enquiry reference": `SC-${String(index + 1).padStart(2, "0")}`,
      "Model & technical specifications": "Please confirm with our team",
    },
    warranty:
      "Please confirm the warranty and terms for your selected model before ordering.",
  }),
);
