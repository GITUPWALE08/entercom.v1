import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { usersApi } from '../../../../api/users';
import { PageContainer } from '../../../../shared/components/PageContainer';
import { ErrorBoundary } from '../../../../shared/components/ErrorBoundary';
import { Skeleton } from '../../../../shared/components/Skeleton';
import { Mail, Phone, MapPin, ArrowLeft, Star, Briefcase } from 'lucide-react';
import { ensureArray } from '../../../../utils/arrays';

export default function TechnicianDetail() {
  const { id } = useParams<{ id: string }>();

  const { data: tech, isLoading } = useQuery({
    queryKey: ['users', id],
    queryFn: async () => {
        const res = await usersApi.list('technician');
        return ensureArray(res).find((u: any) => u.id === id);
    },
    enabled: !!id,
  });

  return (
    <ErrorBoundary>
      <PageContainer>
        <div className="mb-6 flex items-center gap-4">
          <Link to="/portal/manager/technicians" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Technician Details</h1>
        </div>

        {isLoading ? (
          <Skeleton className="h-96 w-full rounded-2xl" />
        ) : !tech ? (
          <div className="text-center py-12 text-gray-500">Technician not found.</div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              {tech.profile_image ? (
                <img src={tech.profile_image} alt={tech.first_name} className="w-32 h-32 rounded-2xl object-cover" />
              ) : (
                <div className="w-32 h-32 rounded-2xl bg-purple-100 flex items-center justify-center">
                  <span className="text-5xl font-bold text-ess-purple">
                    {tech.first_name?.[0]}{tech.last_name?.[0]}
                  </span>
                </div>
              )}
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-gray-900">{tech.first_name} {tech.last_name}</h2>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${tech.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {tech.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Contact Information</h3>
                    <div className="flex items-center gap-3 text-gray-600">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <a href={`mailto:${tech.email}`} className="hover:text-ess-purple transition-colors">{tech.email}</a>
                    </div>
                    {tech.phone_number && (
                      <div className="flex items-center gap-3 text-gray-600">
                        <Phone className="w-5 h-5 text-gray-400" />
                        <a href={`tel:${tech.phone_number}`} className="hover:text-ess-purple transition-colors">{tech.phone_number}</a>
                      </div>
                    )}
                    {tech.address && (
                      <div className="flex items-start gap-3 text-gray-600">
                        <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                        <span>{tech.address}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Performance & Stats</h3>
                    <div className="flex items-center gap-3 text-gray-600">
                      <Briefcase className="w-5 h-5 text-gray-400" />
                      <span>{tech.completed_jobs || 0} Jobs Completed</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600">
                      <Star className="w-5 h-5 text-gray-400" />
                      <span>{tech.rating || 'No ratings yet'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </PageContainer>
    </ErrorBoundary>
  );
}
