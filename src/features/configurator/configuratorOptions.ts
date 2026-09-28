/**
 * Server / workstation configuration OPTIONS for the request builder.
 *
 * These lists are illustrative. They are NOT a validated compatibility
 * matrix, carry NO prices, and do not imply stock. Every configuration is a
 * request that SDS Techware must check technically and commercially.
 * Power (TDP) figures are rough illustrative estimates only.
 */

export interface PlatformOption {
  id: string;
  name: string;
  category: 'Rack Server' | 'Tower Workstation';
  brand: 'Dell' | 'HPE' | 'Lenovo';
  formFactor: string;
  baseTdp: number;
  baseSpecs: { key: string; value: string }[];
  description: string;
}

export const PLATFORMS: PlatformOption[] = [
  {
    id: 'dell-r760',
    name: 'Dell PowerEdge R760 2U Rack Server',
    category: 'Rack Server',
    brand: 'Dell',
    formFactor: '2U Dual-Socket Rackmount',
    baseTdp: 280,
    description: 'Premier 2-socket enterprise server designed for heavy virtualization, cloud databases, and AI inference workloads.',
    baseSpecs: [
      { key: 'Chassis', value: '2U Rackmount with up to 24x 2.5" NVMe/SAS Hot-Plug Bays' },
      { key: 'Chipset', value: 'Intel C741 Series Server Chipset' },
      { key: 'PCIe Slots', value: 'Up to 8x PCIe Gen5 Expansion Slots' },
    ],
  },
  {
    id: 'hpe-dl380-gen11',
    name: 'HPE ProLiant DL380 Gen11 2U Server',
    category: 'Rack Server',
    brand: 'HPE',
    formFactor: '2U Dual-Socket Rackmount',
    baseTdp: 300,
    description: 'The industry-standard dual-socket compute engine engineered for demanding container stacks and SQL/Oracle clusters.',
    baseSpecs: [
      { key: 'Chassis', value: '2U Rackmount with tri-mode storage backplane' },
      { key: 'Security', value: 'HPE Silicon Root of Trust & Secure Recovery' },
      { key: 'Management', value: 'HPE iLO 6 Advanced with Silicon-level Telemetry' },
    ],
  },
  {
    id: 'dell-precision-7960',
    name: 'Dell Precision 7960 High-Performance Workstation',
    category: 'Tower Workstation',
    brand: 'Dell',
    formFactor: 'Tower / 5U Rack-Convertible',
    baseTdp: 350,
    description: 'Ultra-powerful scalable workstation built for CAD/CAM simulation, complex 3D VFX rendering, and generative AI research.',
    baseSpecs: [
      { key: 'Form Factor', value: 'Quiet Acoustic Tower (Optional 5U Rail Mount)' },
      { key: 'Thermal System', value: 'Advanced Multi-Channel Front-to-Back Thermal Architecture' },
      { key: 'ISV Certification', value: 'Check vendor ISV certification list for your applications' },
    ],
  },
  {
    id: 'lenovo-thinkstation-p7',
    name: 'Lenovo ThinkStation P7 Professional Workstation',
    category: 'Tower Workstation',
    brand: 'Lenovo',
    formFactor: '4U Tower / Rackable',
    baseTdp: 320,
    description: 'Single-socket professional workstation platform for demanding compute workloads.',
    baseSpecs: [
      { key: 'Chassis Design', value: 'Aero-Dynamic Hex Baffle High-Flow Air Management' },
      { key: 'Architecture', value: 'Single-Socket Intel Xeon w-Series Up to 56 Cores' },
      { key: 'Expansion', value: 'Refer to vendor specifications' },
    ],
  },
];

export interface ConfigOption {
  id: string;
  name: string;
  tdpDelta: number;
  details: string;
}

