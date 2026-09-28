import React, { useState, useMemo } from 'react';
import { useStore } from '../../store/StoreContext';
import type { Product } from '../../types';
import { BUSINESS, contactLine } from '../../config/business';
import { useDialog } from '../../hooks/useDialog';
import { DemoNotice } from '../common/Modal';
import {
  BOOT_DRIVE_OPTIONS,
  CPU_OPTIONS,
  DATA_STORAGE_OPTIONS,
  MANAGEMENT_OPTIONS,
  NETWORK_OPTIONS,
  OS_OPTIONS,
  PLATFORMS,
  PSU_OPTIONS,
  RAID_CONTROLLER_OPTIONS,
  RAM_OPTIONS,
  WARRANTY_OPTIONS,
} from '../../features/configurator/configuratorOptions';
import {
  Server,
  Cpu,
  HardDrive,
  Network,
  Zap,
  ShieldCheck,
  X,
  Plus,
  Check,
  FileText,
  Printer,
  ChevronRight,
  Layers,
  Wrench,
} from 'lucide-react';

export const ServerConfiguratorModal: React.FC = () => {
  const {
    isConfiguratorOpen,
    setIsConfiguratorOpen,
    addToQuote,
    setIsQuoteDrawerOpen,
    showToast,
  } = useStore();

  const [selectedPlatformId, setSelectedPlatformId] = useState<string>('dell-r760');
  const [selectedCpuId, setSelectedCpuId] = useState<string>('cpu-dual-4410y');
  const [selectedRamId, setSelectedRamId] = useState<string>('ram-128gb');
  const [selectedBootId, setSelectedBootId] = useState<string>('boot-boss-dual-480');
  const [selectedRaidId, setSelectedRaidId] = useState<string>('raid-h755');
  const [selectedStorageId, setSelectedStorageId] = useState<string>('storage-4x-192tb-sas');
  const [selectedNicId, setSelectedNicId] = useState<string>('nic-dual-10gbe-rj45');
  const [selectedPsuId, setSelectedPsuId] = useState<string>('psu-800w-dual');
  const [selectedMgmtId, setSelectedMgmtId] = useState<string>('mgmt-enterprise');
  const [selectedOsId, setSelectedOsId] = useState<string>('os-none');
  const [selectedWarrantyId, setSelectedWarrantyId] = useState<string>('war-5yr-plus-4hr');

  const [activeTab, setActiveTab] = useState<'platform' | 'specs' | 'summary'>('specs');
  const [copiedSpec, setCopiedSpec] = useState(false);

  // Current platform
  const currentPlatform = useMemo(() => {
    return PLATFORMS.find(p => p.id === selectedPlatformId) || PLATFORMS[0];
  }, [selectedPlatformId]);

  // Current available CPUs for the platform
  const currentCpuOptions = useMemo(() => {
    return CPU_OPTIONS[selectedPlatformId] || CPU_OPTIONS['dell-r760'];
  }, [selectedPlatformId]);

  // Ensure selected CPU matches platform
  const currentCpu = useMemo(() => {
    const found = currentCpuOptions.find(c => c.id === selectedCpuId);
    return found || currentCpuOptions[0];
  }, [currentCpuOptions, selectedCpuId]);

  const currentRam = useMemo(() => RAM_OPTIONS.find(r => r.id === selectedRamId) || RAM_OPTIONS[0], [selectedRamId]);
  const currentBoot = useMemo(() => BOOT_DRIVE_OPTIONS.find(b => b.id === selectedBootId) || BOOT_DRIVE_OPTIONS[0], [selectedBootId]);
  const currentRaid = useMemo(() => RAID_CONTROLLER_OPTIONS.find(r => r.id === selectedRaidId) || RAID_CONTROLLER_OPTIONS[0], [selectedRaidId]);
  const currentStorage = useMemo(() => DATA_STORAGE_OPTIONS.find(s => s.id === selectedStorageId) || DATA_STORAGE_OPTIONS[0], [selectedStorageId]);
  const currentNic = useMemo(() => NETWORK_OPTIONS.find(n => n.id === selectedNicId) || NETWORK_OPTIONS[0], [selectedNicId]);
  const currentPsu = useMemo(() => PSU_OPTIONS.find(p => p.id === selectedPsuId) || PSU_OPTIONS[0], [selectedPsuId]);
  const currentMgmt = useMemo(() => MANAGEMENT_OPTIONS.find(m => m.id === selectedMgmtId) || MANAGEMENT_OPTIONS[0], [selectedMgmtId]);
  const currentOs = useMemo(() => OS_OPTIONS.find(o => o.id === selectedOsId) || OS_OPTIONS[0], [selectedOsId]);
  const currentWarranty = useMemo(() => WARRANTY_OPTIONS.find(w => w.id === selectedWarrantyId) || WARRANTY_OPTIONS[0], [selectedWarrantyId]);

  // Live estimated power draw
  const totalTdp = useMemo(() => {
    return (
      currentPlatform.baseTdp +
      currentCpu.tdpDelta +
      currentRam.tdpDelta +
      currentBoot.tdpDelta +
      currentRaid.tdpDelta +
      currentStorage.tdpDelta +
      currentNic.tdpDelta +
      currentMgmt.tdpDelta
    );
  }, [
    currentPlatform,
    currentCpu,
    currentRam,
    currentBoot,
    currentRaid,
    currentStorage,
    currentNic,
    currentMgmt,
  ]);

  // Estimated PSU capacity rating
  const psuWattage = useMemo(() => {
    if (selectedPsuId.includes('2400w')) return 2400;
    if (selectedPsuId.includes('1400w')) return 1400;
    return 800;
  }, [selectedPsuId]);

  const psuLoadPercentage = Math.min(Math.round((totalTdp / psuWattage) * 100), 100);

  const dialogRef = useDialog<HTMLDivElement>(isConfiguratorOpen, () => setIsConfiguratorOpen(false));

  if (!isConfiguratorOpen) return null;

  const handleAddConfigToQuote = () => {
    const customProduct: Product = {
      id: `prod-custom-${Date.now()}`,
      model: `${currentPlatform.name} — configuration request`,
      name: `Configuration request: ${currentPlatform.name}`,
      brand: currentPlatform.brand,
      category: currentPlatform.category === 'Rack Server' ? 'Server configuration request' : 'Workstation configuration request',
      sku: `CFG-REQ-${Date.now().toString().slice(-6)}`,
      shortDescription: `Requested configuration: ${currentCpu.name}; ${currentRam.name}; ${currentStorage.name}.`,
      description:
        'Configuration request created with the server configurator. Component compatibility, availability, lead time and price have NOT been checked and must be confirmed by SDS Techware.',
      // A request carries no price, stock or availability.
      price: null,
      isPricePublic: false,
      stock: null,
      isPublished: true,
      isArchived: false,
      images: [],
      specifications: [
        { key: 'Base Platform', value: currentPlatform.name },
        { key: 'Form Factor', value: currentPlatform.formFactor },
        { key: 'Processor (CPU)', value: currentCpu.name },
        { key: 'Memory (RAM)', value: currentRam.name },
        { key: 'Primary Boot Array', value: currentBoot.name },
        { key: 'Storage RAID Controller', value: currentRaid.name },
        { key: 'Data Storage Array', value: currentStorage.name },
        { key: 'Network Interface (NIC)', value: currentNic.name },
        { key: 'Power Supply', value: currentPsu.name },
        { key: 'Remote Management', value: currentMgmt.name },
        { key: 'Operating System', value: currentOs.name },
        { key: 'Support / Warranty option', value: currentWarranty.name },
        { key: 'Status', value: 'Request — subject to technical and commercial confirmation' },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addToQuote(customProduct, 1);
    showToast(`Added a configuration request for ${currentPlatform.name} to your quotation list.`);
    setIsConfiguratorOpen(false);
    setIsQuoteDrawerOpen(true);
  };

  const handleCopySpecSheet = () => {
    const specSheet = `==========================================================
${BUSINESS.legalName.value.toUpperCase()} - CONFIGURATION REQUEST
==========================================================
System: ${currentPlatform.name}
Request reference: CFG-REQ-${Date.now().toString().slice(-6)}
Date: ${new Date().toLocaleDateString('en-GB')}
STATUS: REQUEST ONLY - compatibility, availability, lead time and price
        must be confirmed by SDS Techware.

REQUESTED COMPONENTS:
----------------------------------------------------------
• Platform: ${currentPlatform.name} (${currentPlatform.formFactor})
• Processor: ${currentCpu.name}
• Memory: ${currentRam.name}
• RAID Controller: ${currentRaid.name}
• OS Boot Array: ${currentBoot.name}
• Data Storage: ${currentStorage.name}
• Networking: ${currentNic.name}
• Power Supplies: ${currentPsu.name}
• Management: ${currentMgmt.name}
• Operating System: ${currentOs.name}
• Support option: ${currentWarranty.name}

ILLUSTRATIVE POWER ESTIMATE (not validated):
----------------------------------------------------------
• Rough peak estimate: ${totalTdp} W (PSU option: ${psuWattage} W)

CONTACT: ${contactLine()}
==========================================================`;

    const copy = navigator.clipboard?.writeText(specSheet);
    if (!copy) {
      showToast('Could not copy to the clipboard in this browser.');
      return;
    }
    copy.then(
      () => {
        setCopiedSpec(true);
        setTimeout(() => setCopiedSpec(false), 2000);
        showToast('Configuration request copied to clipboard.');
      },
      () => showToast('Could not copy to the clipboard in this browser.'),
    );
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-[#10283D]/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 animate-fadeIn"
      onClick={() => setIsConfiguratorOpen(false)}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Server and workstation configuration request"
        tabIndex={-1}
        onClick={e => e.stopPropagation()}
        className="relative bg-white rounded-2xl shadow-2xl border border-[#DCE7EF] w-full max-w-6xl max-h-[92vh] flex flex-col text-[#183B57] overflow-hidden focus:outline-none"
      >
        {/* Header Strip */}
        <div className="bg-[#10283D] text-white px-5 py-4 flex items-center justify-between border-b border-[#275B86]/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#275B86] to-[#489DCA] flex items-center justify-center text-white shadow-md">
              <Server className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">
                  Server &amp; Workstation Configuration Request
                </h2>
                <span className="bg-amber-400/20 text-amber-200 text-[10px] font-mono px-2 py-0.5 rounded-full border border-amber-300/40 font-semibold">
                  Request — not validated
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Describe the build you need. Compatibility, availability and price are confirmed by SDS Techware after you send the request.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsConfiguratorOpen(false)}
            aria-label="Close Configurator"
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-[#F7FAFD] px-5 py-2.5 border-b border-[#DCE7EF] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('platform')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'platform'
                  ? 'bg-[#10283D] text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              1. Choose Platform ({currentPlatform.brand})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('specs')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'specs'
                  ? 'bg-[#10283D] text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              2. Configure Components &amp; SLA
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('summary')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'summary'
                  ? 'bg-[#10283D] text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              3. Spec Breakdown
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-1.5 text-slate-600">
              <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>
                Est. Peak Power: <strong className="text-[#10283D]">{totalTdp}W</strong>
              </span>
              <span className="text-[10px] text-slate-400">({psuLoadPercentage}% of {psuWattage}W PSU)</span>
            </div>
            <div className="hidden sm:block h-4 w-px bg-slate-300" />
            <div className="text-right">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Price</span>
              <span className="text-sm font-bold text-[#275B86]">On request</span>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          <DemoNotice>
            <strong>Configuration request, not a quote or order.</strong> Options are illustrative and have not been checked for
            compatibility (for example, controller and support-plan names differ between vendors). SDS Techware confirms feasibility,
            availability, lead time and price after receiving your request.
          </DemoNotice>
          {/* TAB 1: PLATFORM SELECTION */}
          {activeTab === 'platform' && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold text-[#10283D]">Step 1: Select Enterprise Platform Architecture</h3>
                <p className="text-xs text-slate-500">Choose between dual-socket 2U rack servers or high-core desktop workstations.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PLATFORMS.map(platform => {
                  const isSelected = platform.id === selectedPlatformId;
                  return (
                    <div
                      key={platform.id}
                      onClick={() => {
                        setSelectedPlatformId(platform.id);
                        // Reset CPU to first available
                        const opts = CPU_OPTIONS[platform.id];
                        if (opts && opts[0]) setSelectedCpuId(opts[0].id);
                      }}
                      className={`relative p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-[#275B86] bg-[#275B86]/5 ring-2 ring-[#275B86]/30 shadow-md'
                          : 'border-slate-200 bg-white hover:border-[#275B86]/50 hover:bg-slate-50/70 shadow-2xs'
                      }`}
                    >

                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#275B86] bg-[#EBF3F8] px-2 py-0.5 rounded">
                            {platform.brand} • {platform.formFactor}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-[#10283D] mt-1">{platform.name}</h4>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">{platform.description}</p>

                        <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
                          {platform.baseSpecs.map((spec, i) => (
                            <div key={i} className="text-[11px] flex items-center justify-between text-slate-500">
                              <span className="font-medium text-slate-700">{spec.key}:</span>
                              <span>{spec.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Price</span>
                          <span className="text-xs font-bold text-[#275B86]">On request</span>
                        </div>
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            setSelectedPlatformId(platform.id);
                            const opts = CPU_OPTIONS[platform.id];
                            if (opts && opts[0]) setSelectedCpuId(opts[0].id);
                            setActiveTab('specs');
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-[#275B86] text-white'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          <span>{isSelected ? 'Configure This Platform' : 'Select & Configure'}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: SPECS CONFIGURATION */}
          {activeTab === 'specs' && (
            <div className="space-y-6">
              {/* Selected Platform Banner */}
              <div className="bg-[#10283D]/5 border border-[#275B86]/30 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#275B86] text-white flex items-center justify-center shrink-0">
                    <Server className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#275B86] tracking-wider">Current Platform</span>
                    <h4 className="text-xs sm:text-sm font-bold text-[#10283D]">{currentPlatform.name} ({currentPlatform.formFactor})</h4>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('platform')}
                  className="text-xs text-[#275B86] hover:underline font-semibold self-start sm:self-auto cursor-pointer"
                >
                  Change Platform
                </button>
              </div>

              {/* 1. Processor (CPU) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#10283D] flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-[#275B86]" />
                    Processor (CPU Sockets &amp; Cores)
                  </label>
                  <span className="text-[11px] text-slate-400">Scale socket count &amp; cache</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {currentCpuOptions.map(cpu => {
                    const isSelected = cpu.id === selectedCpuId;
                    return (
                      <div
                        key={cpu.id}
                        onClick={() => setSelectedCpuId(cpu.id)}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'bg-[#275B86]/8 border-[#275B86] shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-semibold text-slate-800">{cpu.name}</span>
                          <span className="font-mono text-[11px] font-bold text-[#275B86] shrink-0">
                            {'Priced on request'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">{cpu.details}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. Memory (RAM) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#10283D] flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-[#275B86]" />
                    System Memory (DDR5 ECC Registered)
                  </label>
                  <span className="text-[11px] text-slate-400">Channel optimization &amp; RDIMM capacity</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {RAM_OPTIONS.map(ram => {
                    const isSelected = ram.id === selectedRamId;
                    return (
                      <div
                        key={ram.id}
                        onClick={() => setSelectedRamId(ram.id)}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'bg-[#275B86]/8 border-[#275B86] shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-semibold text-slate-800">{ram.name}</span>
                          <span className="font-mono text-[11px] font-bold text-[#275B86] shrink-0">
                            {'Priced on request'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">{ram.details}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. Storage Array & RAID */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* RAID Controller */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#10283D] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#275B86]" />
                    Hardware RAID Storage Controller
                  </label>
                  <div className="space-y-2">
                    {RAID_CONTROLLER_OPTIONS.map(raid => {
                      const isSelected = raid.id === selectedRaidId;
                      return (
                        <div
                          key={raid.id}
                          onClick={() => setSelectedRaidId(raid.id)}
                          className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-[#275B86]/8 border-[#275B86] shadow-xs'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-slate-800">{raid.name}</span>
                            <span className="font-mono text-[11px] font-bold text-[#275B86] shrink-0">
                              {'Priced on request'}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5">{raid.details}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Primary OS Boot Array */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#10283D] flex items-center gap-1.5">
                    <HardDrive className="w-4 h-4 text-[#275B86]" />
                    Operating System Boot Volume (M.2 / BOSS)
                  </label>
                  <div className="space-y-2">
                    {BOOT_DRIVE_OPTIONS.map(boot => {
                      const isSelected = boot.id === selectedBootId;
                      return (
                        <div
                          key={boot.id}
                          onClick={() => setSelectedBootId(boot.id)}
                          className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-[#275B86]/8 border-[#275B86] shadow-xs'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-slate-800">{boot.name}</span>
                            <span className="font-mono text-[11px] font-bold text-[#275B86] shrink-0">
                              {'Priced on request'}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5">{boot.details}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 4. Primary Data Storage Drives */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#10283D] flex items-center gap-1.5">
                  <HardDrive className="w-4 h-4 text-[#275B86]" />
                  Main Hot-Plug Storage Array (SSDs / NVMe U.2 / HDDs)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {DATA_STORAGE_OPTIONS.map(disk => {
                    const isSelected = disk.id === selectedStorageId;
                    return (
                      <div
                        key={disk.id}
                        onClick={() => setSelectedStorageId(disk.id)}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'bg-[#275B86]/8 border-[#275B86] shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-semibold text-slate-800">{disk.name}</span>
                          <span className="font-mono text-[11px] font-bold text-[#275B86] shrink-0">
                            {'Priced on request'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">{disk.details}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 5. Network Connectivity & Remote Management */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* NIC */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#10283D] flex items-center gap-1.5">
                    <Network className="w-4 h-4 text-[#275B86]" />
                    Network Interface Card (NIC)
                  </label>
                  <div className="space-y-2">
                    {NETWORK_OPTIONS.map(nic => {
                      const isSelected = nic.id === selectedNicId;
                      return (
                        <div
                          key={nic.id}
                          onClick={() => setSelectedNicId(nic.id)}
                          className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-[#275B86]/8 border-[#275B86] shadow-xs'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-slate-800">{nic.name}</span>
                            <span className="font-mono text-[11px] font-bold text-[#275B86] shrink-0">
                              {'Priced on request'}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5">{nic.details}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Management */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#10283D] flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-[#275B86]" />
                    Remote Out-of-Band Management (iDRAC / iLO)
                  </label>
                  <div className="space-y-2">
                    {MANAGEMENT_OPTIONS.map(mgmt => {
                      const isSelected = mgmt.id === selectedMgmtId;
                      return (
                        <div
                          key={mgmt.id}
                          onClick={() => setSelectedMgmtId(mgmt.id)}
                          className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-[#275B86]/8 border-[#275B86] shadow-xs'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-slate-800">{mgmt.name}</span>
                            <span className="font-mono text-[11px] font-bold text-[#275B86] shrink-0">
                              {'Priced on request'}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5">{mgmt.details}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 6. Power Supply Units (PSUs) & OS & Warranty */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* PSUs */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#10283D]">Redundant Hot-Plug PSUs</label>
                  <div className="space-y-2">
                    {PSU_OPTIONS.map(psu => {
                      const isSelected = psu.id === selectedPsuId;
                      return (
                        <div
                          key={psu.id}
                          onClick={() => setSelectedPsuId(psu.id)}
                          className={`p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                            isSelected ? 'bg-[#275B86]/8 border-[#275B86]' : 'bg-white border-slate-200'
                          }`}
                        >
                          <div className="font-semibold text-slate-800 text-[11px]">{psu.name}</div>
                          <div className="text-[10px] font-mono text-[#275B86] font-bold mt-0.5">
                            {'Priced on request'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Operating System */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#10283D]">OS / Hypervisor License</label>
                  <div className="space-y-2">
                    {OS_OPTIONS.map(os => {
                      const isSelected = os.id === selectedOsId;
                      return (
                        <div
                          key={os.id}
                          onClick={() => setSelectedOsId(os.id)}
                          className={`p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                            isSelected ? 'bg-[#275B86]/8 border-[#275B86]' : 'bg-white border-slate-200'
                          }`}
                        >
                          <div className="font-semibold text-slate-800 text-[11px]">{os.name}</div>
                          <div className="text-[10px] font-mono text-[#275B86] font-bold mt-0.5">
                            {'Priced on request'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Warranty SLA */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#10283D]">Official Warranty &amp; SLA</label>
                  <div className="space-y-2">
                    {WARRANTY_OPTIONS.map(war => {
                      const isSelected = war.id === selectedWarrantyId;
                      return (
                        <div
                          key={war.id}
                          onClick={() => setSelectedWarrantyId(war.id)}
                          className={`p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                            isSelected ? 'bg-[#275B86]/8 border-[#275B86]' : 'bg-white border-slate-200'
                          }`}
                        >
                          <div className="font-semibold text-slate-800 text-[11px]">{war.name}</div>
                          <div className="text-[10px] font-mono text-[#275B86] font-bold mt-0.5">
                            {'Priced on request'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SPECIFICATION BREAKDOWN */}
          {activeTab === 'summary' && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#10283D]">Complete Technical Bill of Materials</h3>
                  <p className="text-xs text-slate-500">Review the requested components. Nothing here has been checked for compatibility yet.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopySpecSheet}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    {copiedSpec ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <FileText className="w-3.5 h-3.5" />}
                    <span>{copiedSpec ? 'Copied!' : 'Copy request'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print</span>
                  </button>
                </div>
              </div>

              {/* Specs Table */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <tbody>
                    <tr className="border-b border-slate-200/80">
                      <td className="py-2.5 px-4 font-semibold text-slate-500 w-1/3 bg-slate-100/50">Base Platform</td>
                      <td className="py-2.5 px-4 font-bold text-[#10283D]">{currentPlatform.name} ({currentPlatform.formFactor})</td>
                    </tr>
                    <tr className="border-b border-slate-200/80">
                      <td className="py-2.5 px-4 font-semibold text-slate-500 bg-slate-100/50">Processor (CPU)</td>
                      <td className="py-2.5 px-4 text-slate-800">{currentCpu.name}</td>
                    </tr>
                    <tr className="border-b border-slate-200/80">
                      <td className="py-2.5 px-4 font-semibold text-slate-500 bg-slate-100/50">Memory (RAM)</td>
                      <td className="py-2.5 px-4 text-slate-800">{currentRam.name}</td>
                    </tr>
                    <tr className="border-b border-slate-200/80">
                      <td className="py-2.5 px-4 font-semibold text-slate-500 bg-slate-100/50">RAID Controller</td>
                      <td className="py-2.5 px-4 text-slate-800">{currentRaid.name}</td>
                    </tr>
                    <tr className="border-b border-slate-200/80">
                      <td className="py-2.5 px-4 font-semibold text-slate-500 bg-slate-100/50">OS Boot Array</td>
                      <td className="py-2.5 px-4 text-slate-800">{currentBoot.name}</td>
                    </tr>
                    <tr className="border-b border-slate-200/80">
                      <td className="py-2.5 px-4 font-semibold text-slate-500 bg-slate-100/50">Primary Data Storage</td>
                      <td className="py-2.5 px-4 text-slate-800">{currentStorage.name}</td>
                    </tr>
                    <tr className="border-b border-slate-200/80">
                      <td className="py-2.5 px-4 font-semibold text-slate-500 bg-slate-100/50">Network Interface (NIC)</td>
                      <td className="py-2.5 px-4 text-slate-800">{currentNic.name}</td>
                    </tr>
                    <tr className="border-b border-slate-200/80">
                      <td className="py-2.5 px-4 font-semibold text-slate-500 bg-slate-100/50">Power Supply (PSU)</td>
                      <td className="py-2.5 px-4 text-slate-800">{currentPsu.name}</td>
                    </tr>
                    <tr className="border-b border-slate-200/80">
                      <td className="py-2.5 px-4 font-semibold text-slate-500 bg-slate-100/50">Remote Management</td>
                      <td className="py-2.5 px-4 text-slate-800">{currentMgmt.name}</td>
                    </tr>
                    <tr className="border-b border-slate-200/80">
                      <td className="py-2.5 px-4 font-semibold text-slate-500 bg-slate-100/50">Operating System</td>
                      <td className="py-2.5 px-4 text-slate-800">{currentOs.name}</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-semibold text-slate-500 bg-slate-100/50">Support &amp; Warranty SLA</td>
                      <td className="py-2.5 px-4 font-medium text-emerald-800">{currentWarranty.name}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Power Analysis Card */}
              <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-amber-900">Illustrative power estimate (not validated)</h4>
                    <p className="text-[11px] text-amber-800">
                      Rough peak estimate: <strong>{totalTdp} W</strong>, about {psuLoadPercentage}% of the selected {psuWattage} W PSU option.
                      Use the vendor's power calculator for real sizing.
                    </p>
                  </div>
                </div>

                <div className="w-full sm:w-48 shrink-0">
                  <div className="flex items-center justify-between text-[10px] text-amber-900 mb-1">
                    <span>Power Load</span>
                    <span className="font-bold">{psuLoadPercentage}%</span>
                  </div>
                  <div className="h-2 w-full bg-amber-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        psuLoadPercentage > 80 ? 'bg-rose-500' : psuLoadPercentage > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${psuLoadPercentage}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions Strip */}
        <div className="bg-[#F7FAFD] px-5 py-4 border-t border-[#DCE7EF] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <span>Options are illustrative. Component compatibility is not validated by this tool.</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-slate-400">Price:</span>
              <span className="text-sm font-bold text-[#275B86]">On request — subject to technical &amp; commercial confirmation</span>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setIsConfiguratorOpen(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleAddConfigToQuote}
              className="flex-1 sm:flex-initial px-5 py-2.5 bg-[#275B86] hover:bg-[#10283D] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add request to quotation list</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
