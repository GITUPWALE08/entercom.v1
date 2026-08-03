import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { ClipboardList, Clock, CheckCircle, ChevronRight, AlertCircle } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const mockRequests = [
  { id: '1', title: 'Plumbing Repair', type: 'Maintenance', status: 'In Progress', date: 'Oct 12, 2023', progress: 0.6, color: '#3b82f6' },
  { id: '2', title: 'AC Maintenance', type: 'Service', status: 'Pending', date: 'Oct 15, 2023', progress: 0.2, color: '#f59e0b' },
  { id: '3', title: 'Cleaning Service', type: 'Housekeeping', status: 'Completed', date: 'Oct 10, 2023', progress: 1.0, color: '#10b981' },
];

export default function RequestsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView className="flex-1 px-4 pt-6" showsVerticalScrollIndicator={false}>
        <View className="mb-6 flex-row items-center justify-between">
          <View>
            <Text className="text-3xl font-bold text-slate-900">Requests</Text>
            <Text className="text-slate-500 mt-1">Track your service requests</Text>
          </View>
          <View className="bg-blue-100 p-3 rounded-full">
            <ClipboardList size={24} color="#0f4c81" />
          </View>
        </View>

        <View className="mb-20">
          {mockRequests.map((request) => (
            <Pressable
              key={request.id}
              className="bg-white rounded-2xl p-5 mb-4 shadow-sm border border-slate-100"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <View className="flex-row justify-between items-start mb-4">
                <View>
                  <Text className="text-lg font-bold text-slate-800">{request.title}</Text>
                  <Text className="text-slate-500 text-sm mt-1">{request.type} • {request.date}</Text>
                </View>
                <View className="bg-slate-50 px-3 py-1 rounded-full border border-slate-100 flex-row items-center">
                  {request.progress === 1.0 ? (
                    <CheckCircle size={14} color={request.color} />
                  ) : request.progress > 0.3 ? (
                    <Clock size={14} color={request.color} />
                  ) : (
                    <AlertCircle size={14} color={request.color} />
                  )}
                  <Text className="text-xs font-medium ml-1" style={{ color: request.color }}>
                    {request.status}
                  </Text>
                </View>
              </View>

              {/* Progress Bar Container */}
              <View className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-3">
                <View
                  className="h-full rounded-full"
                  style={{
                    width: `${request.progress * 100}%`,
                    backgroundColor: request.color,
                  }}
                />
              </View>

              <View className="flex-row justify-between items-center">
                <Text className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                  {request.progress === 1.0 ? 'Completed' : 'Expected Completion in 2 days'}
                </Text>
                <ChevronRight size={16} color="#94a3b8" />
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <Pressable
        className="absolute bottom-6 right-6 bg-slate-900 w-14 h-14 rounded-full items-center justify-center shadow-lg"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 5,
        }}
      >
        <Text className="text-white text-3xl font-light mb-1">+</Text>
      </Pressable>
    </SafeAreaView>
  );
}
