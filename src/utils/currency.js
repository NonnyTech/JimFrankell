import { businessConfig } from "../config/businessConfig.js";
export const formatCurrency = (value) =>
  value === null || value === undefined
    ? "Price on request"
    : new Intl.NumberFormat(businessConfig.locale, {
        style: "currency",
        currency: businessConfig.currency,
        maximumFractionDigits: 0,
      }).format(value);
