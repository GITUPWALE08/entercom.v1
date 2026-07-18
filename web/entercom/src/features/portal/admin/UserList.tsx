import { ensureArray } from '../../../utils/arrays';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageContainer } from '../../../shared/components/PageContainer';
import { ErrorBoundary } from '../../../shared/components/ErrorBoundary';
import { Card, CardContent } from '../../../shared/components/ui';
import { Skeleton as SkeletonFallback } from '../../../shared/components/Skeleton';
import { usersApi } from '../../../api/users';
import type { User } from '../../../api/users';
import { rolesApi } from '../../../api/roles';
import { Shield, ShieldAlert, X } from 'lucide-react';

export default function UserList() {
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>('');

  const { data: users, isLoading: loadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.list,
  });

  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn: rolesApi.list,
  });

  const assignRoleMutation = useMutation({
    mutationFn: ({ userId, roleSlug }: { userId: string; roleSlug: string }) => 
      usersApi.assignRole(userId, roleSlug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsAssigning(false);
      setSelectedRole('');
    }
  });

  const deassignRoleMutation = useMutation({
    mutationFn: ({ userId, roleSlug }: { userId: string; roleSlug: string }) => 
      usersApi.deassignRole(userId, roleSlug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });

  const activeRoles = (user: User) => user.role_assignments.filter(r => r.is_active);

  return (
    <ErrorBoundary>
      <PageContainer>
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Users & Roles</h1>
            <p className="mt-2 text-gray-500 text-lg">Manage system users, roles, and access controls.</p>
          </div>
        </div>

        {loadingUsers ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <SkeletonFallback key={i} className="h-20 w-full" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {ensureArray(users).map(user => (
                <div 
                  key={user.id} 
                  className={`cursor-pointer transition-colors bg-white rounded-xl shadow-sm border ${selectedUser?.id === user.id ? 'border-ess-purple ring-1 ring-ess-purple' : 'border-gray-100 hover:border-gray-300'}`}
                  onClick={() => {
                    setSelectedUser(user);
                    setIsAssigning(false);
                  }}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{user.first_name} {user.last_name}</h3>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                    <div className="flex gap-2">
                      {activeRoles(user).map(assignment => (
                        <span key={assignment.id} className="px-2.5 py-1 text-xs font-medium bg-purple-50 text-ess-purple rounded-md border border-purple-100">
                          {assignment.role.name}
                        </span>
                      ))}
                      {activeRoles(user).length === 0 && (
                        <span className="px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-md">
                          No Roles
                        </span>
                      )}
                    </div>
                  </CardContent>
                </div>
              ))}
            </div>

            <div className="lg:col-span-1">
              {selectedUser ? (
                <Card className="sticky top-6">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-6">
                       <h2 className="text-lg font-semibold text-gray-900">Manage Access</h2>
                       <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-gray-600">
                         <X size={20} />
                       </button>
                    </div>

                    <div className="mb-6">
                      <h3 className="font-medium text-gray-900">{selectedUser.first_name} {selectedUser.last_name}</h3>
                      <p className="text-sm text-gray-500">{selectedUser.email}</p>
                    </div>

                    <div className="space-y-4 mb-8">
                      <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Active Roles</h4>
                      {activeRoles(selectedUser).length > 0 ? (
                        activeRoles(selectedUser).map(assignment => (
                          <div key={assignment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <div className="flex items-center gap-2">
                              <Shield className="w-4 h-4 text-ess-purple" />
                              <span className="text-sm font-medium text-gray-900">{assignment.role.name}</span>
                            </div>
                            <button 
                              onClick={() => deassignRoleMutation.mutate({ userId: selectedUser.id, roleSlug: assignment.role.slug })}
                              disabled={deassignRoleMutation.isPending}
                              className="text-xs text-red-600 font-medium hover:text-red-800 disabled:opacity-50"
                            >
                              Revoke
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">This user currently has no active roles.</p>
                      )}
                    </div>

                    {!isAssigning ? (
                      <button 
                        onClick={() => setIsAssigning(true)}
                        className="w-full py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-900 font-medium rounded-lg transition-colors text-sm"
                      >
                        Assign New Role
                      </button>
                    ) : (
                      <div className="p-4 bg-purple-50 rounded-xl border border-purple-100 space-y-4">
                        <h4 className="text-sm font-semibold text-ess-purple">Assign Role</h4>
                        <select 
                          value={selectedRole}
                          onChange={(e) => setSelectedRole(e.target.value)}
                          className="w-full text-sm rounded-lg border-purple-200 focus:ring-ess-purple focus:border-ess-purple p-2.5"
                        >
                          <option value="">Select a role...</option>
                          {roles?.filter(r => !activeRoles(selectedUser).some(a => a.role.slug === r.slug)).map(role => (
                            <option key={role.id} value={role.slug}>{role.name}</option>
                          ))}
                        </select>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setIsAssigning(false)}
                            className="flex-1 py-2 bg-white border border-gray-200 text-gray-700 font-medium rounded-lg text-sm"
                          >
                            Cancel
                          </button>
                          <button 
                            onClick={() => assignRoleMutation.mutate({ userId: selectedUser.id, roleSlug: selectedRole })}
                            disabled={!selectedRole || assignRoleMutation.isPending}
                            className="flex-1 py-2 bg-ess-purple text-white font-medium rounded-lg text-sm disabled:opacity-50"
                          >
                            Assign
                          </button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <ShieldAlert className="w-12 h-12 text-gray-300 mb-4" />
                  <p className="text-gray-500 font-medium">Select a user to manage their roles and permissions.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </PageContainer>
    </ErrorBoundary>
  );
}
