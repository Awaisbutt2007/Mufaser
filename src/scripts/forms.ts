import { buildPayload, submitInquiry, validateInquiry, type InquiryInput } from '../lib/inquiry';

const ENDPOINT = import.meta.env.PUBLIC_INQUIRY_ENDPOINT || '/api/inquiries';

function compose(form: HTMLFormElement, data: FormData): string {
  const lines: string[] = [];
  const seen = new Set<string>();
  form.querySelectorAll<HTMLElement>('[data-summary]').forEach((el) => {
    const label = el.dataset.summary!;
    if (seen.has(label)) return;
    seen.add(label);
    const name = (el as HTMLInputElement).name;
    const values = data.getAll(name).map(String).map((v) => v.trim()).filter(Boolean);
    if (values.length) lines.push(`${label}: ${values.join(', ')}`);
  });
  const message = String(data.get('message') ?? '').trim();
  if (!lines.length) return message;
  return `${message}\n\n— Requirements —\n${lines.join('\n')}`.trim();
}

function setError(form: HTMLFormElement, field: string, message?: string) {
  const input = form.querySelector<HTMLElement>(`[name="${field}"]`);
  const slot = form.querySelector<HTMLElement>(`[data-error-for="${field}"]`);
  if (input) {
    if (message) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
  }
  if (slot) {
    slot.textContent = message ?? '';
    slot.hidden = !message;
  }
}

function enhance(form: HTMLFormElement) {
  const status = form.querySelector<HTMLElement>('[data-form-status]');
  const success = form.parentElement?.querySelector<HTMLElement>('[data-form-success]');
  const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  const fields = ['name', 'email', 'phone', 'company', 'country', 'product', 'quantity', 'message', 'consent'] as const;
  let idempotency: { fingerprint: string; key: string } | null = null;

  form.setAttribute('novalidate', '');

  form.addEventListener('input', (e) => {
    const target = e.target as HTMLInputElement;
    if (target.getAttribute('aria-invalid') === 'true') setError(form, target.name);
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (form.dataset.busy === 'true') return;
    const data = new FormData(form);
    const input: InquiryInput = {
      name: String(data.get('name') ?? ''),
      email: String(data.get('email') ?? ''),
      phone: String(data.get('phone') ?? ''),
      company: String(data.get('company') ?? ''),
      country: String(data.get('country') ?? ''),
      product: String(data.get('product') ?? ''),
      quantity: String(data.get('quantity') ?? ''),
      message: compose(form, data),
      consent: data.get('consent') === 'on',
      preferredContact: String(data.get('preferredContact') ?? 'email'),
      website: String(data.get('website') ?? ''),
    };

    const errors = validateInquiry(input);
    fields.forEach((f) => setError(form, f, errors[f]));
    const first = fields.find((f) => errors[f]);
    if (first) {
      if (status) {
        status.dataset.tone = 'error';
        status.textContent = 'Please correct the highlighted fields.';
      }
      form.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }

    const payload = buildPayload(input, location.pathname);
    const fingerprint = JSON.stringify(payload);
    if (!idempotency || idempotency.fingerprint !== fingerprint) {
      idempotency = { fingerprint, key: `rfq:web:${crypto.randomUUID()}` };
    }

    form.dataset.busy = 'true';
    if (button) {
      button.disabled = true;
      button.dataset.label ??= button.textContent ?? '';
      button.textContent = 'Sending…';
    }
    if (status) {
      status.dataset.tone = 'info';
      status.textContent = 'Sending your request securely…';
    }

    const result = await submitInquiry(payload, ENDPOINT, idempotency.key);

    form.dataset.busy = 'false';
    if (button) {
      button.disabled = false;
      button.textContent = button.dataset.label ?? 'Send request';
    }

    if (result.ok) {
      idempotency = null;
      if (success) {
        const ref = success.querySelector<HTMLElement>('[data-reference]');
        if (ref) ref.textContent = result.reference;
        form.hidden = true;
        success.hidden = false;
        success.focus();
      }
      form.reset();
      form.dispatchEvent(new CustomEvent('inquiry:sent', { bubbles: true }));
    } else if (status) {
      status.dataset.tone = 'error';
      status.textContent = result.message;
    }
  });

  success?.querySelector<HTMLButtonElement>('[data-form-again]')?.addEventListener('click', () => {
    success.hidden = true;
    form.hidden = false;
    if (status) status.textContent = '';
    form.querySelector<HTMLElement>('input, select, textarea')?.focus();
  });
}

document.querySelectorAll<HTMLFormElement>('form[data-inquiry-form]').forEach(enhance);
