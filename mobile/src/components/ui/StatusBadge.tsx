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
      case 'awaiting_customer_approval':
      case 'awaiting_payment':
      case 'staff_review':
      case 'awaiting_assignment':
      case 'draft':
      case 'pending_verification':
        return { view: 'bg-ess-softOrange border-ess-orange/20', text: 'text-ess-orange' };
      case 'approved':
      case 'paid':
      case 'completed': 
        return { view: 'bg-[#e8f7ed] border-ess-green/20', text: 'text-ess-green' };
      case 'rejected':
      case 'cancelled':
      case 'canceled':
      case 'failed':
      case 'escalated':
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
    if (status === 'awaiting_customer_approval' || status === 'pending_quote_approval') return 'QUOTE PENDING';
    if (status === 'awaiting_assignment' || status === 'pending_technician') return 'FINDING PRO';
    if (status === 'awaiting_payment' || status === 'pending_payment') return 'PAYMENT PENDING';
    if (status === 'staff_review') return 'IN REVIEW';
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
