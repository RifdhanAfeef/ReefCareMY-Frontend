const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type ApiRequestOptions = RequestInit & {
  path: string;
};

export async function apiRequest<T>({
  path,
  headers,
  ...options
}: ApiRequestOptions): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL has not been configured.");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}.`);
  }

  return response.json() as Promise<T>;
}
