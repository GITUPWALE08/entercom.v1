import { PageContainer } from '../../../../shared/components/PageContainer';
import { EmptyState } from '../../../../shared/components/EmptyState';
import { Users } from 'lucide-react';
import { ErrorBoundary } from '../../../../shared/components/ErrorBoundary';

export default function TechnicianList() {
  return (
    <ErrorBoundary>
      <PageContainer>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Technicians</h1>
          <p className="mt-2 text-gray-500 text-lg">Manage technician availability and assignments.</p>
        </div>
        
        <EmptyState
          icon={<Users className="w-10 h-10" />}
          title="Technician management is not yet available."
          description="The backend APIs for listing and managing technicians are not currently supported."
        />
      </PageContainer>
    </ErrorBoundary>
  );
}
