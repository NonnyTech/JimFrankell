// PRODUCT NAMES, PRICES AND SPECIFICATIONS ARE SAMPLE DATA. Replace with the
// owner's verified inventory, photography, stock and warranty terms before production.
import { securityProducts } from "./securityProducts.js";
import { newProducts } from "./newProducts.js";
export const categoryDefinitions = [
  {
    name: "Solar Security Cameras",
    description: "Solar-powered security options",
    image: "/images/products/jf/white-triple-camera.webp",
  },
  {
    name: "Spy Cameras",
    description: "Compact security camera designs",
    image: "/images/products/jf/spy-clock-cutout.webp",
  },
  ...[
    ["Solar Panels", "Clean energy starts here", "panel"],
    ["Inverters", "Power without interruption", "inverter"],
    ["Lithium Batteries", "Store more. Power longer.", "lithium"],
    ["Solar Batteries", "Dependable energy storage", "battery"],
    ["Solar Kits", "Your complete power solution", "kit"],
    ["Accessories", "Every connection matters", "accessories"],
  ].map(([name, description, image]) => ({
    name,
    description,
    image:
      image === "panel"
        ? "/images/products/jf/panel-cutout.webp"
        : image === "inverter"
          ? "/images/products/jf/hybrid-cutout.webp"
          : `/images/products/jf/${image}.svg`,
  })),
];
const rows = [
  [
    "5KVA Hybrid Inverter",
    "Inverters",
    425000,
    "inverter",
    { Capacity: "5KVA", Voltage: "48V", Type: "Hybrid" },
    true,
    true,
  ],
  [
    "10kWh Lithium Battery",
    "Lithium Batteries",
    1450000,
    "lithium",
    {
      Capacity: "10kWh",
      Voltage: "51.2V",
      Chemistry: "LiFePO4",
      "Cycle life": "6000+",
    },
    true,
    true,
  ],
  [
    "550W Mono Solar Panel",
    "Solar Panels",
    125000,
    "panel",
    {
      Power: "550W",
      Technology: "Monocrystalline",
      "System voltage": "Up to 1500V",
    },
    true,
    true,
  ],
  [
    "Complete 5KVA Solar Kit",
    "Solar Kits",
    2850000,
    "kit",
    { Inverter: "5KVA", Storage: "5kWh", Panels: "6 × 550W" },
    true,
    true,
  ],
  [
    "10KVA Hybrid Inverter",
    "Inverters",
    890000,
    "inverter",
    { Capacity: "10KVA", Voltage: "48V", Type: "Hybrid" },
  ],
  [
    "3.5KVA Inverter",
    "Inverters",
    285000,
    "inverter",
    { Capacity: "3.5KVA", Voltage: "24V", Output: "Pure sine wave" },
  ],
  [
    "15kWh Lithium Battery",
    "Lithium Batteries",
    2100000,
    "lithium",
    { Capacity: "15kWh", Voltage: "51.2V", Chemistry: "LiFePO4" },
  ],
  [
    "5kWh Lithium Battery",
    "Lithium Batteries",
    780000,
    "lithium",
    { Capacity: "5kWh", Voltage: "51.2V", Chemistry: "LiFePO4" },
  ],
  [
    "450W Solar Panel",
    "Solar Panels",
    95000,
    "panel",
    { Power: "450W", Technology: "Monocrystalline" },
  ],
  [
    "200Ah Solar Battery",
    "Solar Batteries",
    310000,
    "battery",
    { Capacity: "200Ah", Voltage: "12V", Type: "Deep cycle AGM" },
  ],
  [
    "Complete 10KVA Solar Kit",
    "Solar Kits",
    4950000,
    "kit",
    { Inverter: "10KVA", Storage: "10kWh", Panels: "12 × 550W" },
  ],
  [
    "100W Solar Flood Light",
    "Accessories",
    55000,
    "light",
    { Power: "100W", Protection: "IP65", Control: "Remote" },
  ],
  [
    "Solar Accessories Kit",
    "Accessories",
    45000,
    "accessories",
    {
      Includes: "Connectors, cables and mounting brackets",
      Application: "Solar panel installation",
    },
  ],
];
export const sampleProducts = rows.map(
  (
    [
      name,
      category,
      price,
      image,
      specifications,
      featured = false,
      bestSeller = false,
    ],
    index,
  ) => ({
    id: index < 11 ? index + 1 : index + 4, // Keep saved cart IDs stable after removing unrelated products.
    isSample: true,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name,
    category,
    brand: "Solar Series",
    price,
    oldPrice: index === 0 ? 460000 : index === 2 ? 140000 : null,
    shortDescription:
      categoryDefinitions.find((c) => c.name === category).description + ".",
    description: `${name} is a sample catalog option for homes and businesses. Discuss your power requirements with our team to confirm the right configuration, compatibility and available models before ordering.`,
    images: [
      `/images/products/jf/${image}.svg`,
      `/images/products/jf/${image}-detail.svg`,
    ],
    inStock: index !== 10,
    featured: false,
    bestSeller,
    specifications,
    warranty:
      "Confirm the manufacturer’s warranty and terms with our team before ordering.",
  }),
);
export const products = [...securityProducts, ...newProducts];
export const categories = categoryDefinitions.filter(category => products.some(product => product.category === category.name));
