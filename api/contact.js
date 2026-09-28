import { handleContact } from "../server/contact.js";
export default async function handler(req, res) {
  const result = await handleContact({
    method: req.method,
    body: req.body,
    ip: req.headers["x-real-ip"] || req.socket?.remoteAddress || "unknown",
    contentType: req.headers["content-type"] || "",
  });
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Allow", "POST");
  res.status(result.status).json(result.body);
}
