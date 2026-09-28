const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

type ApiRequestOptions = RequestInit & {
  accessToken?: string | null;
};

async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json") ? await response.json() : null;

  if (!response.ok) {
    const message = payload?.error?.message ?? "Something went wrong";
    throw new Error(message);
  }

  return payload as T;
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { accessToken, ...requestOptions } = options;
  const headers = new Headers(requestOptions.headers ?? {});

  const isFormData =
    typeof FormData !== "undefined" && requestOptions.body instanceof FormData;
  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...requestOptions,
    headers,
    credentials: "include",
  });

  return handleResponse<T>(response);
}
