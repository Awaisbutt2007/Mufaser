/**
 * Quote / inquiry handling shared by every form on the site.
 *
 * Submissions go to the Sialkot B2B platform inquiry API (same origin as the
 * deployed site): POST /api/inquiries with an idempotency key. The platform
 * performs the authoritative server-side validation, spam filtering (honeypot)
 * and rate limiting, and stores the inquiry in the owner's inbox. The limits
 * below mirror the platform's so buyers see clear errors before submitting.
 *
 * Uses only erasable TypeScript so it runs unmodified under `node --test`.
 */

export interface InquiryInput {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  country: string;
  product: string;
  quantity: string | number;
  message: string;
  consent: boolean;
  preferredContact?: string;
  /** Honeypot. Real buyers never fill this in. */
  website?: string;
}

export type FieldErrors = Partial<Record<keyof InquiryInput, string>>;

export const LIMITS = {
  name: 120,
  email: 254,
  phone: 40,
  company: 160,
  country: 100,
  product: 120,
  messageMin: 10,
  messageMax: 5000,
  quantityMax: 1_000_000,
} as const;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^\+?[0-9 ()\-]{6,40}$/;

const clean = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

export function validateInquiry(input: InquiryInput): FieldErrors {
  const errors: FieldErrors = {};
  const name = clean(input.name);
  const email = clean(input.email);
  const phone = clean(input.phone);
  const company = clean(input.company);
  const country = clean(input.country);
  const product = clean(input.product);
  const message = clean(input.message);
  const qtyRaw = clean(String(input.quantity ?? ''));

  if (name.length < 2) errors.name = 'Enter your name.';
  else if (name.length > LIMITS.name) errors.name = `Use ${LIMITS.name} characters or fewer.`;

  if (!email) errors.email = 'Enter your business email so we can send the quotation.';
  else if (email.length > LIMITS.email || !EMAIL.test(email)) errors.email = 'Enter a valid email address, e.g. name@company.com.';

  if (phone && !PHONE.test(phone)) errors.phone = 'Use digits with the country code, e.g. +44 20 7946 0000.';

  if (company.length > LIMITS.company) errors.company = `Use ${LIMITS.company} characters or fewer.`;

  if (!country) errors.country = 'Enter the country the order ships to.';
  else if (country.length > LIMITS.country) errors.country = `Use ${LIMITS.country} characters or fewer.`;

  if (!product) errors.product = 'Choose a product or category.';
  else if (product.length > LIMITS.product) errors.product = `Use ${LIMITS.product} characters or fewer.`;

  const qty = Number(qtyRaw);
  if (!qtyRaw) errors.quantity = 'Enter an estimated quantity.';
  else if (!Number.isInteger(qty) || qty < 1 || qty > LIMITS.quantityMax) {
    errors.quantity = 'Enter a whole number of pieces, e.g. 250.';
  }

  if (message.length < LIMITS.messageMin) errors.message = 'Add a few details: garment, colours, branding, sizes or target date.';
  else if (message.length > LIMITS.messageMax) errors.message = `Keep the message under ${LIMITS.messageMax} characters.`;

  if (!input.consent) errors.consent = 'Please confirm we may use these details to prepare your quotation.';

  return errors;
}

export interface PlatformInquiry {
  kind: 'quote';
  source: { key: string; path?: string };
  contact: { name: string; email: string; phone?: string; company?: string; country?: string };
  request: {
    subject: string;
    message: string;
    quantity?: number;
    productReferences: string[];
    preferredContact: string;
  };
  consent: true;
  website: string;
}

export function buildPayload(input: InquiryInput, sourcePath?: string): PlatformInquiry {
  const phone = clean(input.phone);
  const company = clean(input.company);
  const country = clean(input.country);
  const product = clean(input.product);
  const qty = Number(clean(String(input.quantity)));
  return {
    kind: 'quote',
    source: { key: 'website_rfq', ...(sourcePath ? { path: sourcePath } : {}) },
    contact: {
      name: clean(input.name),
      email: clean(input.email),
      ...(phone ? { phone } : {}),
      ...(company ? { company } : {}),
      ...(country ? { country } : {}),
    },
    request: {
      subject: `Production quote: ${product}`.slice(0, 160),
      message: clean(input.message).slice(0, LIMITS.messageMax),
      ...(Number.isInteger(qty) && qty > 0 ? { quantity: qty } : {}),
      productReferences: [product],
      preferredContact: ['email', 'whatsapp', 'phone'].includes(clean(input.preferredContact))
        ? clean(input.preferredContact)
        : 'email',
    },
    consent: true,
    website: clean(input.website),
  };
}

export type SubmitResult = { ok: true; reference: string } | { ok: false; message: string };

export function explainError(code: string): string {
  if (code === 'too_many_requests') return 'Too many requests were sent from this connection. Please wait a few minutes and try again.';
  if (code.startsWith('invalid_')) return 'Some details could not be accepted. Please review the form and submit again.';
  return 'The quote form could not be sent right now. Please try again, or email or WhatsApp us using the details on this page.';
}

export async function submitInquiry(
  payload: PlatformInquiry,
  endpoint: string,
  idempotencyKey: string,
  fetchImpl: typeof fetch = fetch,
): Promise<SubmitResult> {
  let res: Response;
  try {
    res = await fetchImpl(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'idempotency-key': idempotencyKey },
      body: JSON.stringify(payload),
    });
  } catch {
    return { ok: false, message: explainError('network_error') };
  }
  const body = (await res.json().catch(() => null)) as { error?: string; data?: { id?: string } } | null;
  if (!res.ok) return { ok: false, message: explainError(body?.error ?? 'inquiry_submission_failed') };
  const reference = body?.data?.id;
  if (!reference) return { ok: false, message: explainError('inquiry_submission_invalid_response') };
  return { ok: true, reference };
}
