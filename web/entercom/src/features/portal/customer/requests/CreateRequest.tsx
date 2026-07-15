import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { requestsApi } from '../../../../api/requests';
import { PageContainer } from '../../../../shared/components/PageContainer';
import { ErrorBoundary } from '../../../../shared/components/ErrorBoundary';
import { Input, TextArea, Select, Alert, Card, CardContent } from '../../../../shared/components/ui';

const requestSchema = z.object({
  category: z.string().min(1, 'Please select a category'),
  description: z.string().min(10, 'Please provide more details about your request (min 10 characters)'),
  addressLine1: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  requiresTechnician: z.boolean(),
});

type RequestFormValues = z.infer<typeof requestSchema>;

export default function CreateRequest() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RequestFormValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      category: '',
      description: '',
      addressLine1: '',
      city: '',
      postalCode: '',
      requiresTechnician: false,
    }
  });

  const createMutation = useMutation({
    mutationFn: requestsApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      navigate(`/portal/customer/requests/${data.id}`);
    },
    onError: (error: any) => {
      setServerError(error.response?.data?.message || 'Failed to create request. Please try again.');
    }
  });

  const onSubmit = (data: RequestFormValues) => {
    setServerError(null);
    const payload = {
      category: data.category,
      description: data.description,
      requires_technician: data.requiresTechnician,
      location: {
        address: data.addressLine1,
        city: data.city,
        postal_code: data.postalCode,
      }
    };
    createMutation.mutate(payload);
  };

  return (
    <ErrorBoundary>
      <PageContainer>
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">New Service Request</h1>
            <p className="mt-1 text-gray-500">Provide details about what you need installed or serviced.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <Card>
              <CardContent className="space-y-8">
                {serverError && (
                  <Alert type="error" title="Submission Failed" description={serverError} />
                )}

                <div className="space-y-6">
                  <Select
                    label="Category"
                    error={errors.category?.message}
                    options={[
                      { value: 'installation', label: 'New Installation' },
                      { value: 'repair', label: 'Repair Service' },
                      { value: 'maintenance', label: 'Maintenance' },
                      { value: 'consultation', label: 'Consultation / Quote' },
                    ]}
                    {...register('category')}
                  />

                  <TextArea
                    label="Description"
                    error={errors.description?.message}
                    rows={4}
                    placeholder="Tell us what you need..."
                    {...register('description')}
                  />

                  <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <input
                      type="checkbox"
                      id="requiresTechnician"
                      className="w-5 h-5 text-ess-purple border-gray-300 rounded focus:ring-ess-purple"
                      {...register('requiresTechnician')}
                    />
                    <label htmlFor="requiresTechnician" className="text-sm font-medium text-gray-700">
                      Do you need a technician to help with installation or setup?
                    </label>
                  </div>

                  <div className="pt-6 border-t border-gray-100">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Service Location</h3>
                    <div className="space-y-4">
                      <Input
                        label="Address"
                        type="text"
                        error={errors.addressLine1?.message}
                        placeholder="123 Main St"
                        {...register('addressLine1')}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="City"
                          type="text"
                          error={errors.city?.message}
                          {...register('city')}
                        />
                        <Input
                          label="Postal Code"
                          type="text"
                          error={errors.postalCode?.message}
                          {...register('postalCode')}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 flex items-center justify-end gap-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || createMutation.isPending}
                    className="px-6 py-2.5 text-sm font-medium text-white bg-ess-purple rounded-xl hover:bg-ess-darkPurple disabled:opacity-50 transition-colors shadow-sm"
                  >
                    {createMutation.isPending ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </CardContent>
            </Card>
          </form>


        </div>
      </PageContainer>
    </ErrorBoundary>
  );
}
