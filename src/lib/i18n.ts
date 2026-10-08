// Idiomas, rutas equivalentes entre idiomas y helpers de traducción.

export const LANGS = ["es", "ca", "en"] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = "es";

/** Configuración de cada idioma (no es contenido: son endónimos y códigos). */
export const LANG_META: Record<Lang, { short: string; name: string; ogLocale: string }> = {
  es: { short: "ES", name: "Español", ogLocale: "es_ES" },
  ca: { short: "CA", name: "Català", ogLocale: "ca_ES" },
  en: { short: "EN", name: "English", ogLocale: "en_GB" },
};

const PREFIX: Record<Lang, string> = { es: "", ca: "/ca", en: "/en" };
const SEGMENT = {
  project: { es: "proyectos", ca: "projectes", en: "projects" },
  privacy: { es: "privacidad", ca: "privacitat", en: "privacy" },
} as const;

export type Route = { name: "home" } | { name: "project"; slug: string } | { name: "privacy" };

/** Ruta de una página en un idioma. Siempre con barra final (formato de salida de Astro). */
export function routePath(route: Route, lang: Lang): string {
  const base = PREFIX[lang];
  switch (route.name) {
    case "home":
      return `${base}/`;
    case "project":
      return `${base}/${SEGMENT.project[lang]}/${route.slug}/`;
    case "privacy":
      return `${base}/${SEGMENT.privacy[lang]}/`;
  }
}

/** Interpreta una ruta de la web (en cualquier idioma) y devuelve su idioma y su página. */
export function parsePath(path: string): { lang: Lang; route: Route } | null {
  const parts = path.split(/[?#]/)[0].split("/").filter(Boolean);
  let lang: Lang = DEFAULT_LANG;
  if (parts[0] === "ca" || parts[0] === "en") lang = parts.shift() as Lang;
  if (parts.length === 0) return { lang, route: { name: "home" } };
  if (parts.length === 1 && parts[0] === SEGMENT.privacy[lang]) return { lang, route: { name: "privacy" } };
  if (parts.length === 2 && parts[0] === SEGMENT.project[lang]) {
    return { lang, route: { name: "project", slug: parts[1] } };
  }
  return null;
}

/** Equivalente de `path` en otro idioma (5.1). Si la ruta no se reconoce, lleva a la home. */
export function localizePath(path: string, lang: Lang): string {
  const parsed = parsePath(path);
  return routePath(parsed ? parsed.route : { name: "home" }, lang);
}

/** Rutas de la misma página en los tres idiomas (para hreflang y el selector). */
export function alternatesFor(route: Route): Record<Lang, string> {
  return { es: routePath(route, "es"), ca: routePath(route, "ca"), en: routePath(route, "en") };
}

export type Localized<T = string> = Record<Lang, T>;

/** Texto de un campo localizado en el idioma pedido. */
export function t<T>(field: Localized<T>, lang: Lang): T {
  return field[lang];
}

/** Igual que `t`, pero admite campos opcionales (`null` oculta el bloque). */
export function tMaybe<T>(field: Localized<T> | null | undefined, lang: Lang): T | undefined {
  return field ? field[lang] : undefined;
}

/** Enlace a una sección de la home desde cualquier página. */
export function sectionHref(id: string, lang: Lang, onHome: boolean): string {
  return onHome ? `#${id}` : `${routePath({ name: "home" }, lang)}#${id}`;
}
