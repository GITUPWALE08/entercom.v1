import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../../store/authStore';
import { useLogout } from '../../../../hooks/useLogout';
import { PageContainer } from '../../../../shared/components/PageContainer';
import { ErrorBoundary } from '../../../../shared/components/ErrorBoundary';
import { usersApi } from '../../../../api/users';
import { useForm } from 'react-hook-form';

export default function Profile() {
  const { user, setUser } = useAuthStore();
  const { logout } = useLogout();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      phone_number: user?.phone_number || '',
      address: user?.address || '',
      profile_image: user?.profile_image || '',
      mfa_enabled: user?.mfa_enabled || false,
    }
  });



  useEffect(() => {
    // Refresh user data when entering page
    const fetchProfile = async () => {
      try {
        const profile = await usersApi.getProfile();
        setUser({ ...user, ...profile } as any);
        reset({
          first_name: profile.first_name || '',
          last_name: profile.last_name || '',
          phone_number: profile.phone_number || '',
          address: profile.address || '',
          profile_image: profile.profile_image || '',
          mfa_enabled: profile.mfa_enabled || false,
        });
      } catch (err) {
        console.error("Failed to load profile", err);
      }
    };
    fetchProfile();
  }, []);

  const onProfileSubmit = async (data: any) => {
    setIsSaving(true);
    setMessage({ text: '', type: '' });
    try {
      const updated = await usersApi.updateProfile(data);
      setUser({ ...user, ...updated } as any);
      setMessage({ text: 'Profile updated successfully.', type: 'success' });
      setIsEditing(false);
    } catch (err: any) {
      setMessage({ text: err.response?.data?.detail || 'Failed to update profile.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };



  return (
    <ErrorBoundary>
      <PageContainer>
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Account Settings</h1>
              <p className="mt-2 text-gray-500 text-lg">Manage your personal information, security, and preferences.</p>
            </div>
            {!isEditing && (
              <button 
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
              >
                Edit Profile
              </button>
            )}
          </div>

          {message.text && (
            <div className={`p-4 rounded-lg border ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
              {message.text}
            </div>
          )}

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header / Avatar */}
            <div className="p-8 sm:p-12 border-b border-gray-100 flex items-center gap-6 bg-slate-50/50">
              <div className="relative">
                {user?.profile_image ? (
                  <img src={user.profile_image} alt="Profile" className="w-24 h-24 rounded-2xl object-cover shadow-md border border-gray-200" />
                ) : (
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl flex items-center justify-center text-white text-4xl font-bold shadow-md">
                    {user?.first_name?.charAt(0) || user?.email?.charAt(0)}
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{user?.first_name} {user?.last_name}</h2>
                <p className="text-gray-500">{user?.email}</p>
                <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 uppercase tracking-wider">
                  {user?.role.replace('_', ' ')}
                </div>
              </div>
            </div>

            <div className="p-8 sm:p-12 space-y-12">
              {/* Profile Setup Form */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Personal Information</h3>
                <form onSubmit={handleSubmit(onProfileSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                      <input
                        type="text"
                        {...register('first_name')}
                        disabled={!isEditing}
                        className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                      <input
                        type="text"
                        {...register('last_name')}
                        disabled={!isEditing}
                        className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                      <input
                        type="text"
                        {...register('phone_number')}
                        disabled={!isEditing}
                        className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Avatar URL</label>
                      <input
                        type="text"
                        {...register('profile_image')}
                        disabled={!isEditing}
                        placeholder="https://example.com/avatar.jpg"
                        className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                      <input
                        type="text"
                        {...register('address')}
                        disabled={!isEditing}
                        className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                      />
                    </div>
                    

                  </div>

                  {isEditing && (
                    <div className="flex justify-end gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => { setIsEditing(false); reset(); }}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium disabled:opacity-50"
                      >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  )}
                </form>
              </section>



              <section className="pt-10 border-t border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Actions</h3>
                <button 
                  onClick={logout}
                  className="px-6 py-3 bg-red-50 text-red-600 font-medium rounded-xl hover:bg-red-100 transition-colors shadow-sm"
                >
                  Sign out of your account
                </button>
              </section>
            </div>
          </div>
        </div>
      </PageContainer>
    </ErrorBoundary>
  );
}
