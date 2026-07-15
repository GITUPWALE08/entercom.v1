import { PageContainer } from '../../../shared/components/PageContainer';
import { EmptyState } from '../../../shared/components/EmptyState';
import { FileBarChart } from 'lucide-react';
import { ErrorBoundary } from '../../../shared/components/ErrorBoundary';

export default function Reports() {
  return (
    <ErrorBoundary>
      <PageContainer>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Reports</h1>
          <p className="mt-2 text-gray-500 text-lg">System analytics and performance metrics.</p>
        </div>
        
        <EmptyState
          icon={<FileBarChart className="w-10 h-10" />}
          title="Reporting is not yet available."
          description="The reporting endpoints are not currently supported by the backend."
        />
      </PageContainer>
    </ErrorBoundary>
  );
}
