import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditLogsApi } from '../../../api/auditLogs';
import type { AuditLogItem, AuditLogFilters } from '../../../api/auditLogs';
import { PageContainer } from '../../../shared/components/PageContainer';
import { Skeleton } from '../../../shared/components/Skeleton';
import { ErrorBoundary } from '../../../shared/components/ErrorBoundary';
import { Download, X, Calendar, User, Activity, Monitor, ShieldAlert, Cpu, Filter, Search } from 'lucide-react';
import { DataTable, StatusBadge } from '../../../shared/components/ui';

// -- Child Components --

function AuditDashboard({ logs }: { logs: AuditLogItem[] }) {
  const total = logs.length;
  const critical = logs.filter(l => l.status === 'error' || l.status === 'failed').length;
  const recent = logs.filter(l => new Date(l.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-white/70 backdrop-blur-md p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
        <span className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Total Events</span>
        <span className="text-3xl font-bold text-gray-900">{total}</span>
      </div>
      <div className="bg-white/70 backdrop-blur-md p-6 rounded-2xl border border-red-100 shadow-sm flex flex-col">
        <span className="text-sm font-medium text-red-500 uppercase tracking-wider mb-2">Critical Events</span>
        <span className="text-3xl font-bold text-red-600">{critical}</span>
      </div>
      <div className="bg-white/70 backdrop-blur-md p-6 rounded-2xl border border-blue-100 shadow-sm flex flex-col">
        <span className="text-sm font-medium text-blue-500 uppercase tracking-wider mb-2">Last 24 Hours</span>
        <span className="text-3xl font-bold text-blue-600">{recent}</span>
      </div>
    </div>
  );
}

function AuditDetailsDrawer({ isOpen, onClose, log }: { isOpen: boolean, onClose: () => void, log: AuditLogItem | null }) {
  if (!isOpen && !log) return null;
  return (
    <>
      <div 
        className={`fixed inset-0 z-[60] bg-gray-900/40 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={onClose} 
      />
      <div 
        className={`fixed inset-y-0 right-0 z-[70] w-full max-w-md bg-white/90 backdrop-blur-md shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col border-l border-gray-100 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white/50">
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Audit Log Details</h2>
            <p className="text-xs text-gray-500 mt-1">ID: {log?.id}</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors focus:outline-none"
          >
            <X size={20} />
          </button>
        </div>
        {log && (
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Activity size={24} /></div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{log.action}</h3>
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                    <Calendar size={14} /><span>{new Date(log.created_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <StatusBadge status={log.status} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-2 text-gray-500 mb-2"><User size={16} /><span className="text-xs font-medium uppercase tracking-wider">Actor</span></div>
                <p className="font-mono text-sm text-gray-900 break-all">{log.actor_id || 'SYSTEM'}</p>
              </div>
              <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-2 text-gray-500 mb-2"><Cpu size={16} /><span className="text-xs font-medium uppercase tracking-wider">Resource</span></div>
                <p className="font-mono text-sm text-gray-900 break-all">{log.resource_type} {log.resource_id ? `(${log.resource_id.slice(0,8)}...)` : ''}</p>
              </div>
            </div>
            {log.metadata && Object.keys(log.metadata).length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-900">Metadata Payload</h4>
                <div className="bg-gray-900 rounded-2xl p-4 overflow-x-auto shadow-inner">
                  <pre className="text-xs font-mono text-blue-300 leading-relaxed">{JSON.stringify(log.metadata, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// -- Main Component --

export default function AuditLogList() {
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);
  const [filters, setFilters] = useState<AuditLogFilters>({});
  
  // Local state for filter inputs
  const [actionInput, setActionInput] = useState('');
  const [resourceInput, setResourceInput] = useState('');

  const { data: logs, isLoading } = useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: () => auditLogsApi.list(filters),
  });

  const handleApplyFilters = () => {
    setFilters({
      ...filters,
      action: actionInput || undefined,
      resource_type: resourceInput || undefined,
    });
  };

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const data = await auditLogsApi.export(filters, format);
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `audit_logs.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export failed', error);
    }
  };

  const columns = useMemo(() => [
    { header: 'Timestamp', accessor: (log: AuditLogItem) => <span className="text-xs text-gray-500">{new Date(log.created_at).toLocaleString()}</span> },
    { header: 'Action', accessor: (log: AuditLogItem) => <span className="font-medium text-gray-900">{log.action}</span> },
    { header: 'Resource', accessor: (log: AuditLogItem) => <span className="text-xs font-mono text-gray-500">{log.resource_type} {log.resource_id ? `/ ${log.resource_id.split('-')[0].toUpperCase()}` : ''}</span> },
    { header: 'Actor ID', accessor: (log: AuditLogItem) => <span className="text-xs font-mono">{log.actor_id ? log.actor_id.split('-')[0].toUpperCase() : 'SYSTEM'}</span> },
    { header: 'Status', accessor: (log: AuditLogItem) => <StatusBadge status={log.status} /> }
  ], []);

  return (
    <ErrorBoundary>
      <PageContainer>
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Audit Center</h1>
            <p className="mt-2 text-gray-500 text-lg">System-wide record of user actions and events.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => handleExport('csv')} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium shadow-sm hover:bg-gray-50 transition-colors">
              <Download size={18} /> CSV
            </button>
            <button onClick={() => handleExport('json')} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium shadow-sm hover:bg-gray-50 transition-colors">
              <Download size={18} /> JSON
            </button>
          </div>
        </div>

        {!isLoading && logs && <AuditDashboard logs={logs} />}

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="e.g. user.login" 
                value={actionInput}
                onChange={e => setActionInput(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Resource Type</label>
            <input 
              type="text" 
              placeholder="e.g. user" 
              value={resourceInput}
              onChange={e => setResourceInput(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <button 
            onClick={handleApplyFilters}
            className="px-6 py-2 bg-gray-900 text-white rounded-xl font-medium shadow-sm hover:bg-gray-800 transition-colors flex items-center gap-2"
          >
            <Filter size={18} /> Filter
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <DataTable
              data={logs || []}
              columns={columns}
              keyExtractor={(log) => log.id}
              emptyTitle="No audit logs found"
              emptyDescription="The system has not recorded any events matching your criteria."
              onRowClick={(log) => setSelectedLog(log as AuditLogItem)}
            />
          </div>
        )}

        <AuditDetailsDrawer 
          isOpen={!!selectedLog} 
          onClose={() => setSelectedLog(null)} 
          log={selectedLog} 
        />
      </PageContainer>
    </ErrorBoundary>
  );
}
