import { useState } from 'react';
import { useAuthStore } from '../../../../store/authStore';
import { useLogout } from '../../../../hooks/useLogout';
import { PageContainer } from '../../../../shared/components/PageContainer';
import { ErrorBoundary } from '../../../../shared/components/ErrorBoundary';
import { NotificationPreferences } from '../../../../components/NotificationPreferences';
import { usersApi } from '../../../../api/users';
import { authApi } from '../../../../api/auth';
import { useForm } from 'react-hook-form';

export default function Settings() {
  const { user, setUser } = useAuthStore();
  const { logout } = useLogout();
  
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ text: '', type: '' });

  const { register: registerPassword, handleSubmit: handlePasswordSubmit, reset: resetPassword } = useForm();

  const onPasswordSubmit = async (data: any) => {
    if (data.new_password !== data.confirm_password) {
      setPasswordMessage({ text: 'Passwords do not match.', type: 'error' });
      return;
    }
    setPasswordMessage({ text: '', type: '' });
    try {
      await authApi.login({ email: user?.email || '', password: data.old_password });
      const { apiClient } = await import('../../../../api/axios');
      await apiClient.post('/auth/change-password/', { old_password: data.old_password, new_password: data.new_password });
      setPasswordMessage({ text: 'Password changed successfully.', type: 'success' });
      resetPassword();
      setIsChangingPassword(false);
    } catch (err: any) {
      setPasswordMessage({ text: err.response?.data?.detail || 'Failed to change password.', type: 'error' });
    }
  };

  return (
    <ErrorBoundary>
      <PageContainer>
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Account Settings</h1>
            <p className="mt-2 text-gray-500 text-lg">Manage your security, notifications, and account preferences.</p>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-8 sm:p-12 space-y-12">
              
              {/* Security & Password Reset */}
              <section>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Security</h3>
                    <p className="text-sm text-gray-500">Update your password and security preferences to keep your account secure.</p>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={async () => {
                        try {
                          const updated = await usersApi.updateProfile({ mfa_enabled: !user?.mfa_enabled });
                          setUser({ ...user, ...updated } as any);
                          setPasswordMessage({ text: `MFA has been ${updated.mfa_enabled ? 'enabled' : 'disabled'}.`, type: 'success' });
                        } catch (err: any) {
                          setPasswordMessage({ text: 'Failed to update MFA settings.', type: 'error' });
                        }
                      }}
                      className={`px-4 py-2 border rounded-lg transition-colors font-medium text-sm shadow-sm ${user?.mfa_enabled ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'}`}
                    >
                      {user?.mfa_enabled ? 'Disable 2FA' : 'Enable 2FA'}
                    </button>
                    {!isChangingPassword && (
                      <button 
                        onClick={() => setIsChangingPassword(true)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm shadow-sm"
                      >
                        Change Password
                      </button>
                    )}
                  </div>
                </div>

                {passwordMessage.text && (
                  <div className={`mb-6 p-4 rounded-lg border ${passwordMessage.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                    {passwordMessage.text}
                  </div>
                )}

                {isChangingPassword && (
                  <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                      <input
                        type="password"
                        {...registerPassword('old_password', { required: true })}
                        className="w-full max-w-md border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                      <input
                        type="password"
                        {...registerPassword('new_password', { required: true, minLength: 8 })}
                        className="w-full max-w-md border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                      <input
                        type="password"
                        {...registerPassword('confirm_password', { required: true })}
                        className="w-full max-w-md border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-sm font-medium"
                      >
                        Update Password
                      </button>
                      <button
                        type="button"
                        onClick={() => { setIsChangingPassword(false); resetPassword(); setPasswordMessage({ text: '', type: '' }); }}
                        className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </section>

              <section className="pt-10 border-t border-gray-100">
                <NotificationPreferences />
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
