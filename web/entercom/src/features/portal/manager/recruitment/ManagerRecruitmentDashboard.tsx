import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Briefcase, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
import { PageHeader } from '../../../../shared/components/PageHeader';
import { DataTable } from '../../../../shared/components/ui/DataTable';

interface Application {
  id: string;
  applicant_name: string;
  email: string;
  position: string;
  status: string;
  created_at: string;
}

export default function ManagerRecruitmentDashboard() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    // Mock fetching data from API
    setTimeout(() => {
      setApplications([
        { id: '1', applicant_name: 'John Doe', email: 'john@example.com', position: 'Senior Technician', status: 'pending', created_at: '2026-07-20T10:00:00Z' },
        { id: '2', applicant_name: 'Jane Smith', email: 'jane@example.com', position: 'HVAC Specialist', status: 'reviewed', created_at: '2026-07-21T11:30:00Z' },
        { id: '3', applicant_name: 'Bob Johnson', email: 'bob@example.com', position: 'Electrician', status: 'approved', created_at: '2026-07-19T09:15:00Z' },
      ]);
      setIsLoading(false);
    }, 1000);
  }, []);

  const filteredApps = applications.filter(app => {
    const matchesSearch = app.applicant_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          app.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    { header: 'Applicant', accessor: (row: Application) => (
      <div>
        <div className="font-medium text-gray-900">{row.applicant_name}</div>
        <div className="text-xs text-gray-500">{row.email}</div>
      </div>
    )},
    { header: 'Position', accessor: 'position' },
    { header: 'Applied On', accessor: (row: Application) => new Date(row.created_at).toLocaleDateString() },
    { header: 'Status', accessor: (row: Application) => (
      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
        row.status === 'approved' ? 'bg-green-100 text-green-800' : 
        row.status === 'rejected' ? 'bg-red-100 text-red-800' : 
        row.status === 'reviewed' ? 'bg-blue-100 text-blue-800' : 
        'bg-yellow-100 text-yellow-800'
      }`}>
        {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
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
            <div className="text-2xl font-bold text-gray-900">{applications.filter(a => a.status === 'approved').length}</div>
            <div className="text-sm text-gray-500">Approved</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center">
          <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-red-600 mr-4">
            <XCircle size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{applications.filter(a => a.status === 'rejected').length}</div>
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
