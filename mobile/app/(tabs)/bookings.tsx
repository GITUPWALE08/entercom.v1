import React from 'react';
import { View, Text, ScrollView, Pressable, Image } from 'react-native';
import { Calendar as CalendarIcon, MapPin, Clock, ChevronRight, Users, CheckCircle2 } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const mockBookings = [
  { 
    id: '1', 
    title: 'Tennis Court', 
    location: 'Sports Center', 
    date: 'Today, 20 Oct', 
    time: '10:00 AM - 11:30 AM', 
    status: 'Confirmed', 
    type: 'sports',
    image: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=600&auto=format&fit=crop'
  },
  { 
    id: '2', 
    title: 'Community Hall', 
    location: 'Main Building', 
    date: 'Sat, 25 Oct', 
    time: '06:00 PM - 10:00 PM', 
    status: 'Pending Approval', 
    type: 'event',
    image: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?q=80&w=600&auto=format&fit=crop'
  },
];

export default function BookingsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView className="flex-1 px-4 pt-6" showsVerticalScrollIndicator={false}>
        <View className="mb-8 flex-row items-center justify-between">
          <View>
            <Text className="text-3xl font-bold text-slate-900">Bookings</Text>
            <Text className="text-slate-500 mt-1">Manage your upcoming events</Text>
          </View>
          <View className="bg-indigo-100 p-3 rounded-full">
            <CalendarIcon size={24} color="#4338ca" />
          </View>
        </View>

        {/* Timeline View */}
        <View className="mb-20 ml-2">
          {mockBookings.map((booking, index) => (
            <View key={booking.id} className="flex-row mb-6">
              {/* Timeline Line & Dot */}
              <View className="items-center mr-4">
                <View className="w-4 h-4 rounded-full bg-indigo-500 border-4 border-indigo-100 z-10" />
                {index !== mockBookings.length - 1 && (
                  <View className="w-0.5 h-full bg-slate-200 absolute top-4" />
                )}
              </View>

              {/* Booking Card */}
              <Pressable
                className="flex-1 bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 pb-4"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.05,
                  shadowRadius: 12,
                  elevation: 3,
                }}
              >
                <Image 
                  source={{ uri: booking.image }} 
                  className="w-full h-32 bg-slate-200" 
                  resizeMode="cover"
                />
                <View className="px-5 pt-4">
                  <View className="flex-row justify-between items-start mb-2">
                    <Text className="text-xl font-bold text-slate-900">{booking.title}</Text>
                    <View className={`px-3 py-1 rounded-full ${booking.status === 'Confirmed' ? 'bg-green-100' : 'bg-orange-100'}`}>
                      <Text className={`text-xs font-semibold ${booking.status === 'Confirmed' ? 'text-green-700' : 'text-orange-700'}`}>
                        {booking.status}
                      </Text>
                    </View>
                  </View>
                  
                  <View className="space-y-2 mt-2">
                    <View className="flex-row items-center">
                      <CalendarIcon size={16} color="#64748b" />
                      <Text className="text-slate-600 ml-2 font-medium">{booking.date}</Text>
                    </View>
                    <View className="flex-row items-center">
                      <Clock size={16} color="#64748b" />
                      <Text className="text-slate-600 ml-2">{booking.time}</Text>
                    </View>
                    <View className="flex-row items-center">
                      <MapPin size={16} color="#64748b" />
                      <Text className="text-slate-600 ml-2">{booking.location}</Text>
                    </View>
                  </View>

                  <View className="mt-4 pt-4 border-t border-slate-100 flex-row justify-between items-center">
                    <View className="flex-row -space-x-2">
                      {[1, 2, 3].map((i) => (
                        <View key={i} className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white items-center justify-center">
                          <Users size={14} color="#94a3b8" />
                        </View>
                      ))}
                    </View>
                    <Text className="text-indigo-600 font-semibold text-sm">View Details</Text>
                  </View>
                </View>
              </Pressable>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <Pressable
        className="absolute bottom-6 right-6 bg-indigo-600 w-14 h-14 rounded-full items-center justify-center shadow-lg"
        style={{
          shadowColor: '#4338ca',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 5,
        }}
      >
        <Text className="text-white text-3xl font-light mb-1">+</Text>
      </Pressable>
    </SafeAreaView>
  );
}
