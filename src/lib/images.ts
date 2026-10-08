// Imágenes de src/assets. Las rutas de los JSON son relativas a esa carpeta.
// Si un archivo no existe, getAsset devuelve undefined y el componente muestra su placeholder.
import type { ImageMetadata } from "astro";

const assets = import.meta.glob<ImageMetadata>("/src/assets/**/*.{png,jpg,jpeg,webp,avif,svg}", {
  eager: true,
  import: "default",
});

export function getAsset(path: string | null | undefined): ImageMetadata | undefined {
  if (!path) return undefined;
  return assets[`/src/assets/${path.replace(/^\/+/, "")}`];
}

export function isSvg(image: ImageMetadata): boolean {
  return image.format === "svg";
}

const WIDTHS = [400, 800, 1200, 1600];

/** Anchos para srcset sin ampliar nunca la imagen original. */
export function widthsFor(image: ImageMetadata): number[] {
  const max = Math.min(image.width, WIDTHS[WIDTHS.length - 1]);
  return [...WIDTHS.filter((w) => w < max), max];
}
