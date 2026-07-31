import React from 'react';
import { View, Text, ScrollView, Pressable, FlatList } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, FileText, Clock, CheckCircle2, ChevronRight, XCircle } from 'lucide-react-native';

const MOCK_QUOTES = [
  { id: 'QT-2023-001', date: '2023-11-10', status: 'approved', amount: 1250.00, title: 'Office Security Installation' },
  { id: 'QT-2023-002', date: '2023-11-15', status: 'pending', amount: 850.50, title: 'Smart Home Upgrade' },
  { id: 'QT-2023-003', date: '2023-11-20', status: 'rejected', amount: 3200.00, title: 'Warehouse Access Control' },
];

export default function QuotesScreen() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return { bg: 'bg-green-100', text: 'text-green-800', icon: <CheckCircle2 size={16} color="#166534" /> };
      case 'pending': return { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: <Clock size={16} color="#854d0e" /> };
      case 'rejected': return { bg: 'bg-red-100', text: 'text-red-800', icon: <XCircle size={16} color="#991b1b" /> };
      default: return { bg: 'bg-gray-100', text: 'text-gray-800', icon: <FileText size={16} color="#1f2937" /> };
    }
  };

  const renderQuote = ({ item }: { item: any }) => {
    const status = getStatusColor(item.status);
    
    return (
      <Pressable 
        onPress={() => router.push(`/quotes/${item.id}`)}
        className="bg-white p-5 rounded-2xl mb-4 shadow-sm border border-gray-100"
      >
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1 pr-4">
            <Text className="text-gray-900 font-bold text-lg mb-1" numberOfLines={1}>{item.title}</Text>
            <Text className="text-gray-500 text-sm">{item.id} • {item.date}</Text>
          </View>
          <View className={`px-3 py-1.5 rounded-full flex-row items-center space-x-1 ${status.bg}`}>
            {status.icon}
            <Text className={`text-xs font-bold capitalize ml-1 ${status.text}`}>{item.status}</Text>
          </View>
        </View>
        
        <View className="flex-row justify-between items-center pt-3 border-t border-gray-50 mt-1">
          <View>
            <Text className="text-gray-500 text-sm">Estimated Amount</Text>
            <Text className="text-gray-900 font-bold text-base">${item.amount.toFixed(2)}</Text>
          </View>
          <View className="bg-blue-50 p-2 rounded-full">
            <ChevronRight size={20} color="#2563eb" />
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white pt-16 pb-4 px-6 flex-row items-center justify-between border-b border-gray-100">
        <Pressable onPress={() => router.back()} className="p-2 -ml-2 bg-gray-50 rounded-full">
          <ArrowLeft size={24} color="#1f2937" />
        </Pressable>
        <Text className="text-xl font-bold text-gray-900">My Quotes</Text>
        <Pressable className="p-2 -mr-2">
          <FileText size={24} color="#1f2937" />
        </Pressable>
      </View>

      <FlatList
        data={MOCK_QUOTES}
        keyExtractor={(item) => item.id}
        renderItem={renderQuote}
        contentContainerStyle={{ padding: 24 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View className="items-center justify-center py-20 mt-10">
            <View className="bg-gray-100 p-6 rounded-full mb-6">
              <FileText size={48} color="#9ca3af" />
            </View>
            <Text className="text-xl font-bold text-gray-900 mb-2">No quotes yet</Text>
            <Text className="text-gray-500 text-center mb-8 px-8">You haven't requested any custom quotes yet.</Text>
            <Pressable 
              onPress={() => router.replace('/(tabs)/requests')}
              className="bg-blue-600 px-8 py-4 rounded-xl"
            >
              <Text className="text-white font-bold text-lg">Request a Service</Text>
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}
