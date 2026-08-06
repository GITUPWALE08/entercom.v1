import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, CreditCard, ChevronRight, FileText, Plus, AlertCircle } from 'lucide-react-native';
import { Card, CardContent } from '../../../src/components/ui/Card';
import { Button } from '../../../src/components/ui/Button';
import { StatusBadge } from '../../../src/components/ui/StatusBadge';
import { paymentsApi, PaymentItem } from '../../../src/api/payments';

export default function PaymentsScreen() {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = useCallback(async () => {
    try {
      setError(null);
      const data = await paymentsApi.list();
      setPayments(data || []);
    } catch (err: any) {
      setError('Failed to load payments.');
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchPayments().finally(() => setLoading(false));
  }, [fetchPayments]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPayments();
    setRefreshing(false);
  }, [fetchPayments]);

  const renderPayment = ({ item }: { item: PaymentItem }) => {
    return (
      <Pressable onPress={() => router.push(`/(screens)/payment/${item.id}`)}>
        <Card className="mb-4 border-0 p-0 shadow-sm shadow-black/5 overflow-hidden">
          <CardContent className="p-5">
            <View className="flex-row justify-between items-start mb-4">
              <View className="flex-row items-center flex-1 pr-4">
                <View className="w-12 h-12 bg-ess-softBlue rounded-[16px] items-center justify-center mr-4">
                  <CreditCard size={24} color="#0f4c81" />
                </View>
                <View>
                  <Text className="text-gray-900 font-bold text-[16px] tracking-tight">Payment</Text>
                  <Text className="text-gray-500 text-[13px] mt-0.5 font-medium">#{item.id.substring(0,8).toUpperCase()} • {new Date(item.created_at).toLocaleDateString()}</Text>
                </View>
              </View>
              <View className="items-end">
                <Text className="text-ess-darkPurple font-extrabold text-[18px] tracking-tight">${parseFloat(item.amount).toFixed(2)}</Text>
              </View>
            </View>
            
            <View className="flex-row justify-between items-center pt-4 border-t border-gray-100">
              <View className="flex-row items-center">
                <StatusBadge status={item.status} />
                <Text className="text-gray-500 text-[13px] ml-3 font-semibold uppercase">{item.currency}</Text>
              </View>
              <View className="flex-row items-center bg-gray-50 px-3 py-2 rounded-xl">
                <FileText size={14} color="#4f46e5" className="mr-1.5" />
                <Text className="text-ess-purple text-[12px] font-bold tracking-wide">Details</Text>
              </View>
            </View>
          </CardContent>
        </Card>
      </Pressable>
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
          <Text className="text-indigo-100 text-[13px] font-bold tracking-widest uppercase mb-1">Total Paid</Text>
          <Text className="text-white font-extrabold text-[36px] tracking-tighter mb-5">
            ${payments.filter(p => p.status === 'completed' || p.status === 'success').reduce((acc, curr) => acc + parseFloat(curr.amount), 0).toFixed(2)}
          </Text>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#4f46e5" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center">
          <AlertCircle size={40} color="#ef4444" />
          <Text className="mt-4 text-red-500 font-medium text-center">{error}</Text>
        </View>
      ) : (
        <FlatList
          data={payments}
          keyExtractor={(item) => item.id}
          renderItem={renderPayment}
          contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#081f3d" />}
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
      )}
    </View>
  );
}
