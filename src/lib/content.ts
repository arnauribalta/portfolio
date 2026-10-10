// Carga y valida los JSON de src/data. Si alguno no cumple el esquema, el build falla
// con un mensaje que indica el archivo y el campo.
import { z } from "astro/zod";
import { LANGS } from "./i18n";
import siteJson from "../data/site.json";
import experienceJson from "../data/experience.json";
import projectsJson from "../data/projects.json";
import educationJson from "../data/education.json";
import skillsJson from "../data/skills.json";

// ───────────── Esquemas

/** Texto en los tres idiomas. `""` en un campo opcional oculta su bloque. */
const L = z.strictObject({ es: z.string(), ca: z.string(), en: z.string() });
/** Título en dos tonos: ["Primera", "segunda"] o ["Todo"]. */
const TitleParts = z.array(z.string().min(1)).min(1).max(2);
const LTitle = z.strictObject({ es: TitleParts, ca: TitleParts, en: TitleParts });
const Slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "debe ir en kebab-case");
/** Ruta relativa a src/assets (la imagen puede no existir todavía). */
const AssetPath = z.string().min(1);
// video: ruta en public/ ("/video/x.mp4"); src es entonces su portada
const VideoPath = z.string().regex(/^\/video\/[a-z0-9-]+\.mp4$/);
const ImageRef = z.strictObject({ src: AssetPath, alt: L, video: VideoPath.optional() });

const SiteSchema = z.strictObject({
  meta: z.strictObject({ siteUrl: z.url(), title: L, description: L, ogImage: L }),
  person: z.strictObject({
    fullName: z.string().min(1),
    displayName: TitleParts,
    jobTitle: L,
    location: L,
    email: z.email(),
    phone: z.strictObject({ value: z.string(), href: z.string(), visible: z.boolean() }),
    links: z.array(
      z.strictObject({ id: z.string(), label: z.string(), url: z.string(), visible: z.boolean() }),
    ),
    alumniOf: z.array(z.string()),
    knowsAbout: z.array(z.string()),
  }),
  nav: z.strictObject({
    items: z.array(z.strictObject({ id: z.string(), label: L })),
    cta: z.strictObject({ id: z.string(), label: L }),
    menu: L,
    close: L,
    skip: L,
    langSwitch: L,
    sections: L,
  }),
  sections: z.array(z.strictObject({ id: z.string(), dot: L, title: LTitle.optional() })),
  hero: z.strictObject({
    subtitle: L,
    status: z.strictObject({ visible: z.boolean(), text: L }),
    scrollHint: L,
    portrait: ImageRef,
  }),
  about: z.strictObject({
    photo: z.strictObject({ src: AssetPath, cutout: AssetPath.nullable().optional(), alt: L }),
    paragraphs: z.array(L),
    figures: z.array(z.strictObject({ value: L, label: L })),
    badges: z.array(L),
  }),
  experience: z.strictObject({
    intro: L,
    projectLink: L,
    // credito: autoría y licencia de las fotos que no son de Arnau (obligatorio con CC BY)
    photos: z.array(
      z.strictObject({ src: AssetPath, caption: L, video: VideoPath.optional(), credito: z.strictObject({ texto: L, url: z.url() }).optional() }),
    ),
  }),
  projects: z.strictObject({ intro: L, cta: L }),
  skills: z.strictObject({ intro: L, stackTitle: L, languagesTitle: L }),
  education: z.strictObject({ intro: L, othersTitle: L, academicTitle: L, pdfCta: L }),
  contact: z.strictObject({
    intro: L,
    endpoint: z.url(),
    subject: L,
    fields: z.strictObject({ name: L, email: L, reason: L, message: L, consent: L }),
    reasons: z.array(L),
    submit: L,
    sending: L,
    success: L,
    error: L,
  }),
  projectPage: z.strictObject({
    back: L,
    toc: L,
    meta: z.strictObject({ role: L, period: L, status: L, client: L, team: L }),
    blocks: z.strictObject({
      summary: L,
      challenge: L,
      whatIDid: L,
      features: L,
      decisions: L,
      results: L,
      stack: L,
      skills: L,
      learnings: L,
      gallery: L,
    }),
    prev: L,
    next: L,
    ctaTitle: LTitle,
    ctaButton: L,
  }),
  carousel: z.strictObject({ label: L, prev: L, next: L }),
  footer: z.strictObject({ privacy: L, rights: L }),
  notFound: z.strictObject({ title: LTitle, text: L, button: L }),
});

const ExperienceSchema = z.array(
  z.strictObject({
    id: z.string(),
    orden: z.number(),
    visible: z.boolean(),
    tipo: z.enum(["trabajo", "emprendimiento", "logro"]),
    periodo: L,
    rol: L,
    organizacion: z.string(),
    lugar: z.string().nullable(),
    resumen: L.nullable(),
    proyecto: Slug.nullable(),
  }),
);

