import { ensureArray } from '../../../utils/arrays';
import { useQuery } from '@tanstack/react-query';
import { auditLogsApi } from '../../../api/auditLogs';
import { requestsApi } from '../../../api/requests';
import { paymentsApi } from '../../../api/payments';
import { usersApi } from '../../../api/users';
import { PageContainer } from '../../../shared/components/PageContainer';
import { ErrorBoundary } from '../../../shared/components/ErrorBoundary';
import { MetricCard } from '../../../shared/components/ui/Card';
import { Skeleton } from '../../../shared/components/Skeleton';
import { EmptyState } from '../../../shared/components/EmptyState';
import { StatusBadge } from '../../../shared/components/ui/StatusBadge';
import { Activity, ShieldCheck, Users, HardDrive, AlertTriangle, Briefcase, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const { data: logs, isLoading: loadingLogs } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: auditLogsApi.list,
  });

  const { data: requests } = useQuery({
    queryKey: ['requests'],
    queryFn: requestsApi.list,
  });

  const { data: payments } = useQuery({
    queryKey: ['payments'],
    queryFn: paymentsApi.list,
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.list(),
  });

  const recentLogs = logs?.slice(0, 10) || [];
  
  // Data processing for cards
  const allUsers = ensureArray(users);
  const allRequests = ensureArray(requests);
  const allPayments = ensureArray(payments);
  const allLogs = ensureArray(logs);

  const totalUsers = allUsers.length;
  const failedPayments = allPayments.filter(p => p.status === 'failed').length;
  const newRequests = allRequests.filter(r => r.status === 'submitted').length;
  const activeTechs = allUsers.filter(u => u.is_active && u.role_assignments?.some((ra: any) => ra.role.slug === 'technician')).length;
  const apiErrors = allLogs.filter(log => log.status === 'error' || log.status === 'failed').length;

  return (
    <ErrorBoundary>
      <PageContainer>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Admin Dashboard</h1>
          <p className="mt-2 text-gray-500 text-lg">System health, performance, and security overview.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          <Link to="/portal/admin/system-status" className="block focus:outline-none focus:ring-2 focus:ring-ess-purple rounded-2xl">
            <MetricCard 
              title="System Health" 
              value="Optimal" 
            />
          </Link>
          <Link to="/portal/admin/users" className="block focus:outline-none focus:ring-2 focus:ring-ess-purple rounded-2xl">
            <MetricCard 
              title="Total Users" 
              value={totalUsers > 0 ? totalUsers : '--'} 
            />
          </Link>
          <Link to="/portal/admin/payments?filter=failed" className="block focus:outline-none focus:ring-2 focus:ring-ess-purple rounded-2xl">
            <MetricCard 
              title="Failed Payments" 
              value={failedPayments} 
            />
          </Link>
          <Link to="/portal/admin/requests?filter=new" className="block focus:outline-none focus:ring-2 focus:ring-ess-purple rounded-2xl">
            <MetricCard 
              title="New Requests" 
              value={newRequests} 
            />
          </Link>
          <Link to="/portal/admin/users?role=technician" className="block focus:outline-none focus:ring-2 focus:ring-ess-purple rounded-2xl">
            <MetricCard 
              title="Active Techs" 
              value={activeTechs > 0 ? activeTechs : '--'} 
            />
          </Link>
          <Link to="/portal/admin/audit-logs?filter=errors" className="block focus:outline-none focus:ring-2 focus:ring-ess-purple rounded-2xl">
            <MetricCard 
              title="API Errors" 
              value={apiErrors} 
            />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-900">Recent Audit Logs</h2>
                <Link to="/portal/admin/audit-logs" className="text-sm font-medium text-ess-purple hover:underline">View all</Link>
              </div>
              <div className="divide-y divide-gray-100">
                {loadingLogs ? (
                  <div className="p-6 space-y-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
                  </div>
                ) : ensureArray(recentLogs).length > 0 ? (
                  ensureArray(recentLogs).map(log => (
                    <div key={log.id} className="p-4 sm:px-6 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-gray-900 truncate mr-4">{log.action}</span>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm mt-2">
                         <span className="text-gray-500 font-mono text-xs">
                          {log.resource_type} / {log.resource_id ? log.resource_id.split('-')[0].toUpperCase() : 'Global'}
                         </span>
                         <StatusBadge status={log.status} />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6">
                    <EmptyState title="No recent logs" description="No recent audit logs available." />
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Link to="/portal/admin/configuration" className="block w-full py-3 px-4 bg-gray-50 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition-colors text-center shadow-sm">
                  System Configuration
                </Link>
                <Link to="/portal/admin/users" className="block w-full py-3 px-4 bg-gray-50 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition-colors text-center shadow-sm">
                  Manage Users
                </Link>
                <Link to="/portal/admin/system-status" className="block w-full py-3 px-4 bg-gray-50 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition-colors text-center shadow-sm">
                  View Full Diagnostics
                </Link>
              </div>
            </div>
          </div>
        </div>
      </PageContainer>
    </ErrorBoundary>
  );
}
