import { ensureArray } from '../../../utils/arrays';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../../../api/analytics';
import { PageContainer } from '../../../shared/components/PageContainer';
import { ErrorBoundary } from '../../../shared/components/ErrorBoundary';
import { MetricCard } from '../../../shared/components/ui/Card';
import { Skeleton } from '../../../shared/components/Skeleton';
import { EmptyState } from '../../../shared/components/EmptyState';
import { StatusBadge } from '../../../shared/components/ui/StatusBadge';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: analyticsApi.getAdminDashboard,
  });

  const kpis = analytics?.kpis || {};
  const alerts = ensureArray(analytics?.alerts);

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
              value={kpis.systemHealth || 'Optimal'} 
            />
          </Link>
          <Link to="/portal/admin/users" className="block focus:outline-none focus:ring-2 focus:ring-ess-purple rounded-2xl">
            <MetricCard 
              title="Total Users" 
              value={kpis.totalUsers !== undefined ? kpis.totalUsers : '--'} 
            />
          </Link>
          <Link to="/portal/admin/payments?filter=failed" className="block focus:outline-none focus:ring-2 focus:ring-ess-purple rounded-2xl">
            <MetricCard 
              title="Failed Payments" 
              value={kpis.failedPayments !== undefined ? kpis.failedPayments : '--'} 
            />
          </Link>
          <Link to="/portal/admin/requests?filter=new" className="block focus:outline-none focus:ring-2 focus:ring-ess-purple rounded-2xl">
            <MetricCard 
              title="New Requests" 
              value={kpis.newRequests !== undefined ? kpis.newRequests : '--'} 
            />
          </Link>
          <Link to="/portal/admin/users?role=technician" className="block focus:outline-none focus:ring-2 focus:ring-ess-purple rounded-2xl">
            <MetricCard 
              title="Active Techs" 
              value={kpis.activeTechs !== undefined ? kpis.activeTechs : '--'} 
            />
          </Link>
          <Link to="/portal/admin/audit-logs?filter=errors" className="block focus:outline-none focus:ring-2 focus:ring-ess-purple rounded-2xl">
            <MetricCard 
              title="API Errors" 
              value={kpis.apiErrors !== undefined ? kpis.apiErrors : '--'} 
            />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-900">Recent Alerts & Logs</h2>
                <Link to="/portal/admin/audit-logs" className="text-sm font-medium text-ess-purple hover:underline">View all</Link>
              </div>
              <div className="divide-y divide-gray-100">
                {isLoading ? (
                  <div className="p-6 space-y-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
                  </div>
                ) : alerts.length > 0 ? (
                  alerts.slice(0, 10).map((alert, idx) => (
                    <div key={alert.id || idx} className="p-4 sm:px-6 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-gray-900 truncate mr-4">{alert.message || alert.action || alert.title || 'Alert'}</span>
                        {alert.created_at && (
                          <span className="text-xs text-gray-500 whitespace-nowrap">
                            {new Date(alert.created_at).toLocaleString()}
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between items-center text-sm mt-2">
                         <span className="text-gray-500 font-mono text-xs">
                          {alert.type || alert.resource_type || 'System'}
                         </span>
                         <StatusBadge status={alert.severity || alert.status || 'info'} />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6">
                    <EmptyState title="No recent alerts" description="No recent alerts or logs available." />
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
