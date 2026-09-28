import { handleContact } from "../../server/contact.js";
export const handler = async (event) => {
  const result = await handleContact({
    method: event.httpMethod,
    body: event.isBase64Encoded
      ? Buffer.from(event.body, "base64").toString()
      : event.body,
    ip: event.headers["x-nf-client-connection-ip"] || "unknown",
    contentType: event.headers["content-type"] || "",
  });
  return {
    statusCode: result.status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      Allow: "POST",
    },
    body: JSON.stringify(result.body),
  };
};
