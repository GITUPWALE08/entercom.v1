import React from 'react';
import { View, Text } from 'react-native';
import { twMerge } from 'tailwind-merge';

interface StatusBadgeProps {
  status?: string;
  className?: string;
}

export function StatusBadge({ status = 'unknown', className = '' }: StatusBadgeProps) {
  const getStatusStyle = (status: string) => {
    switch (status?.toLowerCase() || 'unknown') {
      case 'pending': 
      case 'pending_quote_approval':
      case 'pending_payment':
      case 'pending_technician':
        return { view: 'bg-ess-softOrange border-ess-orange/20', text: 'text-ess-orange' };
      case 'approved':
      case 'paid':
      case 'completed': 
        return { view: 'bg-[#e8f7ed] border-ess-green/20', text: 'text-ess-green' };
      case 'rejected':
      case 'cancelled':
      case 'failed':
        return { view: 'bg-red-50 border-red-200', text: 'text-red-600' };
      case 'in_progress': 
      case 'scheduled':
      case 'dispatched':
        return { view: 'bg-ess-softBlue border-ess-darkPurple/20', text: 'text-ess-darkPurple' };
      default: 
        return { view: 'bg-gray-50 border-gray-200', text: 'text-gray-500' };
    }
  };

  const formatStatus = (status: string) => {
    if (!status) return 'UNKNOWN';
    if (status === 'pending_quote_approval') return 'QUOTE PENDING';
    if (status === 'pending_technician') return 'FINDING PRO';
    return status.replace(/_/g, ' ').toUpperCase();
  };

  const styles = getStatusStyle(status);

  return (
    <View className={twMerge(`px-3 py-1 rounded-full border self-start shadow-sm shadow-black/5`, styles.view, className)}>
      <Text className={twMerge(`text-[11px] font-bold uppercase tracking-widest`, styles.text)}>
        {formatStatus(status)}
      </Text>
    </View>
  );
}
