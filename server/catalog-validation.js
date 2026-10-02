// Shared request validation for product management and customer feedback.
// Authentication and database permissions must be enforced separately.
export const productCategories = [
  "Solar Security Cameras",
  "Spy Cameras",
  "Solar Panels",
  "Inverters",
  "Lithium Batteries",
  "Solar Batteries",
  "Solar Kits",
  "Accessories",
];

function text(value, label, min, max) {
  if (
    typeof value !== "string" ||
    value.trim().length < min ||
    value.trim().length > max
  )
    throw new Error(`${label} must contain ${min}–${max} characters.`);
  return value.trim();
}

export function validateProduct(input) {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new Error("Invalid product.");
  const name = text(input.name, "Product name", 2, 120);
  const slug = text(input.slug, "Product URL", 2, 140);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))
    throw new Error(
      "Use lowercase letters, numbers and hyphens for the product URL.",
    );
  if (!productCategories.includes(input.category))
    throw new Error("Choose a valid category.");
  if (
    input.price !== null &&
    (typeof input.price !== "number" ||
      !Number.isFinite(input.price) ||
      input.price <= 0 ||
      input.price > 1_000_000_000 ||
      Math.abs(input.price * 100 - Math.round(input.price * 100)) > 0.0001)
  )
    throw new Error(
      "Enter a positive price with at most two decimal places, or leave it as price on request.",
    );
  if (
    !Array.isArray(input.images) ||
    !input.images.length ||
    input.images.length > 8
  )
    throw new Error("Add between one and eight product photos.");
  const images = input.images.map((value) => {
    const image = text(value, "Image URL", 1, 2048);
    if (!/^\/images\/[a-zA-Z0-9_./-]+$/.test(image)) {
      let url;
      try {
        url = new URL(image);
      } catch {
        throw new Error("Use a valid HTTPS image URL.");
      }
      if (url.protocol !== "https:" || url.username || url.password)
        throw new Error("Use a valid HTTPS image URL.");
    }
    return image;
  });
  if (
    !input.specifications ||
    typeof input.specifications !== "object" ||
    Array.isArray(input.specifications) ||
    Object.keys(input.specifications).length > 30
  )
    throw new Error("Enter up to 30 product specifications.");
  const specifications = Object.fromEntries(
    Object.entries(input.specifications).map(([key, value]) => [
      text(key, "Specification name", 1, 80),
      text(value, "Specification value", 1, 300),
    ]),
  );
  for (const field of ["inStock", "featured", "published"]) {
    if (typeof input[field] !== "boolean")
      throw new Error(`Invalid ${field} setting.`);
  }
  return {
    name,
    slug,
    category: input.category,
    price: input.price,
    images,
    specifications,
    brand: text(input.brand, "Brand", 1, 100),
    shortDescription: text(input.shortDescription, "Short description", 5, 240),
    description: text(input.description, "Description", 10, 10000),
    warranty: text(input.warranty, "Warranty information", 5, 1000),
    inStock: input.inStock,
    featured: input.featured,
    published: input.published,
  };
}

export function validateFeedback(input) {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new Error("Invalid feedback.");
  if (!Number.isSafeInteger(input.productId) || input.productId <= 0)
    throw new Error("Choose a valid product.");
  const email = text(input.email, "Email", 3, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new Error("Enter a valid email address.");
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5)
    throw new Error("Choose a rating from 1 to 5.");
  if (input.consent !== true)
    throw new Error("Please agree to submit your feedback.");
  return {
    productId: input.productId,
    name: text(input.name, "Display name", 2, 80),
    email,
    rating: input.rating,
    message: text(input.message, "Feedback", 10, 3000),
  };
}
