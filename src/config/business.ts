/**
 * Single source of truth for business details shown in the app and in
 * generated documents (PDF, print, text enquiries, transcripts).
 *
 * Values marked `confirmed: false` came from the earlier prototype and have
 * NOT been confirmed by SDS Techware. They must be checked before launch.
 * Values set to `null` are deliberately not displayed until confirmed.
 * See docs/PROJECT_HANDOVER.md → "Business details awaiting confirmation".
 */

export interface BusinessField<T> {
  value: T;
  confirmed: boolean;
  note?: string;
}

export const BUSINESS = {
  brandName: 'SDS TECHWARE',
  tagline: 'IT SOLUTIONS & SUPPLIES',
  legalName: { value: 'SDS Techware (Pvt) Ltd.', confirmed: false } as BusinessField<string>,
  summary: 'IT products, infrastructure solutions, and technical support for businesses in Sri Lanka.',
  country: 'Sri Lanka',
  establishedYear: {
    value: 2017,
    confirmed: false,
    note: 'Shown in the header strip as "since 2017".',
  } as BusinessField<number>,
  salesEmail: {
    value: 'sales@sdstechware.lk',
    confirmed: false,
    note: 'The previous chat/configurator used corporate@sdstechware.com (conflict, removed).',
  } as BusinessField<string>,
  phone: {
    value: { display: '+94 75 988 8013', tel: '+94759888013' },
    confirmed: false,
    note: 'The previous chat/configurator used +94 (11) 234-5678 (conflict, removed).',
  } as BusinessField<{ display: string; tel: string }>,
  location: {
    value: 'Dehiwala, Sri Lanka',
    confirmed: false,
    note: 'The previous restock tools referred to an "SDS Central Hub, Colombo" (conflict, removed).',
  } as BusinessField<string>,
  /** Not displayed until confirmed. The earlier prototype printed "PV-124982". */
  companyRegistrationNo: { value: null, confirmed: false, note: 'Earlier prototype showed "PV-124982".' } as BusinessField<string | null>,
  /** Not displayed until confirmed. The earlier prototype printed "14 days". */
  quotationValidityDays: { value: null, confirmed: false, note: 'Earlier prototype showed 14 days.' } as BusinessField<number | null>,
} as const;

/**
 * Neutral wording used on quotation enquiries. It avoids promising warranty
 * periods, delivery terms, tax treatment or price locks, which the earlier
 * prototype stated without confirmation.
 */
export const QUOTATION_ENQUIRY_TERMS: string[] = [
  'This document is a quotation enquiry prepared by the customer. It is not a confirmed quotation, offer or invoice.',
  'Prices appear only where SDS Techware has published them and are indicative. Items marked "Price on Request" are priced in a formal quotation.',
  'Availability, warranty coverage, delivery arrangements and applicable taxes are confirmed by SDS Techware in the formal quotation.',
];

export function contactLine(): string {
  return `${BUSINESS.legalName.value} · ${BUSINESS.salesEmail.value} · ${BUSINESS.phone.value.display}`;
}

/** Items for the "awaiting confirmation" panel in the Staff Workspace. */
export function listUnconfirmedBusinessDetails(): Array<{ label: string; value: string; note?: string }> {
  const rows: Array<{ label: string; field: BusinessField<unknown> }> = [
    { label: 'Legal name', field: BUSINESS.legalName },
    { label: 'Established year', field: BUSINESS.establishedYear },
    { label: 'Sales email', field: BUSINESS.salesEmail },
    { label: 'Phone', field: BUSINESS.phone },
    { label: 'Location', field: BUSINESS.location },
    { label: 'Company registration no.', field: BUSINESS.companyRegistrationNo },
    { label: 'Quotation validity', field: BUSINESS.quotationValidityDays },
  ];
  return rows
    .filter(r => !r.field.confirmed)
    .map(r => ({
      label: r.label,
      value:
        r.field.value === null
          ? 'Not set (hidden)'
          : typeof r.field.value === 'object'
            ? (r.field.value as { display: string }).display
            : String(r.field.value),
      note: r.field.note,
    }));
}
