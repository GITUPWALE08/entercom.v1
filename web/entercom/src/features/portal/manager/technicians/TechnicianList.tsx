import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PageContainer } from '../../../../shared/components/PageContainer';
import { EmptyState } from '../../../../shared/components/EmptyState';
import { Users, Mail, Phone, MapPin } from 'lucide-react';
import { ErrorBoundary } from '../../../../shared/components/ErrorBoundary';
import { usersApi } from '../../../../api/users';
import { Skeleton } from '../../../../shared/components/Skeleton';
import { ensureArray } from '../../../../utils/arrays';

export default function TechnicianList() {
  const [filter, setFilter] = useState('all');

  const { data: technicians, isLoading } = useQuery({
    queryKey: ['users', 'technician'],
    queryFn: () => usersApi.list('technician'),
  });

  const filteredTechs = ensureArray(technicians).filter((tech: any) => {
    if (filter === 'active') return tech.is_active;
    if (filter === 'inactive') return !tech.is_active;
    return true;
  });

  return (
    <ErrorBoundary>
      <PageContainer>
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Technicians</h1>
            <p className="mt-2 text-gray-500 text-lg">Manage and view details of available technicians.</p>
          </div>
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-xl border-gray-200 focus:ring-ess-purple focus:border-ess-purple px-4 py-2"
          >
            <option value="all">All Technicians</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-48 w-full rounded-2xl" />)}
          </div>
        ) : filteredTechs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTechs.map((tech: any) => (
              <Link to={`/portal/manager/technicians/${tech.id}`} key={tech.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col hover:border-ess-purple hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-center gap-4 mb-4">
                  {tech.profile_image ? (
                    <img src={tech.profile_image} alt={tech.first_name} className="w-16 h-16 rounded-full object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
                      <span className="text-2xl font-bold text-ess-purple">
                        {tech.first_name?.[0]}{tech.last_name?.[0]}
                      </span>
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{tech.first_name} {tech.last_name}</h3>
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-md uppercase tracking-wider mt-1
                      ${tech.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                    >
                      {tech.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-gray-600 flex-1">
                  <div className="flex items-center gap-2">
                    <Mail size={16} className="text-gray-400" />
                    <span>{tech.email}</span>
                  </div>
                  {tech.phone_number && (
                    <div className="flex items-center gap-2">
                      <Phone size={16} className="text-gray-400" />
                      <span>{tech.phone_number}</span>
                    </div>
                  )}
                  {tech.address && (
                    <div className="flex items-start gap-2">
                      <MapPin size={16} className="text-gray-400 mt-0.5" />
                      <span className="flex-1">{tech.address}</span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Users className="w-10 h-10" />}
            title="No technicians found"
            description={`There are currently no technicians matching the filter: ${filter}.`}
          />
        )}
      </PageContainer>
    </ErrorBoundary>
  );
}
