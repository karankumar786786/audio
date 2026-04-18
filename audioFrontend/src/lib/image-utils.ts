const IMAGEKIT_URL_ENDPOINT = "https://ik.imagekit.io/zaa6pbi9f";

export type ImageTransformation = {
  width?: number;
  height?: number;
  quality?: number;
  format?: "auto" | "webp" | "jpg" | "png";
  blur?: number;
};

/**
 * Generates a full ImageKit URL with optional transformations.
 */
export function getImageUrl(
  key: string | undefined | null,
  transformations: ImageTransformation = {},
) {
  if (!key) return "";

  // If key is already a full URL, return it
  if (key.startsWith("http")) return key;

  // Ensure key starts with /
  const path = key.startsWith("/") ? key : `/${key}`;

  const { width, height, quality, format = "auto", blur } = transformations;

  const tr: string[] = [];
  if (width) tr.push(`w-${width}`);
  if (height) tr.push(`h-${height}`);
  if (quality) tr.push(`q-${quality}`);
  if (format) tr.push(`f-${format}`);
  if (blur) tr.push(`bl-${blur}`);

  const transformationQuery = tr.length > 0 ? `?tr=${tr.join(",")}` : "";

  return `${IMAGEKIT_URL_ENDPOINT}${path}${transformationQuery}`;
}
