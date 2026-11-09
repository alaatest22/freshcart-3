export const API_BASE =
  import.meta.env.VITE_API_URL || "https://ecommerce.routemisr.com/api/v1";
export const TOKEN_KEY = "freshcart.token";

export async function api(
  path,
  { method = "GET", body, signal, auth = true } = {},
) {
  const token = auth ? localStorage.getItem(TOKEN_KEY) : null;
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { token } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: signal
        ? AbortSignal.any([signal, AbortSignal.timeout(25000)])
        : AbortSignal.timeout(25000),
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new Error(
      "Could not reach the store. Check your connection and try again.",
      { cause: error },
    );
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && token)
      window.dispatchEvent(new Event("freshcart:unauthorized"));
    const error = new Error(
      data.errors?.[0]?.msg ||
        data.message ||
        "Something went wrong. Please try again.",
    );
    error.status = response.status;
    throw error;
  }
  return data;
}
export const money = (value) =>
  new Intl.NumberFormat("en-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 2,
  }).format(value || 0);
export const productId = (product) => product?._id || product?.id;
export function decodeToken(token) {
  try {
    const part = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(part));
  } catch {
    return null;
  }
}

export function imageFallback(event) {
  event.currentTarget.onerror = null;
  event.currentTarget.src = "/image-placeholder.svg";
}
