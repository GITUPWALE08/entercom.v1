import React from 'react';
import { View, Text, ScrollView, Pressable, Image } from 'react-native';
import { Calendar as CalendarIcon, MapPin, Clock, Users, Wrench, ShieldCheck, Plus } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../../../src/components/ui/Card';
import { StatusBadge } from '../../../src/components/ui/StatusBadge';

const mockBookings = [
  { 
    id: '1', 
    title: 'Smart Lock Installation', 
    location: '123 Main St, Apartment 4B', 
    date: 'Today, 20 Oct', 
    time: '10:00 AM - 11:30 AM', 
    status: 'in_progress', 
    type: 'installation',
    technician: 'Michael T.',
    image: 'https://images.unsplash.com/photo-1558089687-f282ffcbc126?q=80&w=600&auto=format&fit=crop'
  },
  { 
    id: '2', 
    title: 'Camera System Maintenance', 
    location: '123 Main St, Apartment 4B', 
    date: 'Sat, 25 Oct', 
    time: '02:00 PM - 04:00 PM', 
    status: 'pending', 
    type: 'service',
    technician: 'Sarah W.',
    image: 'https://images.unsplash.com/photo-1557438159-51eec7a6c9e8?q=80&w=600&auto=format&fit=crop'
  },
];

export default function BookingsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-7 pt-10" showsVerticalScrollIndicator={false}>
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
        <View className="mb-24 ml-2">
          {mockBookings.map((booking, index) => (
            <View key={booking.id} className="flex-row mb-8">
              {/* Timeline Line & Dot */}
              <View className="items-center mr-5">
                <View className="w-5 h-5 rounded-full bg-ess-purple border-[5px] border-ess-softBlue z-10 shadow-sm shadow-ess-purple/30" />
                {index !== mockBookings.length - 1 && (
                  <View className="w-0.5 h-full bg-gray-200 absolute top-5" />
                )}
              </View>

              {/* Booking Card */}
              <Pressable className="flex-1">
                <Card className="border-0 p-0 overflow-hidden shadow-sm shadow-black/5">
                  <Image 
                    source={{ uri: booking.image }} 
                    className="w-full h-32 bg-gray-100 opacity-90" 
                    resizeMode="cover"
                  />
                  <View className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full flex-row items-center">
                    {booking.type === 'installation' ? (
                      <Wrench size={12} color="#081f3d" />
                    ) : (
                      <ShieldCheck size={12} color="#081f3d" />
                    )}
                    <Text className="text-[10px] font-bold uppercase tracking-wider text-ess-darkPurple ml-1">
                      {booking.type}
                    </Text>
                  </View>

                  <View className="px-5 pt-4 pb-5">
                    <View className="flex-row justify-between items-start mb-3">
                      <Text className="text-[18px] font-bold text-gray-900 tracking-tight flex-1 mr-2">{booking.title}</Text>
                      <StatusBadge status={booking.status} />
                    </View>
                    
                    <View className="space-y-3 mt-1">
                      <View className="flex-row items-center">
                        <CalendarIcon size={16} color="#9ca3af" />
                        <Text className="text-gray-600 ml-3 font-medium">{booking.date}</Text>
                      </View>
                      <View className="flex-row items-center">
                        <Clock size={16} color="#9ca3af" />
                        <Text className="text-gray-600 ml-3 font-medium">{booking.time}</Text>
                      </View>
                      <View className="flex-row items-center">
                        <MapPin size={16} color="#9ca3af" />
                        <Text className="text-gray-600 ml-3 font-medium" numberOfLines={1}>{booking.location}</Text>
                      </View>
                    </View>

                    <View className="mt-5 pt-4 border-t border-gray-100 flex-row justify-between items-center">
                      <View className="flex-row items-center">
                        <View className="w-8 h-8 rounded-[10px] bg-ess-softBlue items-center justify-center">
                          <Users size={16} color="#0f4c81" />
                        </View>
                        <Text className="text-gray-500 font-medium ml-3 text-[13px]">Tech: <Text className="font-bold text-gray-900">{booking.technician}</Text></Text>
                      </View>
                      <Text className="text-ess-purple font-bold tracking-wide">Details</Text>
                    </View>
                  </View>
                </Card>
              </Pressable>
            </View>
          ))}
        </View>
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
