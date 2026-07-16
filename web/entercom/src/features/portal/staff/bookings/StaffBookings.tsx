import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { bookingsApi } from '../../../../api/bookings';
import type { BookingItem } from '../../../../api/bookings';
import { usersApi } from '../../../../api/users';
import { PageContainer } from '../../../../shared/components/PageContainer';
import { Skeleton } from '../../../../shared/components/Skeleton';
import { ErrorBoundary } from '../../../../shared/components/ErrorBoundary';
import { DataTable, StatusBadge, Input } from '../../../../shared/components/ui';

export default function StaffBookings() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<'list'|'calendar'>('list');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  
  const [selectedBooking, setSelectedBooking] = useState<BookingItem | null>(null);
  const [showReschedule, setShowReschedule] = useState(false);
  const [newStartDate, setNewStartDate] = useState('');

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['bookings', { start_date: startDate, end_date: endDate }],
    queryFn: () => bookingsApi.list({ start_date: startDate, end_date: endDate }),
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.list,
  });

  const getTechName = (id: string) => {
    const u = users?.find((u: any) => u.id === id);
    return u ? `${u.first_name} ${u.last_name}` : 'Unknown';
  };

  const rescheduleMutation = useMutation({
    mutationFn: (payload: { new_start_date: string }) => bookingsApi.reschedule(selectedBooking!.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      setShowReschedule(false);
      setSelectedBooking(null);
    }
  });

  const noShowMutation = useMutation({
    mutationFn: (payload: { absent_party: string }) => bookingsApi.noShow(selectedBooking!.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      setSelectedBooking(null);
    }
  });

  const sortedBookings = useMemo(() => {
    if (!bookings) return [];
    return [...bookings].sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  }, [bookings]);

  return (
    <ErrorBoundary>
      <PageContainer>
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Bookings Schedule</h1>
            <p className="mt-2 text-gray-500 text-lg">Manage technician schedules and visits.</p>
          </div>
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button 
              onClick={() => setView('list')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${view === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
            >
              List View
            </button>
            <button 
              onClick={() => setView('calendar')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${view === 'calendar' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
            >
              Calendar
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Input 
            type="date"
            label="Start Date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input 
            type="date"
            label="End Date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
          </div>
        ) : view === 'list' ? (
          <DataTable
            data={sortedBookings}
            keyExtractor={(b) => b.id}
            emptyTitle="No bookings found"
            emptyDescription="There are no bookings in the selected date range."
            columns={[
              {
                header: 'Date & Time',
                accessor: (b) => <span className="font-medium text-gray-900">{new Date(b.start_time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
              },
              {
                header: 'Request',
                accessor: (b) => (
                  <Link to={`/portal/staff/requests/${b.request_id}`} className="text-ess-purple hover:underline">
                    {b.request_id.split('-')[0].toUpperCase()}
                  </Link>
                )
              },
              {
                header: 'Technician',
                accessor: (b) => getTechName(b.technician_id)
              },
              {
                header: 'Status',
                accessor: (b) => <StatusBadge status={b.status} />
              },
              {
                header: 'Actions',
                className: 'text-right',
                accessor: (b) => (
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => { setSelectedBooking(b); setShowReschedule(true); }}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                      disabled={['completed', 'cancelled', 'no_show'].includes(b.status)}
                    >
                      Reschedule
                    </button>
                    <button 
                      onClick={() => { setSelectedBooking(b); noShowMutation.mutate({ absent_party: 'customer' }); }}
                      className="text-sm font-medium text-red-600 hover:text-red-800 transition-colors"
                      disabled={['completed', 'cancelled', 'no_show'].includes(b.status)}
                    >
                      No-Show
                    </button>
                  </div>
                )
              }
            ]}
          />
        ) : (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 text-center text-gray-500">
            {/* Simple calendar placeholder since we don't have a robust calendar component available. Real app would use react-big-calendar or similar */}
            <p className="text-lg mb-4">Calendar view is integrated with external providers (Google/Outlook).</p>
            <div className="grid grid-cols-7 gap-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="font-bold text-gray-900 pb-2 border-b border-gray-200">{d}</div>
              ))}
              {/* Dummy days to visualize */}
              {Array.from({length: 35}).map((_, i) => (
                <div key={i} className="h-24 bg-gray-50 rounded-lg border border-gray-100 p-2 text-left relative hover:bg-gray-100 transition-colors cursor-pointer">
                  <span className="text-sm font-medium text-gray-400">{i + 1 > 31 ? i - 30 : i + 1}</span>
                  {sortedBookings.filter(b => new Date(b.start_time).getDate() === (i + 1 > 31 ? i - 30 : i + 1)).map(b => (
                    <div key={b.id} className="mt-1 p-1 bg-purple-100 text-purple-800 text-xs rounded truncate">
                      {getTechName(b.technician_id)}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {showReschedule && selectedBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900">Reschedule Booking</h3>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-gray-500">
                  Select a new date and time for booking connected to request {selectedBooking.request_id.split('-')[0].toUpperCase()}.
                </p>
                <Input 
                  type="datetime-local"
                  label="New Start Time"
                  value={newStartDate}
                  onChange={e => setNewStartDate(e.target.value)}
                />
              </div>
              <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
                <button 
                  onClick={() => setShowReschedule(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => rescheduleMutation.mutate({ new_start_date: new Date(newStartDate).toISOString() })}
                  disabled={!newStartDate || rescheduleMutation.isPending}
                  className="px-4 py-2 text-sm font-medium bg-ess-purple text-white rounded-lg hover:bg-ess-darkPurple disabled:opacity-50 transition-colors shadow-sm"
                >
                  {rescheduleMutation.isPending ? 'Processing...' : 'Confirm Reschedule'}
                </button>
              </div>
            </div>
          </div>
        )}

      </PageContainer>
    </ErrorBoundary>
  );
}
