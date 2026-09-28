// Server-only: never import this module from src/.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const limits = {
  name: [2, 100],
  email: [3, 254],
  phone: [0, 30],
  subject: [2, 150],
  message: [10, 5000],
};
export function validateContact(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const data = {};
  for (const [key, [min, max]] of Object.entries(limits)) {
    if (key === "phone" && input[key] === undefined) {
      data[key] = "";
      continue;
    }
    if (typeof input[key] !== "string") return null;
    data[key] = input[key].trim();
    if (data[key].length < min || data[key].length > max) return null;
  }
  if (
    !EMAIL.test(data.email) ||
    /[\r\n]/.test(data.name + data.email + data.subject) ||
    (data.phone && !/^[+0-9() .-]{6,30}$/.test(data.phone))
  )
    return null;
  return data;
}
const attempts = new Map();
export function resetRateLimits() {
  attempts.clear();
}
function allow(ip) {
  const now = Date.now();
  for (const [key, item] of attempts)
    if (item.until < now) attempts.delete(key);
  const item = attempts.get(ip) || { count: 0, until: now + 600000 };
  item.count++;
  attempts.set(ip, item);
  return item.count <= 5;
}
export async function handleContact(
  { method, body, ip = "unknown", contentType = "application/json" },
  env = process.env,
  fetcher = fetch,
) {
  if (method !== "POST")
    return { status: 405, body: { error: "Method not allowed" } };
  if (!contentType.toLowerCase().includes("application/json"))
    return { status: 415, body: { error: "JSON required" } };
  if (!allow(ip))
    return {
      status: 429,
      body: { error: "Too many requests. Please try again later." },
    };
  let input;
  try {
    if (
      Buffer.byteLength(
        typeof body === "string" ? body : JSON.stringify(body ?? null),
      ) > 12000
    )
      return { status: 413, body: { error: "Request too large" } };
    input = typeof body === "string" ? JSON.parse(body) : body;
  } catch {
    return { status: 400, body: { error: "Invalid JSON" } };
  }
  if (input?.website) return { status: 200, body: { success: true } };
  const data = validateContact(input);
  if (!data)
    return {
      status: 400,
      body: { error: "Please check your contact details and message." },
    };
  if (
    !env.BREVO_API_KEY ||
    !EMAIL.test(env.CONTACT_RECEIVER_EMAIL || "") ||
    !EMAIL.test(env.CONTACT_SENDER_EMAIL || "")
  )
    return {
      status: 503,
      body: { error: "Contact service is not configured" },
    };
  try {
    const response = await fetcher("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": env.BREVO_API_KEY,
        "Content-Type": "application/json",
        accept: "application/json",
      },
      signal: AbortSignal.timeout(12000),
      body: JSON.stringify({
        sender: {
          name: env.CONTACT_SENDER_NAME || "Website enquiries",
          email: env.CONTACT_SENDER_EMAIL,
        },
        to: [{ email: env.CONTACT_RECEIVER_EMAIL }],
        replyTo: { name: data.name, email: data.email },
        subject: `New Website Enquiry - ${data.subject}`,
        textContent: `Customer Name: ${data.name}\nCustomer Email: ${data.email}\nPhone: ${data.phone || "Not provided"}\nSubject: ${data.subject}\nDate/Time: ${new Date().toISOString()}\n\nMessage:\n${data.message}`,
      }),
    });
    if (!response.ok)
      return { status: 502, body: { error: "Unable to send message" } };
    return { status: 200, body: { success: true } };
  } catch {
    return { status: 502, body: { error: "Unable to send message" } };
  }
}
