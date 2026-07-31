import React from 'react';
import { View, Text, ScrollView, Pressable, FlatList } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Package, Clock, CheckCircle2, ChevronRight, XCircle } from 'lucide-react-native';

const MOCK_ORDERS = [
  { id: 'ORD-1234', date: '2023-10-15', status: 'delivered', total: 499.99, items: 2 },
  { id: 'ORD-5678', date: '2023-11-02', status: 'processing', total: 129.50, items: 1 },
  { id: 'ORD-9012', date: '2023-11-28', status: 'cancelled', total: 899.00, items: 3 },
];

export default function OrdersScreen() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return { bg: 'bg-green-100', text: 'text-green-800', icon: <CheckCircle2 size={16} color="#166534" /> };
      case 'processing': return { bg: 'bg-blue-100', text: 'text-blue-800', icon: <Clock size={16} color="#1e40af" /> };
      case 'cancelled': return { bg: 'bg-red-100', text: 'text-red-800', icon: <XCircle size={16} color="#991b1b" /> };
      default: return { bg: 'bg-gray-100', text: 'text-gray-800', icon: <Package size={16} color="#1f2937" /> };
    }
  };

  const renderOrder = ({ item }: { item: any }) => {
    const status = getStatusColor(item.status);
    
    return (
      <Pressable 
        onPress={() => router.push(`/orders/${item.id}`)}
        className="bg-white p-5 rounded-2xl mb-4 shadow-sm border border-gray-100"
      >
        <View className="flex-row justify-between items-center mb-3">
          <View>
            <Text className="text-gray-900 font-bold text-lg">{item.id}</Text>
            <Text className="text-gray-500 text-sm">{item.date}</Text>
          </View>
          <View className={`px-3 py-1.5 rounded-full flex-row items-center space-x-1 ${status.bg}`}>
            {status.icon}
            <Text className={`text-xs font-bold capitalize ml-1 ${status.text}`}>{item.status}</Text>
          </View>
        </View>
        
        <View className="flex-row justify-between items-center pt-3 border-t border-gray-50 mt-1">
          <View>
            <Text className="text-gray-500 text-sm">Total</Text>
            <Text className="text-gray-900 font-bold text-base">${item.total.toFixed(2)}</Text>
          </View>
          <View>
            <Text className="text-gray-500 text-sm">Items</Text>
            <Text className="text-gray-900 font-bold text-base">{item.items}</Text>
          </View>
          <View className="bg-gray-50 p-2 rounded-full">
            <ChevronRight size={20} color="#6b7280" />
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
        <Text className="text-xl font-bold text-gray-900">My Orders</Text>
        <View className="w-10" />
      </View>

      <FlatList
        data={MOCK_ORDERS}
        keyExtractor={(item) => item.id}
        renderItem={renderOrder}
        contentContainerStyle={{ padding: 24 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View className="items-center justify-center py-20 mt-10">
            <View className="bg-gray-100 p-6 rounded-full mb-6">
              <Package size={48} color="#9ca3af" />
            </View>
            <Text className="text-xl font-bold text-gray-900 mb-2">No orders yet</Text>
            <Text className="text-gray-500 text-center mb-8 px-8">You haven't placed any orders yet. Start exploring our products!</Text>
            <Pressable 
              onPress={() => router.replace('/(tabs)/explore')}
              className="bg-blue-600 px-8 py-4 rounded-xl"
            >
              <Text className="text-white font-bold text-lg">Browse Products</Text>
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}
