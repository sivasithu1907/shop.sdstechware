/**
 * DEMO WARRANTY RECORDS — fictional sample data for the warranty lookup UI.
 * Serial numbers, dates, coverage and service history are invented examples.
 * They are not real customer assets, not SDS Techware transactions, and not
 * verified with any manufacturer or distributor. A real lookup needs an
 * authorised manufacturer/distributor integration.
 */

export interface DemoWarrantyRecord {
  serial: string;
  brand: 'Dell' | 'HPE' | 'Lenovo' | 'Apple' | 'Cisco';
  model: string;
  category: string;
  distributor: string;
  purchaseDate: string;
  warrantyStart: string;
  warrantyEnd: string;
  slaTier: string;
  slaResponseTime: string;
  coveredItems: string[];
  keepYourHardDrive: boolean;
  serviceHistory: { date: string; description: string; status: string }[];
}

export const DEMO_WARRANTY_RECORDS: Record<string, DemoWarrantyRecord> = {
  'DELL-8X92KF3': {
    serial: 'DELL-8X92KF3',
    brand: 'Dell',
    model: 'Dell PowerEdge R760 2U Rack Server (Dual Xeon Gold 6430)',
    category: 'Enterprise Server',
    distributor: 'Sample distributor (demo data)',
    purchaseDate: '15 March 2024',
    warrantyStart: '15 March 2024',
    warrantyEnd: '14 March 2027',
    slaTier: 'Dell ProSupport Plus 24x7x365 Mission Critical',
    slaResponseTime: '4-Hour Critical On-Site Engineer Dispatch',
    coveredItems: [
      'Dual Xeon Scalable Processors & Motherboard',
      'Hot-Plug Redundant Platinum 1400W PSUs',
      'PERC H755 Hardware RAID Controller',
      'All Factory Certified DDR5 ECC RDIMMs',
      'Hot-Plug Enterprise NVMe U.2 SSDs',
      'On-Site Certified Systems Engineer Dispatch',
    ],
    keepYourHardDrive: true,
    serviceHistory: [
      { date: '12 Jan 2025', description: 'Preventative firmware patch update via iDRAC9 Enterprise', status: 'Completed' },
      { date: '18 Aug 2024', description: 'Proactive memory channel diagnostic baseline scan', status: 'Passed' },
    ],
  },
  'HPE-CZJ2340K9A': {
    serial: 'HPE-CZJ2340K9A',
    brand: 'HPE',
    model: 'HPE ProLiant DL380 Gen11 Rack Server',
    category: 'Enterprise Server',
    distributor: 'Sample distributor (demo data)',
    purchaseDate: '10 June 2023',
    warrantyStart: '10 June 2023',
    warrantyEnd: '09 June 2026',
    slaTier: 'HPE Pointnext Complete Care 24x7',
    slaResponseTime: '6-Hour Call-To-Repair (CTR) On-Site SLA',
    coveredItems: [
      'Chassis, Backplane & Smart Array Tri-Mode RAID',
      'Redundant Hot-Plug System Fans & PSUs',
      'HPE iLO 6 Advanced License Entitlement',
      '24/7 Priority Emergency Phone Hotline',
    ],
    keepYourHardDrive: true,
    serviceHistory: [
      { date: '04 Nov 2024', description: 'Hot-plug fan module 4 replacement under warranty', status: 'Dispatched & Completed' },
    ],
  },
  'LEN-PF4892MX': {
    serial: 'LEN-PF4892MX',
    brand: 'Lenovo',
    model: 'ThinkPad P1 Gen 6 Mobile Workstation (i9-13900H / RTX 4080)',
    category: 'Mobile Workstation',
    distributor: 'Sample distributor (demo data)',
    purchaseDate: '01 September 2023',
    warrantyStart: '01 September 2023',
    warrantyEnd: '31 August 2026',
    slaTier: 'Lenovo Premier Support Plus with Accidental Damage Protection',
    slaResponseTime: 'Next Business Day On-Site Priority Service',
    coveredItems: [
      'Full System Unit & Factory Display Panel (4K OLED)',
      'Accidental Damage Protection (Liquid Spill & Drops)',
      'Sealed Battery 3-Year Extended Warranty',
      'Dedicated Technical Account Manager Escalation',
    ],
    keepYourHardDrive: false,
    serviceHistory: [
      { date: '14 May 2024', description: 'Annual battery health calibration check', status: 'Verified Healthy' },
    ],
  },
  'APL-C02GQ91KMD6R': {
    serial: 'APL-C02GQ91KMD6R',
    brand: 'Apple',
    model: 'MacBook Pro 16" (Apple M3 Max 16-Core / 64GB RAM / 1TB SSD)',
    category: 'Commercial Ultrabook',
    distributor: 'Sample distributor (demo data)',
    purchaseDate: '20 November 2023',
    warrantyStart: '20 November 2023',
    warrantyEnd: '19 November 2026',
    slaTier: 'AppleCare+ for Enterprise with Onsite Support',
    slaResponseTime: 'Same-Day Authorized Service Center Priority',
    coveredItems: [
      'Apple Silicon M3 Max SoC & Logic Board',
      'Liquid Retina XDR Display',
      'Unlimited Incidents of Accidental Damage Protection',
      'Original 140W USB-C GaN Power Adapter & MagSafe Cable',
    ],
    keepYourHardDrive: false,
    serviceHistory: [],
  },
  'DELL-5M71WQ2': {
    serial: 'DELL-5M71WQ2',
    brand: 'Dell',
    model: 'Dell Precision 7680 Mobile Workstation (Core i7 / RTX 3500 Ada)',
    category: 'Mobile Workstation',
    distributor: 'Sample distributor (demo data)',
    purchaseDate: '10 January 2022',
    warrantyStart: '10 January 2022',
    warrantyEnd: '09 January 2025',
    slaTier: 'Dell ProSupport 3-Year NBD (Expired)',
    slaResponseTime: 'Next Business Day Service (Post-Warranty Available)',
    coveredItems: [
      'Original Base Hardware (Coverage Expired)',
      'Eligible for 1-Year or 2-Year Post-Warranty ProSupport Renewal',
    ],
    keepYourHardDrive: false,
    serviceHistory: [
      { date: '11 Oct 2023', description: 'Thermal paste re-application and cooling fan check', status: 'Completed' },
    ],
  },
  'CIS-FOC2134R98': {
    serial: 'CIS-FOC2134R98',
    brand: 'Cisco',
    model: 'Cisco Catalyst 9300-48P PoE+ Enterprise Core Switch',
    category: 'Networking Infrastructure',
    distributor: 'Sample distributor (demo data)',
    purchaseDate: '12 August 2023',
    warrantyStart: '12 August 2023',
    warrantyEnd: '11 August 2026',
    slaTier: 'Cisco SMARTnet 8x5xNBD Advanced Hardware Replacement',
    slaResponseTime: 'Next Business Day Advance Hardware Replacement',
    coveredItems: [
      '48-Port Gigabit PoE+ Power Plane (740W PoE Budget)',
      'Cisco DNA Premier 3-Year Subscription Entitlement',
      '24/7 Cisco TAC Escalation Access & Software Updates',
    ],
    keepYourHardDrive: true,
    serviceHistory: [],
  },
};

export type WarrantyStatus = 'active' | 'expiring' | 'expired';

function parseDisplayDate(value: string): Date | null {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Status is derived from the end date (not stored), so it never goes stale. "Expiring" = within 60 days. */
export function computeWarrantyStatus(warrantyEnd: string, now: Date = new Date()): { status: WarrantyStatus; daysRemaining: number } {
  const end = parseDisplayDate(warrantyEnd);
  if (!end) return { status: 'expired', daysRemaining: 0 };
  const days = Math.ceil((end.getTime() - now.getTime()) / 86400000);
  if (days <= 0) return { status: 'expired', daysRemaining: 0 };
  return { status: days <= 60 ? 'expiring' : 'active', daysRemaining: days };
}

/** Share of the warranty period already used (0–100), for the progress bar. */
export function warrantyElapsedPercent(start: string, end: string, now: Date = new Date()): number {
  const s = parseDisplayDate(start);
  const e = parseDisplayDate(end);
  if (!s || !e || e <= s) return 100;
  return Math.min(100, Math.max(0, Math.round(((now.getTime() - s.getTime()) / (e.getTime() - s.getTime())) * 100)));
}
