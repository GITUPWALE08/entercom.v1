import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Clock, FileText, User, Briefcase, MessageSquare, AlertCircle } from 'lucide-react';
import { PageHeader } from '../../../../shared/components/PageHeader';

export default function ApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [app, setApp] = useState<any>(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Mock API call
    setTimeout(() => {
      setApp({
        id,
        applicant_name: 'John Doe',
        email: 'john@example.com',
        phone: '+1 234 567 8900',
        position: 'Senior Technician',
        status: 'pending',
        created_at: '2026-07-20T10:00:00Z',
        skills: ['HVAC', 'Electrical', 'Plumbing'],
        experience_years: 5,
        education: 'Associate Degree in Electrical Engineering',
        resume_url: '#',
        certifications: ['EPA Section 608', 'OSHA 10'],
        timeline: [
          { id: 1, action: 'Application Submitted', date: '2026-07-20T10:00:00Z', actor: 'System' },
          { id: 2, action: 'Automated Screening Passed', date: '2026-07-20T10:05:00Z', actor: 'System' }
        ]
      });
      setIsLoading(false);
    }, 1000);
  }, [id]);

  const handleAction = async (action: string) => {
    setIsSubmitting(true);
    // Mock API call: PATCH /users/technician-applications/{id}/decide/
    setTimeout(() => {
      setApp((prev: any) => ({ ...prev, status: action }));
      setNotes('');
      setIsSubmitting(false);
      alert(`Application ${action} successfully.`);
    }, 800);
  };

  if (isLoading) {
    return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ess-purple"></div></div>;
  }

  if (!app) return <div className="p-8 text-center text-gray-500">Application not found</div>;

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <Link to="/portal/manager/recruitment" className="inline-flex items-center text-sm text-gray-500 hover:text-ess-purple transition-colors mb-4">
        <ArrowLeft size={16} className="mr-1" /> Back to Recruitment
      </Link>

      <PageHeader 
        title={`Application: ${app.applicant_name}`} 
        description={`Applying for ${app.position}`}
        icon={User}
      >
        <span className={`ml-4 px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${
          app.status === 'approved' ? 'bg-green-100 text-green-800' : 
          app.status === 'rejected' ? 'bg-red-100 text-red-800' : 
          app.status === 'reviewed' ? 'bg-blue-100 text-blue-800' : 
          'bg-yellow-100 text-yellow-800'
        }`}>
          {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
        </span>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center"><User className="mr-2 h-5 w-5 text-ess-purple" /> Applicant Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><p className="text-sm text-gray-500">Full Name</p><p className="font-medium text-gray-900">{app.applicant_name}</p></div>
              <div><p className="text-sm text-gray-500">Email</p><p className="font-medium text-gray-900">{app.email}</p></div>
              <div><p className="text-sm text-gray-500">Phone</p><p className="font-medium text-gray-900">{app.phone}</p></div>
              <div><p className="text-sm text-gray-500">Experience</p><p className="font-medium text-gray-900">{app.experience_years} years</p></div>
              <div className="md:col-span-2"><p className="text-sm text-gray-500">Education</p><p className="font-medium text-gray-900">{app.education}</p></div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center"><Briefcase className="mr-2 h-5 w-5 text-ess-purple" /> Skills & Qualifications</h3>
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-2">Skills</p>
              <div className="flex flex-wrap gap-2">
                {app.skills.map((skill: string, i: number) => (
                  <span key={i} className="px-3 py-1 bg-purple-50 text-ess-purple text-sm rounded-full font-medium">{skill}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-2">Certifications</p>
              <div className="flex flex-wrap gap-2">
                {app.certifications.map((cert: string, i: number) => (
                  <span key={i} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full font-medium border border-gray-200">{cert}</span>
                ))}
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center"><FileText className="mr-2 h-5 w-5 text-ess-purple" /> Documents</h3>
            <a href={app.resume_url} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="w-10 h-10 bg-red-50 text-red-600 rounded-lg flex items-center justify-center mr-3"><FileText size={20} /></div>
              <div><p className="font-medium text-gray-900">Resume.pdf</p><p className="text-xs text-gray-500">View Document</p></div>
            </a>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Manager Actions</h3>
            {app.status === 'pending' || app.status === 'reviewed' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Review Notes</label>
                  <textarea 
                    className="w-full border-gray-300 rounded-lg shadow-sm focus:border-ess-purple focus:ring-ess-purple sm:text-sm p-2 border" 
                    rows={3} 
                    placeholder="Add notes before deciding..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => handleAction('approved')}
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    <CheckCircle size={16} className="mr-2" /> Approve
                  </button>
                  <button 
                    onClick={() => handleAction('rejected')}
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    <XCircle size={16} className="mr-2" /> Reject
                  </button>
                </div>
                <button 
                  onClick={() => handleAction('reviewed')}
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  <AlertCircle size={16} className="mr-2" /> Request Info / Mark Reviewed
                </button>
              </div>
            ) : (
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-sm text-gray-600">This application has been {app.status}.</p>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center"><Clock className="mr-2 h-5 w-5 text-ess-purple" /> Timeline</h3>
            <div className="space-y-4">
              {app.timeline.map((event: any, i: number) => (
                <div key={event.id} className="flex">
                  <div className="flex flex-col items-center mr-4">
                    <div className="w-2 h-2 bg-ess-purple rounded-full mt-1.5"></div>
                    {i !== app.timeline.length - 1 && <div className="w-px h-full bg-gray-200 mt-1"></div>}
                  </div>
                  <div className="pb-4">
                    <p className="text-sm font-medium text-gray-900">{event.action}</p>
                    <p className="text-xs text-gray-500">{new Date(event.date).toLocaleString()} • {event.actor}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
