import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PageContainer } from '../../../../shared/components/PageContainer';
import { ErrorBoundary } from '../../../../shared/components/ErrorBoundary';
import { Input, TextArea, Select } from '../../../../shared/components/ui';
import { useAuthStore } from '../../../../store/authStore';
import { toast } from 'react-hot-toast';
import { apiClient } from '../../../../api/axios';

export default function ApplyTechnician() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    skills: '',
    document_urls: '',
    notes: '',
  });

  const submitMutation = useMutation({
    mutationFn: async (payload: any) => {
      const response = await apiClient.post('/users/technician-applications/', payload);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Your application has been submitted successfully.');
      setFormData({ skills: '', document_urls: '', notes: '' });
      queryClient.invalidateQueries({ queryKey: ['technician-application'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to submit application. You may have already applied.');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMutation.mutate({
      skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
      document_urls: formData.document_urls.split(',').map(s => s.trim()).filter(Boolean),
      notes: formData.notes,
    });
  };

  return (
    <ErrorBoundary>
      <PageContainer>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Become a Technician</h1>
          <p className="mt-2 text-gray-500 text-lg">Apply to join our team of professional security technicians.</p>
        </div>

        <div className="max-w-2xl bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Applicant Information</h3>
              <p className="text-sm text-gray-600">Name: {user?.first_name} {user?.last_name}</p>
              <p className="text-sm text-gray-600">Email: {user?.email}</p>
            </div>

            <Input 
              label="Skills (Comma separated)"
              placeholder="e.g. CCTV Installation, Wiring, IP Cameras"
              value={formData.skills}
              onChange={e => setFormData({ ...formData, skills: e.target.value })}
              required
            />

            <Input 
              label="Document URLs (Comma separated links to certifications/resume)"
              placeholder="e.g. https://linkedin.com/in/profile, https://drive.google.com/..."
              value={formData.document_urls}
              onChange={e => setFormData({ ...formData, document_urls: e.target.value })}
            />

            <TextArea 
              label="Additional Notes"
              placeholder="Tell us about your experience..."
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
            />

            <button 
              type="submit"
              disabled={submitMutation.isPending}
              className="w-full py-3 px-4 bg-ess-purple text-white font-medium rounded-xl hover:bg-ess-darkPurple transition-colors disabled:opacity-50"
            >
              {submitMutation.isPending ? 'Submitting...' : 'Submit Application'}
            </button>
          </form>
        </div>
      </PageContainer>
    </ErrorBoundary>
  );
}
