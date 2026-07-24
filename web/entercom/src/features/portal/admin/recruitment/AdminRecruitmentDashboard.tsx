import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Shield, Users, BarChart3, Download, Archive, Clock } from 'lucide-react';
import { PageHeader } from '../../../../shared/components/PageHeader';
import { DataTable } from '../../../../shared/components/ui/DataTable';

interface Application {
  id: string;
  applicant_name: string;
  position: string;
  status: string;
  assigned_manager: string | null;
  created_at: string;
}

export default function AdminRecruitmentDashboard() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Mock API
    setTimeout(() => {
      setApplications([
        { id: '1', applicant_name: 'John Doe', position: 'Senior Technician', status: 'pending', assigned_manager: null, created_at: '2026-07-20T10:00:00Z' },
        { id: '2', applicant_name: 'Jane Smith', position: 'HVAC Specialist', status: 'reviewed', assigned_manager: 'Manager A', created_at: '2026-07-21T11:30:00Z' },
      ]);
      setIsLoading(false);
    }, 1000);
  }, []);

  const columns = [
    { header: 'Applicant', accessor: 'applicant_name', className: 'font-medium text-gray-900' },
    { header: 'Position', accessor: 'position' },
    { header: 'Manager', accessor: (row: Application) => row.assigned_manager || <span className="text-gray-400 italic">Unassigned</span> },
    { header: 'Status', accessor: (row: Application) => (
      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
        row.status === 'approved' ? 'bg-green-100 text-green-800' : 
        row.status === 'rejected' ? 'bg-red-100 text-red-800' : 
        row.status === 'reviewed' ? 'bg-blue-100 text-blue-800' : 
        'bg-yellow-100 text-yellow-800'
      }`}>
        {row.status.toUpperCase()}
      </span>
    )},
    { header: 'Applied On', accessor: (row: Application) => new Date(row.created_at).toLocaleDateString() },
    { header: 'Actions', accessor: (row: Application) => (
      <Link to={`/portal/admin/recruitment/${row.id}`} className="text-ess-purple hover:text-purple-900 font-medium text-sm">
        Manage
      </Link>
    )}
  ];

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex justify-between items-start">
        <PageHeader 
          title="Admin Recruitment Overview" 
          description="Global oversight of all hiring operations and manager assignments."
          icon={Shield}
        />
        <div className="flex gap-2">
          <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors">
            <Download size={16} className="mr-2" /> Export Data
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-900">Conversion Rate</h3>
            <BarChart3 className="text-blue-500 h-5 w-5" />
          </div>
          <div className="text-3xl font-bold text-gray-900">24%</div>
          <div className="text-sm text-green-600 mt-1">↑ +2.4% from last month</div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-900">Avg Time to Hire</h3>
            <Clock className="text-yellow-500 h-5 w-5" />
          </div>
          <div className="text-3xl font-bold text-gray-900">12 Days</div>
          <div className="text-sm text-green-600 mt-1">↓ -1.5 days from last month</div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-900">Active Pipelines</h3>
            <Users className="text-purple-500 h-5 w-5" />
          </div>
          <div className="text-3xl font-bold text-gray-900">5</div>
          <div className="text-sm text-gray-500 mt-1">Across 3 departments</div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search applications globally..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-ess-purple focus:border-ess-purple sm:text-sm bg-gray-50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button className="flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <Filter size={16} className="mr-2" /> Advanced Filters
          </button>
          <button className="flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <Archive size={16} className="mr-2" /> View Archived
          </button>
        </div>
      </div>

      <DataTable
        data={applications.filter(a => a.applicant_name.toLowerCase().includes(searchTerm.toLowerCase()))}
        columns={columns as any}
        keyExtractor={(row) => row.id}
        isLoading={isLoading}
      />
    </div>
  );
}
