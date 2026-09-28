import React, { useId } from 'react';
import { X } from 'lucide-react';
import { useDialog } from '../../hooks/useDialog';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Tailwind max-width class, e.g. "max-w-4xl". */
  maxWidth?: string;
  /** Stacking level for nested dialogs. */
  zIndexClass?: string;
}

/**
 * Accessible modal used by the staff tools: scrollable body, fixed header and
 * footer, Escape/backdrop close, focus trap, and body scroll lock.
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  icon,
  children,
  footer,
  maxWidth = 'max-w-3xl',
  zIndexClass = 'z-50',
}) => {
  const ref = useDialog<HTMLDivElement>(isOpen, onClose);
  const titleId = useId();
  const descId = useId();
  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 ${zIndexClass} bg-[#10283D]/60 flex items-center justify-center p-3 sm:p-4`}
      onMouseDown={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={`bg-white rounded-xl ${maxWidth} w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#DCE7EF] text-[#183B57] focus:outline-none`}
      >
        <div className="flex items-start justify-between gap-3 p-4 sm:p-5 border-b border-[#DCE7EF] shrink-0">
          <div className="flex items-start gap-2.5 min-w-0">
            {icon && (
              <div className="w-8 h-8 rounded-lg bg-[#EBF3F8] text-[#275B86] flex items-center justify-center shrink-0">{icon}</div>
            )}
            <div className="min-w-0">
              <h3 id={titleId} className="font-bold text-base text-[#10283D]">
                {title}
              </h3>
              {description && (
                <div id={descId} className="text-xs text-[#62798C] mt-0.5">
                  {description}
                </div>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="text-slate-400 hover:text-slate-600 p-1 rounded shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 min-h-0 space-y-4">{children}</div>
        {footer && <div className="p-4 sm:p-5 border-t border-[#DCE7EF] shrink-0">{footer}</div>}
      </div>
    </div>
  );
};

/** Small reusable notice for demo / prototype limitations. */
export const DemoNotice: React.FC<{ children: React.ReactNode; tone?: 'amber' | 'blue'; className?: string }> = ({
  children,
  tone = 'amber',
  className = '',
}) => (
  <div
    role="note"
    className={`text-[11px] leading-relaxed rounded-md border px-3 py-2 ${
      tone === 'amber' ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-[#EBF3F8] border-[#DCE7EF] text-[#275B86]'
    } ${className}`}
  >
    {children}
  </div>
);
