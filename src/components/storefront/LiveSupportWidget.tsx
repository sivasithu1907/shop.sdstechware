import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store/StoreContext';
import { BUSINESS } from '../../config/business';
import { LIMITS } from '../../config/settings';
import {
  DEMO_ASSISTANT_NAME,
  DEMO_GREETING,
  contactReply,
  generateDemoReply,
  type DemoQuickAction,
} from '../../features/support/demoAssistantScript';
import { readJSON, readString, STORAGE_KEYS, writeJSON, writeString, isRecord } from '../../lib/storage';
import { Product } from '../../types';
import {
  MessageSquare,
  X,
  Send,
  Headphones,
  RotateCcw,
  CheckCheck,
  ChevronDown,
  FileText,
  Clock,
  Sparkles,
  PhoneCall,
  Zap,
  Paperclip,
  Eye,
  Volume2,
  VolumeX,
  Download,
  Share2,
} from 'lucide-react';

export interface ChatAttachment {
  name: string;
  url: string;
  size?: string;
  type?: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'rep';
  text: string;
  timestamp: string;
  attachment?: ChatAttachment;
  quickActions?: DemoQuickAction[];
}

interface QuickReplyItem {
  id: string;
  label: string;
  icon?: string;
  phrase: string;
}

const QUICK_REPLIES: QuickReplyItem[] = [
  { id: 'stock', label: 'Is it in stock?', icon: '📦', phrase: 'Is this item in stock?' },
  { id: 'contact', label: 'Talk to a person', icon: '🎧', phrase: 'How do I contact a person?' },
  { id: 'quote', label: 'Bulk pricing / quote', icon: '💼', phrase: 'How do I request a bulk quote?' },
  { id: 'delivery', label: 'Delivery lead times', icon: '🚚', phrase: 'What are your delivery lead times?' },
  { id: 'warranty', label: 'Warranties', icon: '🛡️', phrase: 'Do you provide manufacturer warranties?' },
  { id: 'servers', label: 'Custom server configs', icon: '🖥️', phrase: 'Can I get custom server configurations?' },
];

const DEFAULT_GREETING: ChatMessage = {
  id: 'msg-welcome-demo',
  sender: 'rep',
  text: DEMO_GREETING,
  timestamp: '',
  quickActions: [
    { label: '💼 Open quotation list', actionType: 'open_quote' },
    { label: '🖥️ Server configuration request', actionType: 'open_configurator' },
    { label: '📞 Contact details', actionType: 'contact_sales' },
  ],
};

/** Load saved chat messages; the earlier prototype's persona greeting is replaced. */
function loadMessages(): ChatMessage[] {
  const { value } = readJSON<ChatMessage[]>(
    STORAGE_KEYS.SUPPORT_MESSAGES,
    parsed => {
      if (!Array.isArray(parsed)) return null;
      const msgs = parsed.filter(
        (m): m is ChatMessage => isRecord(m) && typeof m.id === 'string' && typeof m.text === 'string' && (m.sender === 'user' || m.sender === 'rep'),
      );
      return { value: msgs, dropped: parsed.length - msgs.length };
    },
    () => [DEFAULT_GREETING],
  );
  const cleaned = value
    .filter(m => m.id !== 'msg-welcome-1')
    // Old scripted quick actions pointed at categories that do not exist; drop them.
    .map(m => (m.sender === 'rep' && m.quickActions?.some(a => !['open_quote', 'open_configurator', 'contact_sales', 'search'].includes(a.actionType)) ? { ...m, quickActions: undefined } : m));
  return cleaned.length ? (cleaned[0].id === DEFAULT_GREETING.id ? cleaned : [DEFAULT_GREETING, ...cleaned]) : [DEFAULT_GREETING];
}

