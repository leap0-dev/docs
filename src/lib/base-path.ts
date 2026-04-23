const normalizedBaseUrl = import.meta.env.BASE_URL.endsWith("/")
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;

export const baseUrl = normalizedBaseUrl;
export const basePath = normalizedBaseUrl === "/" ? "/" : normalizedBaseUrl.slice(0, -1);

export function withBase(path: string) {
  return `${normalizedBaseUrl}${path.replace(/^\/+/, "")}`;
}
