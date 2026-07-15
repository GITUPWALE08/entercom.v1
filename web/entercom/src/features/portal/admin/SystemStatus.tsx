import { PageContainer } from '../../../shared/components/PageContainer';
import { EmptyState } from '../../../shared/components/EmptyState';
import { Activity } from 'lucide-react';
import { ErrorBoundary } from '../../../shared/components/ErrorBoundary';

export default function SystemStatus() {
  return (
    <ErrorBoundary>
      <PageContainer>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">System Status</h1>
          <p className="mt-2 text-gray-500 text-lg">Diagnostics and service health monitoring.</p>
        </div>
        
        <EmptyState
          icon={<Activity className="w-10 h-10" />}
          title="System status metrics are not yet available."
          description="Service health and diagnostics endpoints are not currently supported."
        />
      </PageContainer>
    </ErrorBoundary>
  );
}
