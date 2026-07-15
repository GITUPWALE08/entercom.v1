
interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'approved':
      case 'completed': return 'bg-green-50 text-green-700 border-green-200';
      case 'rejected':
      case 'cancelled': return 'bg-red-50 text-red-700 border-red-200';
      case 'in_progress': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(status)} uppercase tracking-wider`}>
      {status.replace('_', ' ')}
    </span>
  );
}
