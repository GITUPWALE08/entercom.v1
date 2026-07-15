import { useAuthStore } from '../../../../store/authStore';
import { useLogout } from '../../../../hooks/useLogout';
import { PageContainer } from '../../../../shared/components/PageContainer';
import { ErrorBoundary } from '../../../../shared/components/ErrorBoundary';
import { NotificationPreferences } from '../../../../components/NotificationPreferences';

export default function Profile() {
  const { user } = useAuthStore();
  const { logout } = useLogout();

  return (
    <ErrorBoundary>
      <PageContainer>
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Account Profile</h1>
            <p className="mt-2 text-gray-500 text-lg">Manage your personal information and settings.</p>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-8 sm:p-12 border-b border-gray-100 flex items-center gap-6">
              <div className="w-20 h-20 bg-ess-purple rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-sm">
                {user?.first_name?.charAt(0) || user?.email?.charAt(0)}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{user?.first_name} {user?.last_name}</h2>
                <p className="text-gray-500">{user?.email}</p>
              </div>
            </div>

            <div className="p-8 sm:p-12 space-y-8">
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">First Name</label>
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 font-medium">
                      {user?.first_name || '-'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Last Name</label>
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 font-medium">
                      {user?.last_name || '-'}
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-500 mb-1">Email Address</label>
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 font-medium">
                      {user?.email}
                    </div>
                  </div>
                </div>
                <p className="mt-4 text-sm text-gray-500">
                  To update your personal information, please contact our support team.
                </p>
              </section>

              <section className="pt-8 border-t border-gray-100">
                <NotificationPreferences />
              </section>

              <section className="pt-8 border-t border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Actions</h3>
                <button 
                  onClick={logout}
                  className="px-6 py-3 bg-red-50 text-red-600 font-medium rounded-xl hover:bg-red-100 transition-colors"
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
