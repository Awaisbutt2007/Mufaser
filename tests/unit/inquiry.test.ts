import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildPayload, explainError, submitInquiry, validateInquiry, type InquiryInput } from '../../src/lib/inquiry.ts';

const valid: InquiryInput = {
  name: 'Alex Morgan',
  email: 'alex@club.example',
  phone: '+44 20 7946 0000',
  company: 'Riverside FC',
  country: 'United Kingdom',
  product: 'Soccer match jersey',
  quantity: '250',
  message: 'Home and away kits in navy and gold, sublimated names and numbers.',
  consent: true,
  preferredContact: 'email',
  website: '',
};

test('accepts a complete inquiry', () => {
  assert.deepEqual(validateInquiry(valid), {});
});

test('requires name, business email, country, product, quantity, message and consent', () => {
  const errors = validateInquiry({ ...valid, name: ' ', email: '', country: '', product: '', quantity: '', message: 'short', consent: false });
  assert.deepEqual(Object.keys(errors).sort(), ['consent', 'country', 'email', 'message', 'name', 'product', 'quantity']);
});

test('rejects malformed email and phone', () => {
  const errors = validateInquiry({ ...valid, email: 'alex@club', phone: 'call me' });
  assert.ok(errors.email);
  assert.ok(errors.phone);
});

test('quantity must be a whole number between 1 and 1,000,000', () => {
  for (const q of ['0', '-5', '2.5', 'many', '1000001']) {
    assert.ok(validateInquiry({ ...valid, quantity: q }).quantity, `expected error for ${q}`);
  }
  assert.equal(validateInquiry({ ...valid, quantity: '1000000' }).quantity, undefined);
});

test('enforces the platform field limits', () => {
  assert.ok(validateInquiry({ ...valid, name: 'x'.repeat(121) }).name);
  assert.ok(validateInquiry({ ...valid, company: 'x'.repeat(161) }).company);
  assert.ok(validateInquiry({ ...valid, product: 'x'.repeat(121) }).product);
  assert.ok(validateInquiry({ ...valid, message: 'x'.repeat(5001) }).message);
});

test('builds the platform payload shape', () => {
  const p = buildPayload({ ...valid, phone: '' }, '/request-a-quote/');
  assert.equal(p.kind, 'quote');
  assert.deepEqual(p.source, { key: 'website_rfq', path: '/request-a-quote/' });
  assert.equal(p.contact.phone, undefined);
  assert.equal(p.request.quantity, 250);
  assert.deepEqual(p.request.productReferences, ['Soccer match jersey']);
  assert.equal(p.request.subject, 'Production quote: Soccer match jersey');
  assert.equal(p.consent, true);
  assert.equal(p.website, '');
});

test('normalises an unknown reply method to email', () => {
  assert.equal(buildPayload({ ...valid, preferredContact: 'carrier pigeon' }).request.preferredContact, 'email');
});

test('submitInquiry returns the platform reference on success', async () => {
  let seen: RequestInit | undefined;
  const fake = (async (_url: string, init?: RequestInit) => {
    seen = init;
    return new Response(JSON.stringify({ data: { id: 'inq_123' } }), { status: 201 });
  }) as typeof fetch;
  const r = await submitInquiry(buildPayload(valid), '/api/inquiries', 'rfq:web:test', fake);
  assert.deepEqual(r, { ok: true, reference: 'inq_123' });
  assert.equal((seen!.headers as Record<string, string>)['idempotency-key'], 'rfq:web:test');
});

test('submitInquiry never reports success without a reference', async () => {
  const fake = (async () => new Response('{}', { status: 200 })) as typeof fetch;
  const r = await submitInquiry(buildPayload(valid), '/api/inquiries', 'k-12345678', fake);
  assert.equal(r.ok, false);
});

test('submitInquiry maps rate limiting and network failures to readable messages', async () => {
  const limited = (async () => new Response(JSON.stringify({ error: 'too_many_requests' }), { status: 429 })) as typeof fetch;
  const r1 = await submitInquiry(buildPayload(valid), '/api/inquiries', 'k-12345678', limited);
  assert.deepEqual(r1, { ok: false, message: explainError('too_many_requests') });

  const offline = (async () => { throw new TypeError('Failed to fetch'); }) as typeof fetch;
  const r2 = await submitInquiry(buildPayload(valid), '/api/inquiries', 'k-12345678', offline);
  assert.equal(r2.ok, false);
});
