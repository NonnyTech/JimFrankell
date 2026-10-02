export async function storeRequest(
  resource,
  { method = "GET", body, token, query = {}, signal } = {},
) {
  const response = await fetch(
    `/api/store?${new URLSearchParams({ resource, ...query })}`,
    {
      method,
      signal: signal || AbortSignal.timeout(20000),
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    },
  );
  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error("The service is unavailable. Please try again.");
  }
  if (!response.ok) {
    const error = new Error(result.error || "The request could not be completed.");
    error.status = response.status;
    throw error;
  }
  return result;
}
