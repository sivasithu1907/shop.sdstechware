import React from 'react';
import { RotateCcw } from 'lucide-react';
import { useStore } from '../../store/StoreContext';
import { Modal } from './Modal';

/** Confirmation before restoring demo fixtures (this deletes data saved in this browser). */
export const ResetDemoDialog: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { resetDemoData } = useStore();
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-sm"
      zIndexClass="z-[70]"
      icon={<RotateCcw className="w-4 h-4" />}
      title="Reset demo data?"
      footer={
        <div className="flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} className="px-3 py-1.5 text-xs text-[#183B57] hover:bg-slate-100 rounded">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              resetDemoData();
              onClose();
            }}
            className="px-3 py-1.5 text-xs bg-red-600 text-white rounded hover:bg-red-700 font-medium"
          >
            Confirm reset
          </button>
        </div>
      }
    >
      <p className="text-xs text-[#62798C] leading-relaxed">
        This permanently replaces everything saved in this browser — products, prices, stock, stock history, quotation list,
        customer requests, reviews and staff records — with the original sample data. Export anything you need first.
      </p>
    </Modal>
  );
};
