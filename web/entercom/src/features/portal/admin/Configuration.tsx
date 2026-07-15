import { PageContainer } from '../../../shared/components/PageContainer';
import { EmptyState } from '../../../shared/components/EmptyState';
import { Settings } from 'lucide-react';
import { ErrorBoundary } from '../../../shared/components/ErrorBoundary';

export default function Configuration() {
  return (
    <ErrorBoundary>
      <PageContainer>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Configuration</h1>
          <p className="mt-2 text-gray-500 text-lg">Manage global system settings and environment variables.</p>
        </div>
        
        <EmptyState
          icon={<Settings className="w-10 h-10" />}
          title="Configuration management is not yet available."
          description="Global configuration endpoints are not currently supported."
        />
      </PageContainer>
    </ErrorBoundary>
  );
}
