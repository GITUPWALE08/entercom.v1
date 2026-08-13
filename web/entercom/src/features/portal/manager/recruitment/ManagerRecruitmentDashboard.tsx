import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Briefcase, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
import { PageHeader } from '../../../../shared/components/PageHeader';
import { DataTable } from '../../../../shared/components/ui/DataTable';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../../api/axios';

interface UserData {
  first_name?: string;
  last_name?: string;
  email?: string;
}

interface Application {
  id: string;
  user_email: string;
  first_name: string;
  last_name: string;
  form_data: {
    position?: string;
    [key: string]: any;
  };
  status: string;
  reviewer: UserData | null;
  created_at: string;
}

export default function ManagerRecruitmentDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: applications = [], isLoading } = useQuery<Application[]>({
    queryKey: ['manager-technician-applications'],
    queryFn: async () => {
      const response = await apiClient.get('/users/technician-applications/');
      return response.data;
    },
  });

  const filteredApps = applications.filter(app => {
    const fullName = `${app.first_name} ${app.last_name}`.toLowerCase();
    const email = app.user_email.toLowerCase();
    const term = searchTerm.toLowerCase();
    const matchesSearch = fullName.includes(term) || email.includes(term);
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    { header: 'Applicant', accessor: (row: Application) => (
      <div>
        <div className="font-medium text-gray-900">{row.first_name} {row.last_name}</div>
        <div className="text-xs text-gray-500">{row.user_email}</div>
      </div>
    )},
    { header: 'Position', accessor: (row: Application) => row.form_data?.position || 'Technician' },
    { header: 'Applied On', accessor: (row: Application) => new Date(row.created_at).toLocaleDateString() },
    { header: 'Status', accessor: (row: Application) => (
      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
        row.status === 'approved' ? 'bg-green-100 text-green-800' : 
        row.status === 'rejected' ? 'bg-red-100 text-red-800' : 
        row.status === 'under_review' ? 'bg-blue-100 text-blue-800' : 
        'bg-yellow-100 text-yellow-800'
      }`}>
        {row.status.replace('_', ' ').toUpperCase()}
      </span>
    )},
    { header: 'Actions', accessor: (row: Application) => (
      <Link to={`/portal/manager/recruitment/${row.id}`} className="text-ess-purple hover:text-purple-900 font-medium text-sm">
        Review
      </Link>
    )}
  ];

  return (
    <div className="p-4 md:p-8 space-y-6">
      <PageHeader 
        title="Recruitment Dashboard" 
        description="Manage technician applications and hiring pipeline."
        icon={Briefcase}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center">
          <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-ess-purple mr-4">
            <FileText size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{applications.length}</div>
            <div className="text-sm text-gray-500">Total Apps</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center">
          <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center text-yellow-600 mr-4">
            <Clock size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{applications.filter(a => a.status === 'pending').length}</div>
            <div className="text-sm text-gray-500">Pending</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center">
          <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600 mr-4">
            <CheckCircle size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{filteredApps.filter(a => a.status === 'approved').length}</div>
            <div className="text-sm text-gray-500">Approved</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center">
          <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-red-600 mr-4">
            <XCircle size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{filteredApps.filter(a => a.status === 'rejected').length}</div>
            <div className="text-sm text-gray-500">Rejected</div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search applicants..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-ess-purple focus:border-ess-purple sm:text-sm bg-gray-50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="h-5 w-5 text-gray-400" />
          <select
            className="block w-full border-gray-200 rounded-lg focus:ring-ess-purple focus:border-ess-purple sm:text-sm bg-gray-50"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="reviewed">Reviewed</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <DataTable
        data={filteredApps}
        columns={columns as any}
        keyExtractor={(row) => row.id}
        isLoading={isLoading}
        emptyTitle="No applications found"
        emptyDescription="Try adjusting your search or filter settings."
      />
    </div>
  );
}
