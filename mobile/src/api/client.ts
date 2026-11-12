const API_URL = process.env.EXPO_PUBLIC_API_URL;

export async function apiRequest(
  endpoint: string,
  options: RequestInit = {},
  token?: string
) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: Bearer ${token} } : {}),
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || 'Ошибка сервера');
  }

  return data;
}