const ProjectSchema = z.strictObject({
  slug: Slug,
  visible: z.boolean(),
  mostrarDetalle: z.boolean(),
  orden: z.number(),
  titulo: LTitle,
  logo: AssetPath.nullable(),
  categoria: L.nullable(),
  cliente: z.string().nullable(),
  rol: L.nullable(),
  periodo: L.nullable(),
  estado: L.nullable(),
  equipo: L.nullable(),
  tags: z.array(L),
  resumenCorto: L,
  resumen: L.nullable(),
  reto: L.nullable(),
  queHice: z.array(L),
  funcionalidades: z.array(z.strictObject({ titulo: L, texto: L })),
  decisiones: z.array(L),
  resultados: z.array(z.strictObject({ valor: L, etiqueta: L, nota: L.nullable() })),
  stack: z.array(z.string()),
  aptitudes: z.array(L),
  aprendizajes: z.array(L),
  enlaces: z.array(z.strictObject({ label: L, url: z.url() })),
  // animacion: portada dibujada en vivo en lugar de imagen («grafo»: grafo neuronal animado)
  imagenes: z.strictObject({ cover: ImageRef.nullable(), galeria: z.array(ImageRef), animacion: z.enum(["grafo"]).optional() }),
});

const EducationSchema = z.strictObject({
  titulos: z.array(
    z.strictObject({
      id: z.string(),
      titulo: L,
      centro: z.string(),
      periodo: L.nullable(),
      detalle: L.nullable(),
    }),
  ),
  otros: z.array(L),
  trabajos: z.array(
    z.strictObject({
      id: z.string(),
      asignatura: L,
      titulo: L,
      descripcion: L,
      equipo: L.nullable(),
      pdf: z.string().startsWith("/"),
    }),
  ),
});

const SkillsSchema = z.strictObject({
  grupos: z.array(z.strictObject({ id: z.string(), titulo: L, items: z.array(L) })),
  stack: z.array(z.string()),
  idiomas: z.array(z.strictObject({ idioma: L, nivel: L })),
});

// ───────────── Validación

/** Cualquier objeto con una clave de idioma debe tener las tres (es, ca, en). */
function assertAllLanguages(node: unknown, path: string): void {
  if (Array.isArray(node)) {
    node.forEach((item, i) => assertAllLanguages(item, `${path}[${i}]`));
    return;
  }
  if (node && typeof node === "object") {
    const keys = Object.keys(node);
    if (LANGS.some((lang) => keys.includes(lang))) {
      const missing = LANGS.filter((lang) => !keys.includes(lang));
      if (missing.length) {
        throw new Error(`[src/data/${path}] falta el texto en: ${missing.join(", ")}`);
      }
    }
    for (const [key, value] of Object.entries(node)) assertAllLanguages(value, `${path}.${key}`);
  }
}

function load<T extends z.ZodType>(schema: T, data: unknown, file: string): z.infer<T> {
  assertAllLanguages(data, file);
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(`\n\nsrc/data/${file} no cumple el esquema:\n${z.prettifyError(result.error)}\n`);
  }
  return result.data;
}

export const site = load(SiteSchema, siteJson, "site.json");
const experience = load(ExperienceSchema, experienceJson, "experience.json");
const projects = load(z.array(ProjectSchema), projectsJson, "projects.json");
export const education = load(EducationSchema, educationJson, "education.json");
export const skills = load(SkillsSchema, skillsJson, "skills.json");

const slugs = projects.map((p) => p.slug);
const duplicated = slugs.filter((slug, i) => slugs.indexOf(slug) !== i);
if (duplicated.length) {
  throw new Error(`src/data/projects.json: slug repetido (${duplicated.join(", ")})`);
}

// ───────────── Tipos y helpers

export type Site = z.infer<typeof SiteSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type ExperienceEntry = z.infer<typeof ExperienceSchema>[number];
export type ImageRefData = z.infer<typeof ImageRef>;

const byOrder = (a: { orden: number }, b: { orden: number }) => a.orden - b.orden;

/** Proyectos con tarjeta y página: `visible && mostrarDetalle`, por `orden`. */
export function getProjects(): Project[] {
  return projects.filter((p) => p.visible && p.mostrarDetalle).sort(byOrder);
}

export function getProject(slug: string | null | undefined): Project | undefined {
  return slug ? getProjects().find((p) => p.slug === slug) : undefined;
}

/** Entradas visibles de la trayectoria, por `orden`. */
export function getExperience(): ExperienceEntry[] {
  return experience.filter((e) => e.visible).sort(byOrder);
}

export function getSection(id: string): Site["sections"][number] {
  const section = site.sections.find((s) => s.id === id);
  if (!section) throw new Error(`src/data/site.json: falta la sección "${id}" en "sections"`);
  return section;
}

/** Nombre del proyecto en texto plano (título en dos tonos unido). */
export function projectName(parts: string[]): string {
  return parts.join(" ");
}

/** Iniciales para los monogramas («AR»). */
export function initials(): string {
  return site.person.fullName
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}
