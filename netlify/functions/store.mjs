import { handleStore } from "../../server/store.js";
export const handler = async (event) => {
  const result = await handleStore({
    method: event.httpMethod,
    query: event.queryStringParameters || {},
    body: event.isBase64Encoded
      ? Buffer.from(event.body || "", "base64").toString()
      : event.body,
    contentType: event.headers["content-type"],
    token: (event.headers.authorization || "").replace(/^Bearer /i, ""),
    ip: event.headers["x-nf-client-connection-ip"] || "unknown",
  });
  return {
    statusCode: result.status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
    body: JSON.stringify(result.body),
  };
};
