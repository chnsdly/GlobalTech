export type LeadFormType = "contact" | "download";

export interface LeadFormData {
  name: string;
  email: string;
  company: string;
  country: string;
  message: string;
  formType: LeadFormType;
  pageUrl: string;
  downloadSlug: string;
  consent: "yes" | "no";
  utm: Record<string, string>;
}

export interface RequestContext {
  ip: string;
  userAgent: string;
  timestamp: string;
}

export const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
] as const;

const REQUIRED_FIELDS: Array<keyof Pick<LeadFormData, "name" | "email" | "formType" | "pageUrl">> = [
  "name",
  "email",
  "formType",
  "pageUrl",
];

export class LeadFormError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "LeadFormError";
    this.status = status;
  }
}

export function normalize(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

export function readLeadForm(form: FormData): LeadFormData {
  const get = (key: string) => normalize(form.get(key));

  const formType = (get("form_type") || "contact") as LeadFormType;

  const utmEntries: Record<string, string> = {};
  for (const key of UTM_KEYS) {
    utmEntries[key] = get(key);
  }

  return {
    name: get("name"),
    email: get("email"),
    company: get("company"),
    country: get("country"),
    message: get("message"),
    formType,
    pageUrl: get("page_url"),
    downloadSlug: get("download_slug"),
    consent: (get("consent") === "yes" ? "yes" : "no"),
    utm: utmEntries,
  };
}

export function ensureRequired(data: LeadFormData): void {
  for (const field of REQUIRED_FIELDS) {
    if (!data[field]) {
      throw new LeadFormError(`Missing required field: ${field}`, 422);
    }
  }

  if (!data.email.includes("@")) {
    throw new LeadFormError("Invalid email address", 422);
  }

  if (data.formType === "download" && !data.downloadSlug) {
    throw new LeadFormError("Missing download slug", 422);
  }
}

export async function verifyTurnstile(token: string, secret: string, ip: string): Promise<void> {
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: new URLSearchParams({
      secret,
      response: token,
      remoteip: ip,
    }),
  });

  const result = await response.json() as { success?: boolean };

  if (!result.success) {
    throw new LeadFormError("Bot check failed", 400);
  }
}

export async function storeLead(db: D1Database, data: LeadFormData, ctx: RequestContext): Promise<void> {
  const { name, email, company, country, message, formType, pageUrl, consent, utm } = data;
  await db.prepare(`
    INSERT INTO leads
      (created_at, name, email, company, country, message, form_type, page_url,
       utm_source, utm_medium, utm_campaign, utm_term, utm_content, ip, user_agent, consent)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).bind(
    ctx.timestamp,
    name,
    email,
    company,
    country,
    message,
    formType,
    pageUrl,
    utm["utm_source"],
    utm["utm_medium"],
    utm["utm_campaign"],
    utm["utm_term"],
    utm["utm_content"],
    ctx.ip,
    ctx.userAgent,
    consent,
  ).run();
}

export async function issueDownloadTicket(db: D1Database, slug: string, timestamp: string): Promise<{ id: string; expiresAt: string; }> {
  const id = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  await db.prepare(`
    INSERT INTO tickets (id, slug, created_at, expires_at)
    VALUES (?,?,?,?)
  `).bind(id, slug, timestamp, expiresAt).run();

  return { id, expiresAt };
}