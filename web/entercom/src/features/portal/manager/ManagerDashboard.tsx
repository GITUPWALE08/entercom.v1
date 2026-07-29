import { ensureArray } from '../../../utils/arrays';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../../../api/analytics';
import { useAuthStore } from '../../../store/authStore';
import { PageContainer } from '../../../shared/components/PageContainer';
import { ErrorBoundary } from '../../../shared/components/ErrorBoundary';
import { MetricCard } from '../../../shared/components/ui/Card';
import { Skeleton } from '../../../shared/components/Skeleton';
import { EmptyState } from '../../../shared/components/EmptyState';
import { StatusBadge } from '../../../shared/components/ui/StatusBadge';
import { DashboardFilter } from '../../../shared/components/DashboardFilter';
import type { DateRangePeriod } from '../../../shared/components/DashboardFilter';
import { 
  RequestsOverTimeChart, 
  RequestCategoriesChart, 
  RevenueTrendChart 
} from '../../../shared/components/DashboardCharts';

export default function ManagerDashboard() {
  const { user } = useAuthStore();
  const [period, setPeriod] = useState<DateRangePeriod>('30_days');
  
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['manager-analytics', period],
    queryFn: () => analyticsApi.getManagerDashboard({ period }),
  });

  const kpis = analytics?.kpis || {};
  const alerts = ensureArray(analytics?.alerts);

  const totalRequests = kpis.total_requests !== undefined ? kpis.total_requests : '--';
  const activeJobs = kpis.active_jobs !== undefined ? kpis.active_jobs : '--';
  const pendingRecruitment = kpis.recruitment_applications !== undefined ? kpis.recruitment_applications : '--';
  const revenueSummary = kpis.revenue_today !== undefined ? kpis.revenue_today : 0;
  const activeTechnicians = kpis.available_technicians !== undefined ? kpis.available_technicians : '--';

  const slaAlerts = alerts.filter(a => a.type === 'sla' || (a.title && a.title.toLowerCase().includes('sla')) || (a.message && a.message.toLowerCase().includes('sla')));
  const inventoryAlerts = alerts.filter(a => a.type === 'inventory' || (a.title && a.title.toLowerCase().includes('inventory')) || (a.message && a.message.toLowerCase().includes('stock')));

  return (
    <ErrorBoundary>
      <PageContainer>
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Manager Dashboard</h1>
            <p className="mt-2 text-gray-500 text-lg">Welcome back, {user?.first_name || 'Manager'}. Here is the overview of operations.</p>
          </div>
          <DashboardFilter period={period} onPeriodChange={setPeriod} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          <Link to="/portal/manager/requests" className="block focus:outline-none focus:ring-2 focus:ring-ess-purple rounded-2xl">
            <MetricCard title="Total Requests" value={totalRequests} />
          </Link>
          <Link to="/portal/manager/requests?filter=active" className="block focus:outline-none focus:ring-2 focus:ring-ess-purple rounded-2xl">
            <MetricCard title="Active Jobs" value={activeJobs} />
          </Link>
          <Link to="/portal/manager/recruitment" className="block focus:outline-none focus:ring-2 focus:ring-ess-purple rounded-2xl">
            <MetricCard title="Pending Recruitment" value={pendingRecruitment} />
          </Link>
          <Link to="/portal/manager/requests?filter=sla_alerts" className="block focus:outline-none focus:ring-2 focus:ring-ess-purple rounded-2xl">
            <MetricCard title="SLA Alerts" value={kpis.sla_warnings !== undefined ? kpis.sla_warnings : slaAlerts.length} />
          </Link>
          <Link to="/portal/manager/payments" className="block focus:outline-none focus:ring-2 focus:ring-ess-purple rounded-2xl">
            <MetricCard title="Revenue Summary" value={`₦${revenueSummary.toLocaleString()}`} />
          </Link>
          <Link to="/portal/manager/technicians" className="block focus:outline-none focus:ring-2 focus:ring-ess-purple rounded-2xl">
            <MetricCard title="Tech Availability" value={activeTechnicians} />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Requests Over Time</h2>
            {isLoading ? (
              <Skeleton className="h-72 w-full rounded-xl" />
            ) : analytics?.charts?.requests_over_time ? (
              <RequestsOverTimeChart data={analytics.charts.requests_over_time} />
            ) : (
              <EmptyState title="No Chart Data" description="Not enough data to display requests over time." />
            )}
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Request Categories</h2>
            {isLoading ? (
              <Skeleton className="h-72 w-full rounded-xl" />
            ) : analytics?.charts?.request_categories ? (
              <RequestCategoriesChart data={analytics.charts.request_categories} />
            ) : (
              <EmptyState title="No Chart Data" description="Not enough data to display categories." />
            )}
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:col-span-2">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Revenue Trend</h2>
            {isLoading ? (
              <Skeleton className="h-72 w-full rounded-xl" />
            ) : analytics?.charts?.revenue_trend ? (
              <RevenueTrendChart data={analytics.charts.revenue_trend} />
            ) : (
              <EmptyState title="No Chart Data" description="Not enough data to display revenue trend." />
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* SLA Alerts List */}
          <div className="bg-white rounded-2xl shadow-sm border border-red-100 overflow-hidden">
            <div className="p-6 border-b border-red-100 flex justify-between items-center bg-red-50">
              <h2 className="text-lg font-bold text-red-900">SLA Alerts</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {isLoading ? (
                <div className="p-6 space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
                </div>
              ) : slaAlerts.length > 0 ? (
                slaAlerts.slice(0, 5).map((req, idx) => (
                  <Link key={req.id || idx} to={req.id ? `/portal/manager/requests/${req.id}` : '#'} className="block p-6 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-gray-900">{req.title || req.message || 'SLA Alert'}</span>
                      <StatusBadge status={req.severity || req.status || 'warning'} />
                    </div>
                    {req.description && <p className="text-sm text-gray-500 line-clamp-1">{req.description}</p>}
                  </Link>
                ))
              ) : (
                <div className="p-6">
                  <EmptyState title="No SLA Alerts" description="All requests are meeting SLAs." />
                </div>
              )}
            </div>
          </div>

          {/* Inventory Alerts List */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900">Inventory Alerts</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {isLoading ? (
                <div className="p-6 space-y-4">
                  {[1, 2].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
                </div>
              ) : inventoryAlerts.length > 0 ? (
                inventoryAlerts.slice(0, 5).map((prod, idx) => (
                  <Link key={prod.id || idx} to={prod.id ? `/portal/manager/products/${prod.id}` : '#'} className="block p-6 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-gray-900">{prod.title || prod.message || 'Inventory Alert'}</span>
                      <StatusBadge status={prod.severity || prod.status || 'warning'} />
                    </div>
                    {prod.description && <p className="text-sm text-gray-500">{prod.description}</p>}
                  </Link>
                ))
              ) : (
                <div className="p-6">
                  <EmptyState title="Healthy Inventory" description="Inventory levels are healthy." />
                </div>
              )}
            </div>
          </div>
        </div>

      </PageContainer>
    </ErrorBoundary>
  );
}
