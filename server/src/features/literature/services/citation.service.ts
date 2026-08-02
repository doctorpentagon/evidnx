/**
 * Real, offline citation formatting computed from entered metadata - no
 * scraping or external lookup required. Authors are expected as
 * "Last, First Middle" per author, separated by semicolons (documented in
 * the UI field's helper text), which removes the ambiguity that makes
 * automatic name-parsing unreliable.
 */

interface ParsedAuthor {
  last: string;
  firstFull: string;
  firstInitials: string;
}

export interface ReferenceMeta {
  authors: string;
  year?: number | null;
  title: string;
  journal?: string | null;
  doi?: string | null;
  url?: string | null;
}

function parseAuthor(raw: string): ParsedAuthor {
  const trimmed = raw.trim();
  if (trimmed.includes(",")) {
    const [last, first = ""] = trimmed.split(",").map((s) => s.trim());
    return { last, firstFull: first, firstInitials: initialsOf(first) };
  }
  const parts = trimmed.split(/\s+/).filter(Boolean);
  const last = parts.pop() ?? trimmed;
  const first = parts.join(" ");
  return { last, firstFull: first, firstInitials: initialsOf(first) };
}

function initialsOf(first: string): string {
  return first
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((p) => `${p[0].toUpperCase()}.`)
    .join(" ");
}

function parseAuthors(raw: string): ParsedAuthor[] {
  return raw
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean)
    .map(parseAuthor);
}

function joinList(items: string[], conjunction: string): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} ${conjunction} ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, ${conjunction} ${items[items.length - 1]}`;
}

export function formatAPA(ref: ReferenceMeta): string {
  const authors = parseAuthors(ref.authors);
  const authorsText = joinList(
    authors.map((a) => `${a.last}, ${a.firstInitials}`),
    "&",
  );
  const year = ref.year ?? "n.d.";
  const link = ref.doi ? `https://doi.org/${ref.doi}` : ref.url ?? "";
  const journalPart = ref.journal ? ` ${ref.journal}.` : "";
  return `${authorsText} (${year}). ${ensurePeriod(ref.title)}${journalPart}${link ? ` ${link}` : ""}`.trim();
}

export function formatMLA(ref: ReferenceMeta): string {
  const authors = parseAuthors(ref.authors);
  let authorsText = "";
  if (authors.length === 1) {
    authorsText = `${authors[0].last}, ${authors[0].firstFull}.`;
  } else if (authors.length === 2) {
    authorsText = `${authors[0].last}, ${authors[0].firstFull}, and ${authors[1].firstFull} ${authors[1].last}.`;
  } else if (authors.length > 2) {
    authorsText = `${authors[0].last}, ${authors[0].firstFull}, et al.`;
  }
  const journalPart = ref.journal ? ` *${ref.journal}*,` : "";
  const year = ref.year ?? "n.d.";
  const link = ref.doi ? `https://doi.org/${ref.doi}` : ref.url ?? "";
  return `${authorsText} "${ensurePeriod(ref.title, false)}"${journalPart} ${year}.${link ? ` ${link}` : ""}`.trim();
}

export function formatHarvard(ref: ReferenceMeta): string {
  const authors = parseAuthors(ref.authors);
  const authorsText = joinList(
    authors.map((a) => `${a.last}, ${a.firstInitials}`),
    "and",
  );
  const year = ref.year ?? "n.d.";
  const journalPart = ref.journal ? ` ${ref.journal}.` : "";
  const link = ref.doi ? `https://doi.org/${ref.doi}` : ref.url ?? "";
  return `${authorsText} (${year}) '${ensurePeriod(ref.title, false)}'.${journalPart}${link ? ` Available at: ${link}.` : ""}`.trim();
}

function ensurePeriod(text: string, withPeriod = true): string {
  const trimmed = text.trim();
  if (!withPeriod) return trimmed.replace(/[.\s]+$/, "");
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

export function formatCitation(ref: ReferenceMeta, style: "apa" | "mla" | "harvard"): string {
  if (style === "mla") return formatMLA(ref);
  if (style === "harvard") return formatHarvard(ref);
  return formatAPA(ref);
}
