import React from 'react';
import { View, Text, ScrollView, Pressable, FlatList } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, CreditCard, Clock, CheckCircle2, ChevronRight, RefreshCw, FileText } from 'lucide-react-native';

const MOCK_PAYMENTS = [
  { id: 'PAY-1234', date: '2023-10-15', status: 'completed', amount: 499.99, method: 'Visa ending in 4242' },
  { id: 'PAY-5678', date: '2023-11-02', status: 'processing', amount: 129.50, method: 'MasterCard ending in 8899' },
  { id: 'PAY-9012', date: '2023-11-28', status: 'refunded', amount: 899.00, method: 'PayPal' },
];

export default function PaymentsScreen() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return { bg: 'bg-green-100', text: 'text-green-800', icon: <CheckCircle2 size={16} color="#166534" /> };
      case 'processing': return { bg: 'bg-blue-100', text: 'text-blue-800', icon: <Clock size={16} color="#1e40af" /> };
      case 'refunded': return { bg: 'bg-purple-100', text: 'text-purple-800', icon: <RefreshCw size={16} color="#6b21a8" /> };
      default: return { bg: 'bg-gray-100', text: 'text-gray-800', icon: <CreditCard size={16} color="#1f2937" /> };
    }
  };

  const renderPayment = ({ item }: { item: any }) => {
    const status = getStatusColor(item.status);
    
    return (
      <View className="bg-white p-5 rounded-2xl mb-4 shadow-sm border border-gray-100">
        <View className="flex-row justify-between items-center mb-4">
          <View className="flex-row items-center">
            <View className="w-10 h-10 bg-blue-50 rounded-full items-center justify-center mr-3">
              <CreditCard size={20} color="#2563eb" />
            </View>
            <View>
              <Text className="text-gray-900 font-bold text-base">{item.id}</Text>
              <Text className="text-gray-500 text-xs mt-0.5">{item.date}</Text>
            </View>
          </View>
          <View className="items-end">
            <Text className="text-gray-900 font-bold text-lg">${item.amount.toFixed(2)}</Text>
            <View className={`px-2 py-1 rounded-full flex-row items-center mt-1 ${status.bg}`}>
              <Text className={`text-[10px] font-bold capitalize ${status.text}`}>{item.status}</Text>
            </View>
          </View>
        </View>
        
        <View className="flex-row justify-between items-center pt-3 border-t border-gray-50">
          <Text className="text-gray-500 text-sm flex-1">{item.method}</Text>
          <Pressable className="flex-row items-center bg-gray-50 px-3 py-1.5 rounded-lg">
            <FileText size={14} color="#4b5563" className="mr-1" />
            <Text className="text-gray-700 text-xs font-semibold">Receipt</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white pt-16 pb-4 px-6 flex-row items-center justify-between border-b border-gray-100">
        <Pressable onPress={() => router.back()} className="p-2 -ml-2 bg-gray-50 rounded-full">
          <ArrowLeft size={24} color="#1f2937" />
        </Pressable>
        <Text className="text-xl font-bold text-gray-900">Payment History</Text>
        <View className="w-10" />
      </View>

      <FlatList
        data={MOCK_PAYMENTS}
        keyExtractor={(item) => item.id}
        renderItem={renderPayment}
        contentContainerStyle={{ padding: 24 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={() => (
          <View className="bg-blue-600 rounded-2xl p-6 mb-6 shadow-sm">
            <Text className="text-blue-100 font-medium mb-1">Total Spent</Text>
            <Text className="text-white font-bold text-3xl">$1,528.49</Text>
            <View className="mt-4 pt-4 border-t border-white/20 flex-row justify-between items-center">
              <Text className="text-blue-100 text-sm">Manage Payment Methods</Text>
              <View className="bg-white/20 rounded-full p-1">
                <ChevronRight size={16} color="white" />
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={() => (
          <View className="items-center justify-center py-10">
            <View className="bg-gray-100 p-6 rounded-full mb-6">
              <CreditCard size={48} color="#9ca3af" />
            </View>
            <Text className="text-xl font-bold text-gray-900 mb-2">No payments yet</Text>
            <Text className="text-gray-500 text-center px-8">You haven't made any payments yet. They will appear here once your orders are processed.</Text>
          </View>
        )}
      />
    </View>
  );
}
