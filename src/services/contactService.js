export async function sendContact(data) {
  const response = await fetch("/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error("Unable to send message");
  return response.json();
}
