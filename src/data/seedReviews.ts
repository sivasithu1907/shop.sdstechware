import type { ProductReview } from '../types';

/**
 * DEMO SAMPLE REVIEWS — illustrative text only.
 * These are NOT real customer reviews and do not describe real purchases.
 * They are always labelled "Demo sample" in the UI. Replace or remove before
 * launch; real reviews need a moderated backend.
 */

export const DEFAULT_REVIEWS: ProductReview[] = [
  // Logitech MX Master 3S
  {
    id: 'rev-mx3s-1',
    productId: 'prod-mx-master-3s',
    authorName: 'Sample reviewer 1',
    authorRole: 'Lead Software Architect',
    rating: 5,
    title: 'Indispensable tool for full-stack engineering and multi-monitor setups',
    comment:
      'We standardized on the MX Master 3S for our senior engineering floor. The MagSpeed scroll wheel makes skimming through thousands of lines of log files and code bases instantaneous. Quiet clicks are a noticeable improvement in our open-plan office. Battery life is easily 60+ days between USB-C charges.',
    date: '2026-02-18',
    verifiedPurchase: false,
    isDemoSample: true,
    helpfulCount: 14,
  },
  {
    id: 'rev-mx3s-2',
    productId: 'prod-mx-master-3s',
    authorName: 'Sample reviewer 2',
    authorRole: 'UI/UX Director',
    rating: 5,
    title: 'The horizontal thumb wheel and 8K DPI sensor are unbeatable for design',
    comment:
      'Tracks flawlessly on transparent glass conference tables where optical mice stutter. The horizontal wheel in Figma and Adobe Illustrator saves huge amounts of time. Ergonomics have completely alleviated wrist strain during 10-hour sprint cycles.',
    date: '2026-02-28',
    verifiedPurchase: false,
    isDemoSample: true,
    helpfulCount: 9,
  },
  {
    id: 'rev-mx3s-3',
    productId: 'prod-mx-master-3s',
    authorName: 'Sample reviewer 3',
    authorRole: 'Procurement Specialist',
    rating: 4,
    title: 'Top-tier ergonomics, though requires Logi Options+ software for gestures',
    comment:
      'Users praised the build quality and thumb ergonomics. Only minor caveat is that our corporate locked-down laptops needed IT admin clearance to deploy Logi Options+ software for custom button mappings.',
    date: '2026-03-04',
    verifiedPurchase: false,
    isDemoSample: true,
    helpfulCount: 6,
  },

  // Logitech MX Keys S
  {
    id: 'rev-mxks-1',
    productId: 'prod-mx-keys-s',
    authorName: 'Sample reviewer 4',
    authorRole: 'Senior QA Engineer',
    rating: 5,
    title: 'Tactile perfection with seamless Mac and Windows multi-device switching',
    comment:
      'The spherical dished keycaps match your fingertips naturally. Switching between my company ThinkPad and personal MacBook with the Easy-Switch keys (1-2-3) happens in under a second. The smart proximity backlighting is subtle and battery-efficient.',
    date: '2026-02-12',
    verifiedPurchase: false,
    isDemoSample: true,
    helpfulCount: 11,
  },
  {
    id: 'rev-mxks-2',
    productId: 'prod-mx-keys-s',
    authorName: 'Sample reviewer 5',
    authorRole: 'Financial Analyst',
    rating: 5,
    title: 'Heavyweight aluminum base plate prevents any desk slip',
    comment:
      'Outstanding keyboard for extensive Excel modelling. The low profile scissor switches provide high typing speed with minimal finger fatigue. The bundled Logi Bolt receiver provides rock-solid wireless stability even in congested 2.4GHz office environments.',
    date: '2026-03-01',
    verifiedPurchase: false,
    isDemoSample: true,
    helpfulCount: 5,
  },

  // Kingston NV2 1TB NVMe SSD
  {
    id: 'rev-nv2-1',
    productId: 'prod-kingston-nv2-1tb',
    authorName: 'Sample reviewer 6',
    authorRole: 'Infrastructure Systems Administrator',
    rating: 5,
    title: 'Best price-to-performance Gen 4x4 drive for workstation upgrades',
    comment:
      'Used for upgrading 11th/12th Gen Intel office desktops. Sequential read bench reached 3,520 MB/s. Boot times went from 45 seconds on legacy SATA drives down to 6 seconds. Thermal performance under standard M.2 motherboard heatsinks stays below 48°C under load.',
    date: '2026-02-22',
    verifiedPurchase: false,
    isDemoSample: true,
    helpfulCount: 16,
  },
  {
    id: 'rev-nv2-2',
    productId: 'prod-kingston-nv2-1tb',
    authorName: 'Sample reviewer 7',
    authorRole: 'Video Editor & Producer',
    rating: 4,
    title: 'Solid reliable scratch disk for 4K video editing workflows',
    comment:
      'Installed in an external Thunderbolt 4 enclosure as a field capture scratch drive. Handles ProRes and raw timeline scrubbing smoothly. For continuous 500GB+ transfers it does throttle slightly once the SLC cache fills, but for day-to-day office and studio usage it is exceptional value.',
    date: '2026-03-03',
    verifiedPurchase: false,
    isDemoSample: true,
    helpfulCount: 8,
  },

  // TP-Link Archer AX53 Wi-Fi 6 Router
  {
    id: 'rev-ax53-1',
    productId: 'prod-tplink-ax53',
    authorName: 'Sample reviewer 8',
    authorRole: 'Branch IT Support Manager',
    rating: 5,
    title: 'Seamless coverage for 35+ concurrent office laptops and VoIP handsets',
    comment:
      'Replaced an older Wi-Fi 5 access point at our regional warehouse facility. The OFDMA and MU-MIMO capabilities on Wi-Fi 6 eliminated video conferencing dropouts during daily standups. Beamforming maintains stable 5GHz signals across concrete partition walls.',
    date: '2026-02-14',
    verifiedPurchase: false,
    isDemoSample: true,
    helpfulCount: 12,
  },
  {
    id: 'rev-ax53-2',
    productId: 'prod-tplink-ax53',
    authorName: 'Sample reviewer 9',
    authorRole: 'Network Operations Engineer',
    rating: 4,
    title: 'Intuitive Tether app and strong WPA3 enterprise security protocol',
    comment:
      'Gigabit WAN handles our 300 Mbps fiber line without bottlenecking. HomeShield features like guest network isolation and device bandwidth prioritization work smoothly. Great enterprise router choice for SME operations.',
    date: '2026-02-27',
    verifiedPurchase: false,
    isDemoSample: true,
    helpfulCount: 4,
  },

  // APC Back-UPS BX750MI
  {
    id: 'rev-apc-1',
    productId: 'prod-apc-bx750mi',
    authorName: 'Sample reviewer 10',
    authorRole: 'Bio-Medical IT Coordinator',
    rating: 5,
    title: 'Rock-solid AVR protection during grid voltage fluctuations',
    comment:
      'In our area we experience frequent brownouts. The Automatic Voltage Regulation (AVR) on this APC unit stabilizes low line voltage without exhausting the battery. Keeps our pathology workstation, barcode printer, and router running with 18-20 minutes of runtime to safely save patient databases.',
    date: '2026-02-10',
    verifiedPurchase: false,
    isDemoSample: true,
    helpfulCount: 15,
  },
  {
    id: 'rev-apc-2',
    productId: 'prod-apc-bx750mi',
    authorName: 'Sample reviewer 11',
    authorRole: 'Field Technical Officer',
    rating: 5,
    title: 'Universal socket layout accommodates standard UK plugs with ease',
    comment:
      'The 4 universal outlets mean we do not need awkward adapters for UK 3-pin plugs. Stepped sine wave is completely fine for switching power supplies. Highly recommended for commercial cash registers and critical desktop towers.',
    date: '2026-02-24',
    verifiedPurchase: false,
    isDemoSample: true,
    helpfulCount: 7,
  },

  // Dell P2425H Monitor
  {
    id: 'rev-p2425h-1',
    productId: 'prod-dell-p2425h',
    authorName: 'Sample reviewer 12',
    authorRole: 'Senior Consultant',
    rating: 5,
    title: 'Superior ergonomic height and pivot stand with ComfortView Plus',
    comment:
      'The 100Hz refresh rate makes document scrolling and IDE navigation much smoother than traditional 60Hz corporate displays. The built-in ComfortView Plus low blue light hardware filter preserves true colors without that yellow tint. The height/pivot/tilt stand is the best in this price bracket.',
    date: '2026-02-20',
    verifiedPurchase: false,
    isDemoSample: true,
    helpfulCount: 13,
  },
  {
    id: 'rev-p2425h-2',
    productId: 'prod-dell-p2425h',
    authorName: 'Sample reviewer 13',
    authorRole: 'Compliance Lead',
    rating: 5,
    title: 'Pivot rotation to portrait mode is fantastic for contract reviewing',
    comment:
      'Rotating to portrait mode allows reading multi-page legal agreements without excessive zooming. The USB 3.2 pass-through ports on the bottom bezel make plugging in encrypted flash drives effortless.',
    date: '2026-03-02',
    verifiedPurchase: false,
    isDemoSample: true,
    helpfulCount: 6,
  },

  // Kingston FURY Beast 16GB DDR5
  {
    id: 'rev-fury-1',
    productId: 'prod-kingston-fury-beast',
    authorName: 'Sample reviewer 14',
    authorRole: 'CAD & VFX Systems Specialist',
    rating: 5,
    title: 'Zero compatibility hurdles with Intel XMP 3.0 on B760 motherboards',
    comment:
      'Plugged in, enabled XMP Profile 1 in UEFI, and immediately ran at rated 5600 MT/s CL40 with zero memory errors across 24 hours of MemTest86. Low profile heat spreader cleared our large dual-tower air cooler cleanly.',
    date: '2026-02-15',
    verifiedPurchase: false,
    isDemoSample: true,
    helpfulCount: 8,
  },

  // HP 85A Toner
  {
    id: 'rev-hp85a-1',
    productId: 'prod-hp-85a',
    authorName: 'Sample reviewer 15',
    authorRole: 'Administrative Officer',
    rating: 5,
    title: 'Original OEM cartridge guarantees smudge-free official invoices',
    comment:
      'We tried non-genuine toners in the past and suffered drum streaks and paper jams. Switching back to genuine HP 85A cartridges restored flawless dark monochrome print quality across all 1,600+ pages.',
    date: '2026-02-08',
    verifiedPurchase: false,
    isDemoSample: true,
    helpfulCount: 10,
  },

  // SanDisk Ultra Flair 64GB
  {
    id: 'rev-sandisk-1',
    productId: 'prod-sandisk-ultra-flair',
    authorName: 'Sample reviewer 16',
    authorRole: 'Field IT Technician',
    rating: 4,
    title: 'Durable metal body built to withstand daily keychain use',
    comment:
      'I use this as a bootable Ventoy multi-ISO rescue drive for Windows and Linux deployments. Read speed is consistently above 130 MB/s. The aluminum shell warms up slightly during heavy writes, but the metal keyring loop is very durable.',
    date: '2026-02-19',
    verifiedPurchase: false,
    isDemoSample: true,
    helpfulCount: 9,
  },

  // Logitech C270 Webcam
  {
    id: 'rev-c270-1',
    productId: 'prod-logitech-c270',
    authorName: 'Sample reviewer 17',
    authorRole: 'Operations Coordinator',
    rating: 4,
    title: 'Dependable plug-and-play webcam for daily Zoom and MS Teams meetings',
    comment:
      'Reliable workhorse for employee workstations. The noise-reducing microphone picks up speech clearly while filtering out background AC hum. Natural auto-light adjustment performs well even in fluorescent-lit cubicles.',
    date: '2026-02-16',
    verifiedPurchase: false,
    isDemoSample: true,
    helpfulCount: 7,
  },

  // WD Elements 2TB
  {
    id: 'rev-wd2tb-1',
    productId: 'prod-wd-elements-2tb',
    authorName: 'Sample reviewer 18',
    authorRole: 'Data Protection Officer',
    rating: 5,
    title: 'Silent and reliable offline backup solution for quarterly archives',
    comment:
      'Purchased for encrypted offline departmental backups. Formatted NTFS straight out of the box, runs quiet with minimal vibration, and transfers large SQL dump folders at stable 110-120 MB/s speeds over USB 3.0.',
    date: '2026-02-25',
    verifiedPurchase: false,
    isDemoSample: true,
    helpfulCount: 11,
  },

  // Baseus GaN5 Pro 65W
  {
    id: 'rev-baseus-1',
    productId: 'prod-baseus-65w-gan',
    authorName: 'Sample reviewer 19',
    authorRole: 'Mobile Solutions Consultant',
    rating: 5,
    title: 'Replaced three bulky chargers in my corporate travel bag',
    comment:
      'Powers my Dell Latitude 65W via USB-C while simultaneously fast-charging an iPhone and test tablet from the remaining ports. The GaN technology keeps it astonishingly compact and cool during intensive charging cycles.',
    date: '2026-02-26',
    verifiedPurchase: false,
    isDemoSample: true,
    helpfulCount: 12,
  },
];
