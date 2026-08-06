import React from 'react';
import { View, Text, Pressable, FlatList, Image } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, CreditCard, ChevronRight, FileText, Plus } from 'lucide-react-native';
import { Card, CardContent } from '../../../src/components/ui/Card';
import { Button } from '../../../src/components/ui/Button';
import { StatusBadge } from '../../../src/components/ui/StatusBadge';

const MOCK_PAYMENTS = [
  { id: 'INV-1234', date: '2023-10-15', status: 'completed', amount: 1299.00, method: 'Visa •••• 4242', type: 'Ultimate Smart Home Bundle' },
  { id: 'INV-5678', date: '2023-11-02', status: 'pending', amount: 249.50, method: 'MasterCard •••• 8899', type: 'Smart Lock Pro' },
  { id: 'INV-9012', date: '2023-11-28', status: 'cancelled', amount: 899.00, method: 'PayPal', type: 'Camera System Maintenance' },
];

export default function PaymentsScreen() {
  const renderPayment = ({ item }: { item: any }) => {
    return (
      <Card className="mb-4 border-0 p-0 shadow-sm shadow-black/5 overflow-hidden">
        <CardContent className="p-5">
          <View className="flex-row justify-between items-start mb-4">
            <View className="flex-row items-center flex-1 pr-4">
              <View className="w-12 h-12 bg-ess-softBlue rounded-[16px] items-center justify-center mr-4">
                <CreditCard size={24} color="#0f4c81" />
              </View>
              <View>
                <Text className="text-gray-900 font-bold text-[16px] tracking-tight">{item.type}</Text>
                <Text className="text-gray-500 text-[13px] mt-0.5 font-medium">{item.id} • {item.date}</Text>
              </View>
            </View>
            <View className="items-end">
              <Text className="text-ess-darkPurple font-extrabold text-[18px] tracking-tight">${item.amount.toFixed(2)}</Text>
            </View>
          </View>
          
          <View className="flex-row justify-between items-center pt-4 border-t border-gray-100">
            <View className="flex-row items-center">
              <StatusBadge status={item.status} />
              <Text className="text-gray-500 text-[13px] ml-3 font-semibold">{item.method}</Text>
            </View>
            <Pressable className="flex-row items-center bg-gray-50 px-3 py-2 rounded-xl">
              <FileText size={14} color="#4f46e5" className="mr-1.5" />
              <Text className="text-ess-purple text-[12px] font-bold tracking-wide">Receipt</Text>
            </Pressable>
          </View>
        </CardContent>
      </Card>
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Premium Header */}
      <View className="bg-ess-purple pt-16 pb-6 px-7 rounded-b-[40px] shadow-lg shadow-ess-purple/20 relative overflow-hidden z-10">
        <View className="absolute -top-20 -left-20 w-64 h-64 bg-ess-darkPurple rounded-full opacity-50 blur-3xl" />
        <View className="absolute bottom-0 right-0 w-40 h-40 bg-ess-softBlue rounded-full opacity-10 blur-2xl" />
        
        <View className="flex-row items-center justify-between relative z-10 mb-6">
          <Pressable onPress={() => router.back()} className="w-10 h-10 bg-white/10 rounded-full items-center justify-center backdrop-blur-md border border-white/20">
            <ArrowLeft size={20} color="white" />
          </Pressable>
          <Text className="text-[17px] font-bold text-white tracking-wide">Billing & Payments</Text>
          <View className="w-10" />
        </View>

        {/* Current Balance Card */}
        <View className="bg-white/10 backdrop-blur-md rounded-[24px] p-6 border border-white/20 relative z-10">
          <Text className="text-indigo-100 text-[13px] font-bold tracking-widest uppercase mb-1">Total Outstanding</Text>
          <Text className="text-white font-extrabold text-[36px] tracking-tighter mb-5">$249.50</Text>
          
          <Button variant="primary" className="bg-white" textClassName="text-ess-darkPurple">
            Pay Balance Now
          </Button>
        </View>
      </View>

      <FlatList
        data={MOCK_PAYMENTS}
        keyExtractor={(item) => item.id}
        renderItem={renderPayment}
        contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={() => (
          <View className="mb-6 flex-row items-center justify-between">
            <Text className="text-[20px] font-bold text-gray-900 tracking-tight">Recent Transactions</Text>
            <Pressable className="flex-row items-center bg-ess-softBlue px-3 py-1.5 rounded-full">
              <Plus size={14} color="#081f3d" />
              <Text className="text-[12px] font-bold text-ess-darkPurple ml-1 tracking-wide">Add Card</Text>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={() => (
          <View className="items-center justify-center py-16">
            <View className="bg-white w-24 h-24 rounded-full items-center justify-center shadow-sm shadow-black/5 mb-6">
              <CreditCard size={40} color="#9ca3af" />
            </View>
            <Text className="text-[20px] font-bold text-gray-900 tracking-tight mb-2">No payments yet</Text>
            <Text className="text-gray-500 text-center px-8 text-[15px] leading-relaxed">
              You haven't made any payments yet. They will appear here once your orders are processed.
            </Text>
          </View>
        )}
      />
    </View>
  );
}
