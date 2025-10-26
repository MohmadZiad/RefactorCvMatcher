export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

function buildUrl(path: string): string {
  if (/^https?:/i.test(path)) {
    return path;
  }

  if (!path.startsWith("/")) {
    return `${API_BASE}/${path}`;
  }

  return `${API_BASE}${path}`;
}

export async function apiFetch<T = unknown>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const url = buildUrl(path);
  const res = await fetch(url, init);
  const text = await res.text();
  let parsed: unknown = {};

  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch (error) {
      throw new Error(
        `Unexpected response (not JSON). Status ${res.status}. Body: ${text.slice(0, 200)}`
      );
    }
  }

  if (!res.ok) {
    const errorMessage =
      typeof parsed === "object" && parsed !== null && "error" in parsed
        ? String((parsed as Record<string, unknown>).error)
        : res.statusText;
    throw new Error(errorMessage);
  }

  return parsed as T;
}