export const LiveSupportWidget: React.FC = () => {
  const { quoteItems, setIsQuoteDrawerOpen, setSearchQuery, setIsConfiguratorOpen, addToQuote, showToast } = useStore();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Transcript export panel
  const [isExportMenuOpen, setIsExportMenuOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>(loadMessages);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const responseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [pendingAttachment, setPendingAttachment] = useState<ChatAttachment | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // Sound notification preference (default: enabled)
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const stored = readString(STORAGE_KEYS.SUPPORT_SOUND);
    return stored !== null ? stored === 'true' : true;
  });

  // Persist sound preference
  useEffect(() => {
    writeString(STORAGE_KEYS.SUPPORT_SOUND, String(soundEnabled));
  }, [soundEnabled]);

  // Subtle audio notification synthesized via Web Audio API (warm enterprise dual-tone chime)
  const playReceiveNotificationSound = (forcePlay = false) => {
    if (!soundEnabled && !forcePlay) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const now = ctx.currentTime;

      // Note 1: Warm fundamental tone (E5 ~ 659.25 Hz gliding subtly to A5 ~ 880 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12);

      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.08, now + 0.02); // soft, subtle volume
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      // Note 2: Gentle crystalline bell harmonic (E6 ~ 1318.5 Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1318.5, now + 0.07);

      gain2.gain.setValueAtTime(0, now + 0.07);
      gain2.gain.linearRampToValueAtTime(0.035, now + 0.09);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.48);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.45);
      osc2.start(now + 0.07);
      osc2.stop(now + 0.5);

      setTimeout(() => {
        ctx.close().catch(() => {});
      }, 700);
    } catch {
      // Audio playback fails silently if browser blocks autoplay
    }
  };

  // Subtle soft tap when user sends a message
  const playSendSound = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(620, now + 0.04);

      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.07);

      setTimeout(() => {
        ctx.close().catch(() => {});
      }, 200);
    } catch {
      // ignore
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    if (file.size > LIMITS.chatImageMaxBytes) {
      showToast('Image is too large for this demo chat (max 1 MB). It would be stored in your browser.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setPendingAttachment({
          name: file.name,
          url: result,
          size: formatFileSize(file.size),
          type: file.type,
        });
        setTimeout(() => inputRef.current?.focus(), 60);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
    if (e.target) {
      e.target.value = '';
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          processImageFile(file);
          e.preventDefault();
          break;
        }
      }
    }
  };

  // Cleanup pending typing timers on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (responseTimeoutRef.current) clearTimeout(responseTimeoutRef.current);
    };
  }, []);

  // Persist chat locally. If storage is full, retry without image data rather than failing silently.
  useEffect(() => {
    const full = writeJSON(STORAGE_KEYS.SUPPORT_MESSAGES, messages);
    if (!full.ok) {
      const slim = messages.map(m => (m.attachment ? { ...m, attachment: { ...m.attachment, url: '' } } : m));
      const retry = writeJSON(STORAGE_KEYS.SUPPORT_MESSAGES, slim);
      if (!retry.ok) console.warn('Chat history could not be saved in this browser.');
    }
  }, [messages]);

  // Auto-scroll when messages change or typing status changes
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  // Focus input when window opens
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const getCurrentTimeString = () => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Scripted demo replies (see features/support/demoAssistantScript.ts)
  const generateSalesResponse = (userText: string, hasAttachment = false) =>
    generateDemoReply(userText, { quoteLineCount: quoteItems.length, hasAttachment });

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend !== undefined ? textToSend : inputMessage).trim();
    const attachmentToSend = textToSend ? undefined : pendingAttachment;

    if (!text && !attachmentToSend) return;

    const userMsg: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      sender: 'user',
      text: text || (attachmentToSend ? `[Screenshot Attached: ${attachmentToSend.name}]` : ''),
      timestamp: getCurrentTimeString(),
      attachment: attachmentToSend || undefined,
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    if (!textToSend) {
      setPendingAttachment(null);
    }
    playSendSound();

    // Clear any pending typing timers before scheduling new response
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (responseTimeoutRef.current) clearTimeout(responseTimeoutRef.current);

    // Realistic brief delay before staff starts typing (380ms)
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(true);

      // Short delay before showing the scripted reply
      responseTimeoutRef.current = setTimeout(() => {
        const responseData = generateSalesResponse(text, Boolean(attachmentToSend));
        const repMsg: ChatMessage = {
          id: `msg-rep-${Date.now()}`,
          sender: 'rep',
          text: responseData.reply,
          timestamp: getCurrentTimeString(),
          quickActions: responseData.quickActions,
        };

        setMessages(prev => [...prev, repMsg]);
        setIsTyping(false);
        playReceiveNotificationSound();

        if (!isOpen) {
          setUnreadCount(prev => prev + 1);
        }
      }, 1200);
    }, 380);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleActionClick = (action: DemoQuickAction) => {
    if (action.actionType === 'open_quote') {
      setIsQuoteDrawerOpen(true);
      setIsOpen(false);
    } else if (action.actionType === 'open_configurator') {
      setIsConfiguratorOpen(true);
      setIsOpen(false);
    } else if (action.actionType === 'search') {
      setSearchQuery(action.query);
      setIsOpen(false);
    } else if (action.actionType === 'contact_sales') {
      setMessages(prev => [...prev, { id: `msg-${Date.now()}`, sender: 'rep', text: contactReply(), timestamp: getCurrentTimeString() }]);
    }
  };

  const handleResetChat = () => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (responseTimeoutRef.current) clearTimeout(responseTimeoutRef.current);
    setIsTyping(false);
    setMessages([DEFAULT_GREETING]);
    setUnreadCount(0);
    setIsExportMenuOpen(false);
  };

  const handleDownloadTranscript = () => {
    const timestamp = new Date().toLocaleString('en-GB');
    const lines = [
      '==========================================================',
      `${BUSINESS.legalName.value.toUpperCase()} - DEMO ASSISTANT TRANSCRIPT`,
      '==========================================================',
      `Saved: ${timestamp}`,
      'Note: replies were generated by a scripted demo assistant, not by SDS Techware staff.',
      'Nobody at SDS Techware has seen this conversation.',
      '----------------------------------------------------------',
      ...messages.map(m => {
        const sender = m.sender === 'user' ? 'You' : DEMO_ASSISTANT_NAME;
        const attachStr = m.attachment ? ` [Image: ${m.attachment.name}]` : '';
        return `[${m.timestamp || '-'}] ${sender}:\n${m.text}${attachStr}\n`;
      }),
      '----------------------------------------------------------',
      'QUOTATION LIST:',
      quoteItems.length > 0
        ? quoteItems.map((item, idx) => `${idx + 1}. ${item.product.name} (Qty: ${item.quantity}) - SKU: ${item.product.sku}`).join('\n')
        : 'Empty.',
      '----------------------------------------------------------',
      `Contact SDS Techware: ${BUSINESS.salesEmail.value} · ${BUSINESS.phone.value.display}`,
      '==========================================================',
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SDS-Techware-Demo-Chat-${Date.now().toString().slice(-6)}.txt`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast('Chat transcript downloaded.');
  };

  const handleConvertChatToRfq = () => {
    const consultationProduct: Product = {
      id: `prod-rfq-chat-${Date.now()}`,
      model: 'General enquiry (from demo chat)',
      name: 'General enquiry',
      brand: 'SDS Techware',
      category: 'Enquiry',
      sku: `ENQ-CHAT-${Date.now().toString().slice(-6)}`,
      shortDescription: `General enquiry added from the demo chat on ${new Date().toLocaleDateString('en-GB')}. Describe your needs in the notes field.`,
      description: 'Placeholder line for a general enquiry. Please describe your requirements in the quotation notes.',
      price: null,
      isPricePublic: false,
      stock: null,
      isPublished: true,
      isArchived: false,
      images: [],
      specifications: [{ key: 'Source', value: 'Demo chat (scripted assistant)' }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addToQuote(consultationProduct, 1);
    showToast('Added a general enquiry line to your quotation list. Add details in the notes.');
    setIsExportMenuOpen(false);
    setIsQuoteDrawerOpen(true);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* 1. Chat Window with smooth slide-in entry & exit animations */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="live-support-window"
            role="dialog"
            aria-label="Demo assistant chat (scripted, not monitored)"
            initial={{ opacity: 0, y: 32, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{
              type: 'spring',
              damping: 26,
              stiffness: 340,
              mass: 0.8,
            }}
            className="mb-3 w-[calc(100vw-2rem)] sm:w-[380px] h-[520px] max-h-[82vh] bg-white rounded-2xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden origin-bottom-right"
          >
            {/* Header */}
            <div className="bg-[#10283D] text-white px-4 py-3 flex items-center justify-between shadow-sm shrink-0 border-b border-[#275B86]/40">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#275B86] to-[#489DCA] flex items-center justify-center font-bold text-white shadow-inner">
                    <Headphones className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="leading-tight">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-semibold tracking-tight text-white">{DEMO_ASSISTANT_NAME}</h3>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border bg-amber-500/20 text-amber-200 border-amber-400/30">
                      Scripted demo
                    </span>
                  </div>
                  {isTyping ? (
                    <p className="text-[11px] text-slate-300 font-medium">Preparing scripted reply…</p>
                  ) : (
                    <p className="text-[11px] text-slate-300 font-normal">Not a person · not monitored</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/* Transcript Export & Email toggle */}
                <button
                  type="button"
                  onClick={() => setIsExportMenuOpen(prev => !prev)}
                  title="Download transcript or add an enquiry line"
                  aria-label="Transcript options"
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    isExportMenuOpen
                      ? 'bg-white/20 text-white'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>

                {/* Sound notification toggle */}
                <button
                  type="button"
                  onClick={() => {
                    const next = !soundEnabled;
                    setSoundEnabled(next);
                    if (next) {
                      playReceiveNotificationSound(true);
                    }
                  }}
                  title={soundEnabled ? 'Mute notification sound' : 'Enable notification sound'}
                  aria-label={soundEnabled ? 'Mute notification sound' : 'Enable notification sound'}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    soundEnabled
                      ? 'text-slate-300 hover:text-white hover:bg-white/10'
                      : 'text-slate-400 hover:text-white hover:bg-white/10 opacity-60'
                  }`}
                >
                  {soundEnabled ? (
                    <Volume2 className="w-3.5 h-3.5 text-[#489DCA]" />
                  ) : (
                    <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleResetChat}
                  title="Restart conversation"
                  aria-label="Restart conversation"
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  title="Minimize chat"
                  aria-label="Minimize chat"
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Export & Email Transcript Panel */}
            <AnimatePresence>
              {isExportMenuOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-[#183B57] text-white border-b border-[#275B86] overflow-hidden shrink-0"
                >
                  <div className="p-3 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <Share2 className="w-3.5 h-3.5 text-[#489DCA]" />
                        Transcript
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsExportMenuOpen(false)}
                        className="text-slate-300 hover:text-white cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-300 leading-snug">
                      Download this demo conversation. Emailing transcripts is not available in this prototype.
                    </p>

                    {/* Action buttons row */}
                    <div className="pt-1 flex items-center gap-2 border-t border-[#275B86]/40">
                      <button
                        type="button"
                        onClick={handleDownloadTranscript}
                        className="flex-1 py-1.5 px-2 bg-white/10 hover:bg-white/15 rounded-lg text-[11px] font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer text-slate-200"
                      >
                        <Download className="w-3 h-3 text-[#489DCA]" />
                        Download (.txt)
                      </button>

                      <button
                        type="button"
                        onClick={handleConvertChatToRfq}
                        className="flex-1 py-1.5 px-2 bg-[#275B86] hover:bg-[#489DCA] text-white rounded-lg text-[11px] font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <FileText className="w-3 h-3" />
                        Add enquiry line
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Honest status banner */}
            <div className="bg-amber-50 border-b border-amber-100 px-3.5 py-1.5 flex items-center gap-1.5 text-[11px] text-amber-900 shrink-0">
              <Clock className="w-3 h-3 text-amber-600 shrink-0" />
              <span>
                Automated demo replies only. For real help contact <strong>{BUSINESS.salesEmail.value}</strong>.
              </span>
            </div>

            {/* Messages list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/60 text-xs">
              {messages.map(msg => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs shadow-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-[#275B86] text-white rounded-br-xs'
                        : 'bg-white text-slate-800 border border-slate-200/90 rounded-bl-xs'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>

                    {/* Attached screenshot / image preview */}
                    {msg.attachment && (
                      <div className="mt-2 overflow-hidden rounded-xl border border-black/10 bg-black/5">
                        <button
                          type="button"
                          onClick={() => setZoomedImage(msg.attachment!.url)}
                          className="block relative group cursor-zoom-in w-full text-left overflow-hidden"
                          title="Click to view full screenshot"
                          aria-label={`View full size image for ${msg.attachment.name}`}
                        >
                          <img
                            src={msg.attachment.url}
                            alt={msg.attachment.name}
                            className="w-full max-h-48 object-cover rounded-t-xl transition-transform duration-200 group-hover:scale-[1.02]"
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[11px] font-medium gap-1 rounded-t-xl">
                            <Eye className="w-3.5 h-3.5" /> Click to view full image
                          </div>
                        </button>
                        <div
                          className={`px-2.5 py-1 text-[10px] flex items-center justify-between ${
                            msg.sender === 'user' ? 'bg-black/20 text-white/90' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <span className="truncate max-w-[170px] font-medium">{msg.attachment.name}</span>
                          {msg.attachment.size && <span className="opacity-75 text-[9px] shrink-0 ml-1">{msg.attachment.size}</span>}
                        </div>
                      </div>
                    )}

                    {/* Representative Quick Actions */}
                    {msg.quickActions && msg.quickActions.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                        {msg.quickActions.map((action, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleActionClick(action)}
                            className="bg-slate-100 hover:bg-[#489DCA]/15 hover:text-[#183B57] text-[#275B86] font-medium text-[11px] px-2.5 py-1 rounded-md border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            {action.actionType === 'open_quote' && <FileText className="w-3 h-3 text-[#275B86]" />}
                            {action.actionType === 'contact_sales' && <PhoneCall className="w-3 h-3 text-[#275B86]" />}
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1 px-1">
                    <span>{msg.timestamp}</span>
                    {msg.sender === 'user' && <CheckCheck className="w-3 h-3 text-[#489DCA]" />}
                  </div>
                </motion.div>
              ))}

              {/* Staff is typing... Animation Indicator */}
              <AnimatePresence>
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="flex items-end gap-2 text-slate-500 text-xs self-start"
                  >
                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#275B86] to-[#489DCA] flex items-center justify-center font-bold text-white shadow-xs shrink-0 mb-0.5">
                      <Headphones className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="bg-white border border-slate-200/90 rounded-2xl rounded-bl-xs px-3.5 py-2.5 flex items-center gap-2 shadow-xs">
                      <div className="flex items-center gap-1">
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-[#275B86] animate-bounce"
                          style={{ animationDelay: '0ms', animationDuration: '800ms' }}
                        />
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-[#489DCA] animate-bounce"
                          style={{ animationDelay: '160ms', animationDuration: '800ms' }}
                        />
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-[#489DCA] animate-bounce"
                          style={{ animationDelay: '320ms', animationDuration: '800ms' }}
                        />
                      </div>
                      <span className="text-[11px] font-medium text-slate-600 tracking-tight">
                        Preparing scripted reply…
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Reply section */}
            <div className="bg-slate-50 border-t border-slate-200/90 px-3 py-2 shrink-0">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                  Quick Reply
                </span>
                <span className="text-[10px] text-slate-400">Tap phrase to auto-respond</span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
                {QUICK_REPLIES.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    disabled={isTyping}
                    onClick={() => handleSendMessage(item.phrase)}
                    title={`Click to send "${item.phrase}"`}
                    aria-label={`Quick reply: ${item.label}`}
                    className="text-[11px] font-medium bg-white hover:bg-[#275B86]/10 hover:text-[#275B86] hover:border-[#275B86]/40 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-full whitespace-nowrap transition-all shadow-2xs shrink-0 cursor-pointer flex items-center gap-1.5 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Input Footer */}
            <div className="p-2.5 bg-white border-t border-slate-200/90 shrink-0">
              {/* Hidden file input for screenshots */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="support-chat-screenshot-input"
                aria-label="Upload image screenshot"
              />

              {/* Pending screenshot attachment preview chip */}
              {pendingAttachment && (
                <div className="mb-2 flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <img
                      src={pendingAttachment.url}
                      alt={pendingAttachment.name}
                      className="w-8 h-8 rounded-lg object-cover border border-slate-300 shrink-0"
                    />
                    <div className="text-[11px] truncate">
                      <p className="font-medium text-slate-800 truncate max-w-[210px]">{pendingAttachment.name}</p>
                      <p className="text-[10px] text-slate-400">{pendingAttachment.size} • Image stays in this browser (not reviewed by anyone)</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPendingAttachment(null)}
                    title="Remove screenshot"
                    aria-label="Remove screenshot"
                    className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-1.5"
              >
                {/* File Attachment Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isTyping}
                  title="Attach screenshot image from your device"
                  aria-label="Attach screenshot image from your device"
                  className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                    pendingAttachment
                      ? 'bg-[#275B86]/10 border-[#275B86] text-[#275B86]'
                      : 'border-slate-200 hover:border-[#275B86]/60 hover:bg-slate-100 text-slate-500 hover:text-[#275B86]'
                  }`}
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={e => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onPaste={handlePaste}
                  placeholder={pendingAttachment ? "Add notes about this screenshot..." : "Ask about pricing, specs, or quotes..."}
                  className="flex-1 bg-slate-50 border border-slate-300 focus:border-[#275B86] focus:bg-white focus:outline-none rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 transition-all"
                />

                <button
                  type="submit"
                  disabled={(!inputMessage.trim() && !pendingAttachment) || isTyping}
                  title="Send message"
                  aria-label="Send message"
                  className="w-8 h-8 rounded-xl bg-[#275B86] hover:bg-[#10283D] disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center shrink-0 transition-colors shadow-xs cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
              <div className="flex items-center justify-between mt-1.5 px-1 text-[10px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-[#489DCA]" /> Sales representative simulated
                </span>
                <span>Screenshots can also be pasted (Ctrl+V)</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Floating Launcher Button */}
      <motion.button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        aria-label={isOpen ? 'Close demo assistant chat' : 'Open demo assistant chat (scripted, not monitored)'}
        aria-expanded={isOpen}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className={`group relative flex items-center gap-2.5 px-4 py-3 rounded-full shadow-xl border cursor-pointer ${
          isOpen
            ? 'bg-[#10283D] text-white border-white/20'
            : 'bg-[#10283D] hover:bg-[#183B57] text-white border-[#489DCA]/40 shadow-blue-900/20'
        }`}
      >
        {isOpen ? (
          <>
            <X className="w-4 h-4 text-slate-200 group-hover:rotate-90 transition-transform duration-200" />
            <span className="text-xs font-semibold tracking-wide">Close</span>
          </>
        ) : (
          <>
            <MessageSquare className="w-4 h-4 text-[#489DCA]" />
            <span className="text-xs font-semibold tracking-wide">Help</span>
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded border bg-amber-500/20 text-amber-200 border-amber-400/30">
              Demo
            </span>
          </>
        )}

        {/* Unread badge if closed and new messages arrived */}
        <AnimatePresence>
          {!isOpen && unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white shadow-sm"
            >
              {unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* 3. Screenshot Lightbox Modal */}
      <AnimatePresence>
        {zoomedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoomedImage(null)}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 cursor-zoom-out"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              onClick={e => e.stopPropagation()}
              className="relative max-w-3xl max-h-[88vh] bg-white rounded-2xl overflow-hidden shadow-2xl p-2 cursor-default flex flex-col items-center border border-white/20"
            >
              <button
                type="button"
                onClick={() => setZoomedImage(null)}
                title="Close full view"
                aria-label="Close full view"
                className="absolute top-4 right-4 z-10 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              <img
                src={zoomedImage}
                alt="Enlarged screenshot preview"
                className="max-h-[82vh] w-auto max-w-full rounded-xl object-contain shadow-inner"
              />
              <div className="w-full text-center py-1 text-xs text-slate-500 font-medium">
                Screenshot Context Preview • Click outside or ✕ to close
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
