import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { Calendar as CalendarIcon, MapPin, Clock, Users, Wrench, ShieldCheck, Plus, AlertCircle } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../../../src/components/ui/Card';
import { StatusBadge } from '../../../src/components/ui/StatusBadge';
import { bookingsApi, BookingItem } from '../../../src/api/bookings';

export default function BookingsScreen() {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    try {
      setError(null);
      const data = await bookingsApi.list();
      setBookings(data || []);
    } catch (err: any) {
      setError('Failed to load appointments.');
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchBookings().finally(() => setLoading(false));
  }, [fetchBookings]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBookings();
    setRefreshing(false);
  }, [fetchBookings]);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView 
        className="flex-1 px-7 pt-10" 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#081f3d" />}
      >
        <View className="mb-10 flex-row items-center justify-between">
          <View>
            <Text className="text-[13px] font-bold text-ess-darkPurple uppercase tracking-widest mb-1">Appointments</Text>
            <Text className="text-3xl font-bold text-gray-900 tracking-tight">Installations</Text>
          </View>
          <View className="bg-white p-3 rounded-[16px] shadow-sm shadow-black/5 border border-gray-100">
            <CalendarIcon size={24} color="#4f46e5" />
          </View>
        </View>

        {/* Timeline View */}
        {loading ? (
          <View className="py-20 items-center justify-center">
            <ActivityIndicator size="large" color="#4f46e5" />
          </View>
        ) : error ? (
          <View className="py-20 items-center justify-center">
            <AlertCircle size={40} color="#ef4444" />
            <Text className="mt-4 text-red-500 font-medium text-center">{error}</Text>
          </View>
        ) : bookings.length === 0 ? (
          <View className="py-20 items-center justify-center">
            <CalendarIcon size={40} color="#9ca3af" />
            <Text className="mt-4 text-gray-500 font-medium text-center">No appointments found.</Text>
          </View>
        ) : (
          <View className="mb-24 ml-2">
            {bookings.map((booking, index) => (
              <View key={booking.id} className="flex-row mb-8">
                {/* Timeline Line & Dot */}
                <View className="items-center mr-5">
                  <View className="w-5 h-5 rounded-full bg-ess-purple border-[5px] border-ess-softBlue z-10 shadow-sm shadow-ess-purple/30" />
                  {index !== bookings.length - 1 && (
                    <View className="w-0.5 h-full bg-gray-200 absolute top-5" />
                  )}
                </View>

                {/* Booking Card */}
                <Pressable className="flex-1">
                  <Card className="border-0 p-0 overflow-hidden shadow-sm shadow-black/5">
                    <View className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full flex-row items-center z-10">
                      <Wrench size={12} color="#081f3d" />
                      <Text className="text-[10px] font-bold uppercase tracking-wider text-ess-darkPurple ml-1">
                        Service
                      </Text>
                    </View>

                    <View className="px-5 pt-10 pb-5">
                      <View className="flex-row justify-between items-start mb-3">
                        <Text className="text-[18px] font-bold text-gray-900 tracking-tight flex-1 mr-2">Booking #{booking.id.substring(0,8).toUpperCase()}</Text>
                        <StatusBadge status={booking.status} />
                      </View>
                      
                      <View className="space-y-3 mt-1">
                        <View className="flex-row items-center">
                          <CalendarIcon size={16} color="#9ca3af" />
                          <Text className="text-gray-600 ml-3 font-medium">{new Date(booking.start_time).toLocaleDateString()}</Text>
                        </View>
                        <View className="flex-row items-center">
                          <Clock size={16} color="#9ca3af" />
                          <Text className="text-gray-600 ml-3 font-medium">
                            {new Date(booking.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(booking.end_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </Text>
                        </View>
                        <View className="flex-row items-center">
                          <MapPin size={16} color="#9ca3af" />
                          <Text className="text-gray-600 ml-3 font-medium" numberOfLines={1}>Request #{booking.request_id.substring(0,8).toUpperCase()}</Text>
                        </View>
                      </View>

                      <View className="mt-5 pt-4 border-t border-gray-100 flex-row justify-between items-center">
                        <View className="flex-row items-center">
                          <View className="w-8 h-8 rounded-[10px] bg-ess-softBlue items-center justify-center">
                            <Users size={16} color="#0f4c81" />
                          </View>
                          <Text className="text-gray-500 font-medium ml-3 text-[13px]">Tech ID: <Text className="font-bold text-gray-900">{booking.technician_id.substring(0,4)}</Text></Text>
                        </View>
                        <Text className="text-ess-purple font-bold tracking-wide">Details</Text>
                      </View>
                    </View>
                  </Card>
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Premium Floating Action Button */}
      <Pressable
        className="absolute bottom-8 right-7 bg-ess-purple w-16 h-16 rounded-[24px] items-center justify-center shadow-lg shadow-ess-purple/40"
      >
        <Plus size={32} color="white" />
      </Pressable>
    </SafeAreaView>
  );
}
