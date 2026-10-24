/**
 * Company facts — the single source of truth for every business claim on the site.
 *
 * Source: the owner's published profile on the Sialkot B2B platform
 * (site_mufasar_enterprises, release rel_agent_publish_9e433aa21f01d4b6675ac043785a656b,
 * read 2026-10-23) and the supplied logo. No letterhead was supplied.
 *
 * A fact whose `confirmed` flag is false is NOT rendered publicly. Flip it to true
 * only after Mufasar Enterprises confirms the wording in writing.
 */

export interface Fact {
  value: string;
  confirmed: boolean;
  note?: string;
}

export const company = {
  name: 'Mufasar Enterprises',
  legalDescriptor: 'Sportswear and textile manufacturer and exporter',
  city: 'Sialkot',
  country: 'Pakistan',
  address: {
    street: 'House # 203, Street # 2, Maher Town, Amine Abad Road',
    locality: 'Sialkot',
    postalCode: '51310',
    country: 'Pakistan',
    countryCode: 'PK',
  },
  email: 'info@mufasarenterprises.com',
  whatsapp: {
    display: '+92 308 2920452',
    digits: '923082920452',
  },
  /** Current public hostname on the platform. Update when a custom domain is connected. */
  siteUrl: 'https://mufasar-enterprises.sialkotb2b.com',
  markets: ['Europe', 'North America', 'the Middle East'],
} as const;

export const facts = {
  responseTime: {
    value: 'Quotation within one business day',
    confirmed: true,
  },
  sampleLeadTime: {
    value: '7–10 working days',
    confirmed: true,
    note: 'After artwork and materials are confirmed.',
  },
  bulkLeadTime: {
    value: '4–6 weeks',
    confirmed: true,
    note: 'After sample approval and deposit.',
  },
  payment: {
    value: '30% deposit to confirm, balance before dispatch',
    confirmed: true,
  },
  shipping: {
    value: 'By air or sea to your forwarder or door, with customs documents prepared',
    confirmed: true,
  },
  inHouse: {
    value: 'Development, sampling and bulk production are handled in-house',
    confirmed: true,
  },
  sizes: {
    value: 'Youth and adult sizes',
    confirmed: true,
  },
  reorders: {
    value: 'Designs, colours and sizes are kept on file so reorders match the original batch',
    confirmed: true,
  },
  sizingKit: {
    value: 'A sizing kit with one of each size can be sent before you order',
    confirmed: true,
  },
  // The platform content states both "10 per style" and "50 pieces per style and colour".
  // Until the owner confirms one figure, the site says "confirmed with your quote".
  moq: {
    value: 'From 50 pieces per style and colour',
    confirmed: false,
    note: 'Conflicting figures in existing content (10 vs 50). Needs owner confirmation.',
  },
  chamberMembership: {
    value: 'Member of the Sialkot Chamber of Commerce & Industry',
    confirmed: false,
    note: 'Stated in existing About copy; membership number/certificate not yet verified.',
  },
} satisfies Record<string, Fact>;

export const moqLabel = facts.moq.confirmed ? facts.moq.value : 'Confirmed with your quote';

export const whatsappUrl = (text?: string) =>
  `https://wa.me/${company.whatsapp.digits}${text ? `?text=${encodeURIComponent(text)}` : ''}`;

/** Order process exactly as published in the owner's profile. */
export const processSteps = [
  {
    n: '01',
    title: 'Share your brief',
    time: '1 day',
    you: 'Send the product, quantity, reference images and target date.',
    we: 'We review feasibility and reply with a quotation within one business day.',
  },
  {
    n: '02',
    title: 'Confirm the specification',
    time: '2–3 days',
    you: 'Approve materials, measurements, branding and packaging.',
    we: 'We prepare the tech pack and source materials.',
  },
  {
    n: '03',
    title: 'Sample development',
    time: '7–10 days',
    you: 'Review the physical sample and request any changes.',
    we: 'We produce and ship the development sample.',
  },
  {
    n: '04',
    title: 'Sample approval',
    time: 'Deposit',
    you: 'Sign off the final sample and place the order.',
    we: 'We lock the specification and schedule production.',
  },
  {
    n: '05',
    title: 'Bulk production',
    time: '4–6 weeks',
    you: 'Receive progress updates and in-line photos.',
    we: 'We cut, produce, decorate and inspect every piece.',
  },
  {
    n: '06',
    title: 'Inspection and dispatch',
    time: 'Before shipment',
    you: 'Confirm shipping details and receive documents.',
    we: 'Final quality check, packing and handover to your forwarder.',
  },
] as const;

/** Quality checklist exactly as published in the owner's profile. */
export const qcChecklist = [
  'Incoming material inspection against the approved swatch',
  'Cut panels checked against the graded pattern',
  'Measurement check on the first assembled piece',
  'Stitch density and seam strength verified',
  'Embroidery, print and label placement checked against artwork',
  'In-line inspection during production',
  'Colour consistency checked across the full batch',
  'Wash and care labels verified for the destination market',
  'Final measurement audit on finished goods',
  'Packing, carton marks and quantity counted before dispatch',
] as const;

export const generalFaqs = [
  {
    q: 'What is the minimum order?',
    a: 'Minimums depend on the product and decoration method and are confirmed with your quotation.',
  },
  {
    q: 'Can every piece carry our branding?',
    a: 'Yes. Crests, sponsor logos, player names and numbers, or your own private label, placed where you want them.',
  },
  {
    q: 'How do we get sizes right?',
    a: 'A sizing kit with one of each size can be sent before you order, along with a sheet for names, numbers and sizes.',
  },
  {
    q: 'How long does an order take?',
    a: 'Samples typically take 7–10 working days once artwork and materials are confirmed. Bulk production typically takes 4–6 weeks after sample approval and deposit.',
  },
  {
    q: 'Can we reorder later?',
    a: 'Yes. Your design, colours and sizes are kept on file, so a reorder is matched to the original batch.',
  },
  {
    q: 'How is payment structured?',
    a: 'A 30% deposit confirms the order and the balance is paid before dispatch.',
  },
  {
    q: 'How do you ship?',
    a: 'By air or sea to your forwarder or door, with documents prepared for customs.',
  },
] as const;