export const CPU_OPTIONS: Record<string, ConfigOption[]> = {
  'dell-r760': [
    { id: 'cpu-single-4410y', name: '1x Intel Xeon Silver 4410Y (12C / 24T, 2.0GHz to 3.9GHz, 30MB Cache)', tdpDelta: 0, details: 'Standard baseline dual-socket capable configuration' },
    { id: 'cpu-dual-4410y', name: '2x Intel Xeon Silver 4410Y (24C / 48T Total, 2.0GHz, 60MB Cache)', tdpDelta: 150, details: 'High-efficiency dual CPU setup for general VM clusters' },
    { id: 'cpu-dual-6430', name: '2x Intel Xeon Gold 6430 (64C / 128T Total, 2.1GHz to 3.4GHz, 120MB Cache)', tdpDelta: 270, details: 'Enterprise sweet-spot for dense virtualization & database arrays' },
    { id: 'cpu-dual-8480p', name: '2x Intel Xeon Platinum 8480+ (112C / 224T Total, 2.0GHz to 3.8GHz, 210MB Cache)', tdpDelta: 420, details: 'Maximum scalable compute density with built-in AMX AI accelerators' },
  ],
  'hpe-dl380-gen11': [
    { id: 'hpe-cpu-single-4410y', name: '1x Intel Xeon Silver 4410Y (12C / 24T, 2.0GHz, 30MB Cache)', tdpDelta: 0, details: 'Baseline entry CPU' },
    { id: 'hpe-cpu-dual-4410y', name: '2x Intel Xeon Silver 4410Y (24C / 48T Total, 2.0GHz, 60MB Cache)', tdpDelta: 150, details: 'Dual compute sockets for HPE iLO enterprise telemetry' },
    { id: 'hpe-cpu-dual-6430', name: '2x Intel Xeon Gold 6430 (64C / 128T Total, 2.1GHz, 120MB Cache)', tdpDelta: 270, details: 'Recommended for SAP HANA and mission-critical databases' },
  ],
  'dell-precision-7960': [
    { id: 'ws-cpu-w5-3425', name: 'Intel Xeon w5-3425 (12C / 24T, 3.2GHz to 4.6GHz Turbo)', tdpDelta: 0, details: 'High single-core clocks ideal for CAD & 3D drafting' },
    { id: 'ws-cpu-w7-3465x', name: 'Intel Xeon w7-3465X (28C / 56T, 2.5GHz to 4.8GHz, 75MB Cache, Unlocked)', tdpDelta: 130, details: 'Top-tier workstation compute for multi-threaded simulation & compiling' },
    { id: 'ws-cpu-w9-3495x', name: 'Intel Xeon w9-3495X (56C / 112T, 1.9GHz to 4.8GHz, 105MB Cache, Flagship)', tdpDelta: 250, details: 'Workstation titan for LLM fine-tuning and CFD simulations' },
  ],
  'lenovo-thinkstation-p7': [
    { id: 'len-cpu-w7-2475x', name: 'Intel Xeon w7-2475X (20C / 40T, 2.6GHz to 4.8GHz)', tdpDelta: 0, details: 'High sustained turbo speeds' },
    { id: 'len-cpu-w7-3465x', name: 'Intel Xeon w7-3465X (28C / 56T, 2.5GHz to 4.8GHz Turbo)', tdpDelta: 120, details: 'Dual AVX-512 FMA execution units' },
  ],
};

export const RAM_OPTIONS: ConfigOption[] = [
  { id: 'ram-64gb', name: '64GB (2x 32GB) DDR5 4800MHz ECC Registered RDIMM', tdpDelta: 0, details: 'Dual-channel enterprise memory baseline' },
  { id: 'ram-128gb', name: '128GB (4x 32GB) DDR5 4800MHz ECC Registered RDIMM', tdpDelta: 15, details: 'Quad-channel balanced configuration for standard workloads' },
  { id: 'ram-256gb', name: '256GB (8x 32GB) DDR5 4800MHz ECC Registered RDIMM', tdpDelta: 30, details: 'Octa-channel maximum memory bandwidth utilization' },
  { id: 'ram-512gb', name: '512GB (16x 32GB) DDR5 4800MHz ECC Registered RDIMM', tdpDelta: 60, details: 'High-density virtualization & large database cache memory' },
  { id: 'ram-1tb', name: '1024GB / 1TB (16x 64GB) DDR5 4800MHz ECC Registered RDIMM', tdpDelta: 110, details: 'Maximum in-memory analytics and SAP HANA ready capacity' },
];

