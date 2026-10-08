import { businessConfig as b } from "../config/businessConfig.js";
import { formatCurrency as money } from "./currency.js";
import { inverterOptions } from "./inverter-options.js";
export const enquiryMessage = `Hello ${b.shortName}, I would like to make an enquiry about your products.`;
export function whatsappUrl(message = enquiryMessage) {
  const number = b.whatsappNumber.replace(/\D/g, "");
  return /^\d{10,15}$/.test(number)
    ? `https://wa.me/${number}?text=${encodeURIComponent(message)}`
    : null;
}
export const productMessage = (product) =>
  `Hello ${b.shortName},\n\nI'm interested in:\n\nProduct: ${product.name}\nPrice: ${inverterOptions(product).length && product.kva == null ? `From ${money(Math.min(...inverterOptions(product).map(o => o.price)))} (capacity to be selected)` : money(product.price)}\n\nPlease send me more information about availability, warranty and delivery.\n\nThank you.`;
export function cartMessage(items, details = {}) {
  const productLines = items.map(({ product: p, quantity }, index) => [
    `*${index + 1}. ${p.name}*`,
    `Quantity: ${quantity} × ${money(p.price)} each`,
    `Subtotal: ${money(p.price == null ? null : p.price * quantity)}`,
    ...(p.slug ? [`View product & photo: ${b.websiteUrl.replace(/\/$/, "")}/product/${encodeURIComponent(p.slug)}`] : []),
  ].join("\n"));
  const total = items.some(({ product }) => product.price == null)
    ? "Quotation required (includes items with price on request)"
    : money(items.reduce((sum, { product, quantity }) => sum + product.price * quantity, 0));
  const delivery = [
    details.location?.trim() && `Delivery area: ${details.location.trim()}`,
    details.installation && `Installation: ${details.installation}`,
  ].filter(Boolean);
  return [
    `Hello ${b.shortName}, I would like to place an order.`,
    "*ORDER DETAILS*",
    ...productLines,
    `*ORDER TOTAL: ${total}*\nDelivery and installation charges are not included.`,
    ...(delivery.length ? [`*DELIVERY & INSTALLATION*\n${delivery.join("\n")}`] : []),
    ...(details.notes?.trim() ? [`*ADDITIONAL NOTES*\n${details.notes.trim()}`] : []),
    "Please confirm availability, warranty, delivery cost and next steps.",
    "Thank you.",
  ].join("\n\n");
}
