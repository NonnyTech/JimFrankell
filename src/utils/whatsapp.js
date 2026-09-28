import { businessConfig as b } from "../config/businessConfig.js";
import { formatCurrency as money } from "./currency.js";
export const enquiryMessage = `Hello ${b.shortName}, I would like to make an enquiry about your products.`;
export function whatsappUrl(message = enquiryMessage) {
  const number = b.whatsappNumber.replace(/\D/g, "");
  return /^\d{10,15}$/.test(number)
    ? `https://wa.me/${number}?text=${encodeURIComponent(message)}`
    : null;
}
export const productMessage = (product) =>
  `Hello ${b.shortName},\n\nI'm interested in:\n\nProduct: ${product.name}\nPrice: ${money(product.price)}\n\nPlease send me more information about availability, warranty and delivery.\n\nThank you.`;
export function cartMessage(items) {
  return `Hello ${b.shortName},\n\nI'm interested in purchasing the following products:\n\n${items.map(({ product: p, quantity }, i) => `${i + 1}. ${p.name}\nQuantity: ${quantity}\nUnit Price: ${money(p.price)}\nSubtotal: ${money(p.price == null ? null : p.price * quantity)}`).join("\n\n")}\n\nORDER TOTAL: ${items.some((i) => i.product.price == null) ? "Quotation required (includes items with price on request)" : money(items.reduce((sum, i) => sum + i.product.price * i.quantity, 0))}\n\nPlease confirm availability, delivery cost and next steps.\n\nThank you.`;
}
