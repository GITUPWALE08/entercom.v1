import { useQuery } from '@tanstack/react-query';
import { auditLogsApi } from '../../../api/auditLogs';
import type { AuditLogItem } from '../../../api/auditLogs';
import { PageContainer } from '../../../shared/components/PageContainer';
import { Skeleton } from '../../../shared/components/Skeleton';
import { ErrorBoundary } from '../../../shared/components/ErrorBoundary';
import { Download, X } from 'lucide-react';
import { useState, useMemo } from 'react';
import { DataTable, StatusBadge } from '../../../shared/components/ui';

export default function AuditLogList() {
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const { data: logs, isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: auditLogsApi.list,
  });

  const handleExport = async () => {
    try {
      const data = await auditLogsApi.export();
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'audit_logs.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export failed', error);
    }
  };

  const columns = useMemo(() => [
    {
      header: 'Timestamp',
      accessor: (log: AuditLogItem) => <span className="text-xs text-gray-500">{new Date(log.created_at).toLocaleString()}</span>
    },
    {
      header: 'Action',
      accessor: (log: AuditLogItem) => <span className="font-medium text-gray-900">{log.action}</span>
    },
    {
      header: 'Resource',
      accessor: (log: AuditLogItem) => (
        <span className="text-xs font-mono text-gray-500">
          {log.resource_type} {log.resource_id ? `/ ${log.resource_id.split('-')[0].toUpperCase()}` : ''}
        </span>
      )
    },
    {
      header: 'Actor ID',
      accessor: (log: AuditLogItem) => (
        <span className="text-xs font-mono">
          {log.actor_id ? log.actor_id.split('-')[0].toUpperCase() : 'SYSTEM'}
        </span>
      )
    },
    {
      header: 'IP Address',
      accessor: (log: AuditLogItem) => <span className="text-xs text-gray-500">{log.ip_address || '-'}</span>
    },
    {
      header: 'Status',
      accessor: (log: AuditLogItem) => <StatusBadge status={log.status} />
    }
  ], []);

  return (
    <ErrorBoundary>
      <PageContainer>
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Audit Logs</h1>
            <p className="mt-2 text-gray-500 text-lg">System-wide record of user actions and events.</p>
          </div>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium shadow-sm hover:bg-gray-50 transition-colors"
          >
            <Download size={18} />
            Export CSV
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}
          </div>
        ) : (
          <DataTable
            data={logs || []}
            columns={columns}
            keyExtractor={(log) => log.id}
            emptyTitle="No audit logs found"
            emptyDescription="The system has not recorded any events yet."
            onRowClick={(log) => setSelectedLog(log as AuditLogItem)}
          />
        )}

        {/* Detail Modal/Drawer */}
        {selectedLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-fade-in-up">
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h3 className="text-xl font-bold text-gray-900">Audit Log Details</h3>
                <button onClick={() => setSelectedLog(null)} className="text-gray-400 hover:text-gray-900 transition-colors">
                  <X size={24} />
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[70vh]">
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Action</p>
                    <p className="font-semibold text-gray-900">{selectedLog.action}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Status</p>
                    <StatusBadge status={selectedLog.status} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Resource</p>
                    <p className="font-mono text-sm text-gray-900">{selectedLog.resource_type} / {selectedLog.resource_id || 'Global'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Actor ID</p>
                    <p className="font-mono text-sm text-gray-900">{selectedLog.actor_id || 'SYSTEM'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">IP Address</p>
                    <p className="font-mono text-sm text-gray-900">{selectedLog.ip_address || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Timestamp</p>
                    <p className="text-sm text-gray-900">{new Date(selectedLog.created_at).toLocaleString()}</p>
                  </div>
                </div>

                {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">Metadata</p>
                    <pre className="bg-gray-50 p-4 rounded-xl text-sm font-mono text-gray-700 overflow-x-auto border border-gray-100">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </PageContainer>
    </ErrorBoundary>
  );
}