export const BOOT_DRIVE_OPTIONS: ConfigOption[] = [
  { id: 'boot-single-sata', name: '1x 480GB Enterprise SATA SSD 6Gbps (Internal Direct Connect)', tdpDelta: 0, details: 'Cost-effective entry hypervisor/OS drive' },
  { id: 'boot-boss-dual-480', name: 'Dual 480GB M.2 NVMe SSDs in Hardware RAID 1 (BOSS Controller with Hot-Plug)', tdpDelta: 8, details: 'Redundant mirrored OS boot volume that leaves front bays free for data' },
  { id: 'boot-boss-dual-960', name: 'Dual 960GB M.2 NVMe SSDs in Hardware RAID 1 (BOSS Controller with Hot-Plug)', tdpDelta: 10, details: 'High-capacity redundant mirrored OS array for local hypervisor logs' },
];

export const RAID_CONTROLLER_OPTIONS: ConfigOption[] = [
  { id: 'raid-h355', name: 'PERC H355 Front SAS/SATA RAID Controller (RAID 0, 1, 10)', tdpDelta: 0, details: 'Baseline entry 12Gbps storage controller' },
  { id: 'raid-h755', name: 'PERC H755 Front SAS/SATA/NVMe 8GB Non-Volatile Flash Cache (RAID 0, 1, 5, 6, 10, 50, 60)', tdpDelta: 15, details: 'High-throughput enterprise hardware caching with power-fail protection' },
  { id: 'raid-h965i', name: 'PERC H965i Front 24Gbps Tri-Mode NVMe RAID Controller (PCIe Gen4 Performance)', tdpDelta: 25, details: 'Ultra-low latency hardware controller optimized for Gen4 NVMe arrays' },
];

export const DATA_STORAGE_OPTIONS: ConfigOption[] = [
  { id: 'storage-2x-960gb-sata', name: '2x 960GB Enterprise SATA SSD 6Gbps (Mixed Use 3DWPD)', tdpDelta: 0, details: '1.92TB raw mirrored storage' },
  { id: 'storage-4x-192tb-sas', name: '4x 1.92TB Enterprise SAS 12Gbps SSD (Read Intensive)', tdpDelta: 24, details: '7.68TB raw high-reliability SAS array with dual-port pathing' },
  { id: 'storage-4x-384tb-nvme', name: '4x 3.84TB Enterprise NVMe Gen4 U.2 Hot-Plug SSD (High IOPS Tier)', tdpDelta: 50, details: '15.36TB raw high-IOPS NVMe for real-time transactional databases' },
  { id: 'storage-8x-384tb-nvme', name: '8x 3.84TB Enterprise NVMe Gen4 U.2 Hot-Plug SSD (All-Flash NVMe Array)', tdpDelta: 100, details: '30.72TB raw all-flash capacity (performance depends on configuration)' },
  { id: 'storage-4x-16tb-hdd', name: '4x 16TB 7.2K RPM Enterprise 3.5" SATA HDD (High-Capacity Archival)', tdpDelta: 36, details: '64TB raw bulk storage array for surveillance, backups, and data lakes' },
];

export const NETWORK_OPTIONS: ConfigOption[] = [
  { id: 'nic-dual-1gbe', name: 'Dual Port 1GbE RJ45 Base-T Network Card', tdpDelta: 0, details: 'Standard office & management network connectivity' },
  { id: 'nic-dual-10gbe-rj45', name: 'Broadcom 57416 Dual Port 10GbE Base-T RJ45 Network Daughter Card', tdpDelta: 14, details: '10x faster copper Ethernet for high-speed file transfers & iSCSI' },
  { id: 'nic-dual-25gbe-sfp28', name: 'Intel E810-XXV Dual Port 10/25GbE SFP28 Optical/DAC Converged Network Adapter', tdpDelta: 18, details: 'Low-latency 25Gbps optical connectivity with RoCEv2 for vSAN & Ceph' },
  { id: 'nic-mellanox-100gbe', name: 'NVIDIA Mellanox ConnectX-6 Dx Dual Port 25/50/100GbE QSFP28', tdpDelta: 26, details: 'High-bandwidth fabric interconnect for clustering, NVMe-oF, and AI pipelines' },
];

