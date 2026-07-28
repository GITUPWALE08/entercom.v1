import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usersApi } from '../../../api/users';
import { X } from 'lucide-react';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTransfer: (staffId: string, reason: string) => void;
}

export function TransferModal({ isOpen, onClose, onTransfer }: TransferModalProps) {
  const [selectedStaff, setSelectedStaff] = useState<string>('');
  const [reason, setReason] = useState<string>('');

  const { data: staffList = [], isLoading } = useQuery({
    queryKey: ['staffList'],
    queryFn: () => usersApi.list('staff,manager,admin'),
    enabled: isOpen,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl animate-in zoom-in-95">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-900">Transfer Conversation</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-200">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Staff Member</label>
            <select
              value={selectedStaff}
              onChange={(e) => setSelectedStaff(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-ess-purple focus:border-transparent outline-none"
              disabled={isLoading}
            >
              <option value="" disabled>
                {isLoading ? 'Loading staff...' : 'Select a staff member'}
              </option>
              {staffList.map((staff: any) => (
                <option key={staff.id} value={staff.id}>
                  {staff.first_name} {staff.last_name} ({staff.email})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Transfer</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="E.g., Customer needs help with billing..."
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-ess-purple focus:border-transparent outline-none resize-none h-24"
            />
          </div>
        </div>
        
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (selectedStaff) {
                onTransfer(selectedStaff, reason);
                onClose();
              }
            }}
            disabled={!selectedStaff}
            className="px-4 py-2 text-sm font-medium text-white bg-ess-purple border border-transparent rounded-lg hover:bg-ess-darkPurple transition-colors disabled:opacity-50"
          >
            Transfer
          </button>
        </div>
      </div>
    </div>
  );
}
