import { ensureArray } from '../../../../utils/arrays';
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { requestsApi } from '../../../../api/requests';
import { PageContainer } from '../../../../shared/components/PageContainer';
import { ErrorBoundary } from '../../../../shared/components/ErrorBoundary';
import { Input, TextArea, Alert } from '../../../../shared/components/ui';

export default function StaffVerification() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [notes, setNotes] = useState('');
  const [photosStr, setPhotosStr] = useState('https://example.com/photo1.jpg');
  const [checklist, setChecklist] = useState({ hardware_installed: false, tested: false });
  const [customerAck, setCustomerAck] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verificationMutation = useMutation({
    mutationFn: (payload: any) => requestsApi.submit_verification(id!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests', id] });
      navigate(`/portal/staff/requests/${id}`);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to submit verification');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const photos = photosStr.split(',').map(p => p.trim()).filter(Boolean);
    if (ensureArray(photos).length === 0) {
      setError('At least one photo URL is required');
      return;
    }

    verificationMutation.mutate({
      photos,
      notes,
      checklist,
      customer_ack: customerAck
    });
  };

  return (
    <ErrorBoundary>
      <PageContainer>
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Submit Verification</h1>
            <p className="mt-2 text-gray-500 text-lg">Upload evidence to complete your assignment.</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 sm:p-12 space-y-8">
            {error && (
              <Alert 
                type="error"
                title="Submission Failed"
                description={error}
              />
            )}

            <div className="space-y-6">
              <div>
                <Input 
                  label="Photo Evidence URLs (comma separated)"
                  type="text" 
                  value={photosStr}
                  onChange={e => setPhotosStr(e.target.value)}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Simulating photo uploads with URLs for now.</p>
              </div>

              <div>
                <TextArea 
                  label="Completion Notes"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={4}
                  placeholder="Describe the work completed..."
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-4">Checklist</label>
              <div className="space-y-3">
                <label className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    checked={checklist.hardware_installed}
                    onChange={e => setChecklist(prev => ({ ...prev, hardware_installed: e.target.checked }))}
                    className="w-5 h-5 text-ess-purple rounded border-gray-300 focus:ring-ess-purple"
                  />
                  <span className="text-gray-700">All hardware installed properly</span>
                </label>
                <label className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    checked={checklist.tested}
                    onChange={e => setChecklist(prev => ({ ...prev, tested: e.target.checked }))}
                    className="w-5 h-5 text-ess-purple rounded border-gray-300 focus:ring-ess-purple"
                  />
                  <span className="text-gray-700">System tested and operational</span>
                </label>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100">
              <label className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  checked={customerAck}
                  onChange={e => setCustomerAck(e.target.checked)}
                  className="w-5 h-5 text-ess-purple rounded border-gray-300 focus:ring-ess-purple"
                  required
                />
                <span className="text-gray-900 font-medium">Customer has acknowledged completion</span>
              </label>
            </div>

            <div className="pt-4 flex gap-4">
              <button 
                type="button"
                onClick={() => navigate(-1)}
                className="flex-1 py-3 px-4 bg-white border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={verificationMutation.isPending || !checklist.hardware_installed || !checklist.tested || !customerAck}
                className="flex-1 py-3 px-4 bg-ess-purple text-white font-medium rounded-xl hover:bg-ess-darkPurple transition-colors shadow-sm disabled:opacity-50"
              >
                {verificationMutation.isPending ? 'Submitting...' : 'Submit Evidence'}
              </button>
            </div>
          </form>
        </div>
      </PageContainer>
    </ErrorBoundary>
  );
}