export const PSU_OPTIONS: ConfigOption[] = [
  { id: 'psu-800w-dual', name: 'Dual Hot-Plug Redundant 800W Titanium Power Supplies (1+1 Redundant Failover)', tdpDelta: 0, details: '96% energy efficiency with zero-downtime hot-swap redundancy' },
  { id: 'psu-1400w-dual', name: 'Dual Hot-Plug Redundant 1400W Platinum Power Supplies (1+1 Redundant)', tdpDelta: 0, details: 'Heavy-duty power headroom for multi-core processors & expansion cards' },
  { id: 'psu-2400w-dual', name: 'Dual Hot-Plug Redundant 2400W Titanium Power Supplies (1+1 Redundant)', tdpDelta: 0, details: 'Maximum power delivery capacity supporting up to 2x high-TDP PCIe GPUs' },
];

export const MANAGEMENT_OPTIONS: ConfigOption[] = [
  { id: 'mgmt-standard', name: 'Basic Out-of-Band Management & Local Diagnostics', tdpDelta: 0, details: 'Standard hardware health monitoring' },
  { id: 'mgmt-enterprise', name: 'iDRAC9 Enterprise / HPE iLO 6 Advanced (Virtual KVM, Remote Media, Dedicated NIC)', tdpDelta: 5, details: 'Essential enterprise remote management with full HTML5 remote console' },
  { id: 'mgmt-datacenter', name: 'iDRAC9 Datacenter / iLO Advanced Premium (Streaming Telemetry & Thermal Profiling)', tdpDelta: 6, details: 'Automated fleet management with dynamic power capping & thermal tuning' },
];

export const OS_OPTIONS: ConfigOption[] = [
  { id: 'os-none', name: 'No Operating System', tdpDelta: 0, details: 'Ready for customer deployment of custom images' },
  { id: 'os-vmware-esxi', name: 'VMware vSphere ESXi 8.0 Enterprise Plus License & Installation Media', tdpDelta: 0, details: 'The enterprise hypervisor standard with DRS and vMotion support' },
  { id: 'os-win-server-std', name: 'Microsoft Windows Server 2022 Standard Edition (16-Core Base License)', tdpDelta: 0, details: 'Official OEM perpetual license with 2 virtual OSE permissions' },
  { id: 'os-win-server-dc', name: 'Microsoft Windows Server 2022 Datacenter Edition (Unlimited Hyper-V VMs)', tdpDelta: 0, details: 'Full datacenter license allowing unlimited virtual machine instances' },
  { id: 'os-rhel', name: 'Red Hat Enterprise Linux Server (1-Year Subscription, Standard 2 Sockets)', tdpDelta: 0, details: 'Mission-critical Linux distribution with certified security updates' },
];

export const WARRANTY_OPTIONS: ConfigOption[] = [
  { id: 'war-3yr-nbd', name: '3-Year Official ProSupport Next Business Day (NBD) On-Site Service', tdpDelta: 0, details: 'Vendor support option — availability, terms and response times to be confirmed' },
  { id: 'war-5yr-nbd', name: '5-Year Official ProSupport Next Business Day (NBD) On-Site Service', tdpDelta: 0, details: 'Vendor support option — availability and terms to be confirmed' },
  { id: 'war-5yr-plus-4hr', name: '5-Year ProSupport Plus 24x7 4-Hour Critical On-Site SLA + Keep Your Hard Drive (KYHD)', tdpDelta: 0, details: 'Vendor support option — availability, terms and response times to be confirmed' },
];
