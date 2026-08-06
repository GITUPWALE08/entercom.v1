import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, CreditCard, AlertCircle, Package, FileText, ChevronRight, Download } from 'lucide-react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { paymentsApi, PaymentItem } from '../../../src/api/payments';
import { StatusBadge } from '../../../src/components/ui/StatusBadge';

export default function PaymentDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [payment, setPayment] = useState<PaymentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const downloadReceipt = async () => {
    if (!payment) return;
    try {
      setDownloading(true);
      const url = `https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf`; // Mock placeholder as API doesn't define it
      const fileUri = `${FileSystem.documentDirectory}receipt_${payment.id}.pdf`;
      const { uri } = await FileSystem.downloadAsync(url, fileUri);
      
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri);
      } else {
        alert('Sharing is not available on your device');
      }
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download receipt');
    } finally {
      setDownloading(false);
    }
  };

  const fetchPayment = useCallback(async () => {
    if (!id) return;
    try {
      setError(null);
      const data = await paymentsApi.get(id);
      setPayment(data);
    } catch (err: any) {
      setError('Failed to load payment details. Pull down to retry.');
      console.error('Payment detail fetch error:', err);
    }
  }, [id]);

  useEffect(() => {
    fetchPayment().finally(() => setLoading(false));
  }, [fetchPayment]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPayment();
    setRefreshing(false);
  }, [fetchPayment]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'success': return 'bg-green-600';
      case 'cancelled':
      case 'failed': return 'bg-red-600';
      default: return 'bg-ess-purple';
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white pt-16 pb-4 px-6 flex-row items-center justify-between border-b border-gray-100">
        <Pressable onPress={() => router.back()} className="p-2 -ml-2 bg-gray-50 rounded-full">
          <ArrowLeft size={24} color="#1f2937" />
        </Pressable>
        <Text className="text-xl font-bold text-gray-900">
          Payment #{id?.toString().substring(0, 8).toUpperCase()}
        </Text>
        <View className="w-10" />
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#081f3d" />
          <Text className="text-gray-500 mt-4 font-medium">Loading payment...</Text>
        </View>
      ) : error ? (
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#081f3d" />}
        >
          <View className="flex-1 items-center justify-center py-20">
            <AlertCircle size={48} color="#ef4444" />
            <Text className="text-red-500 text-center font-medium mt-4 px-8">{error}</Text>
          </View>
        </ScrollView>
      ) : !payment ? null : (
        <ScrollView
          className="flex-1 p-6"
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#081f3d" />}
        >
          {/* Status Card */}
          <View className={`${getStatusColor(payment.status)} p-6 rounded-2xl shadow-sm mb-6 flex-row justify-between items-center`}>
            <View>
              <Text className="text-white/80 font-medium mb-1">Status</Text>
              <Text className="text-white font-bold text-2xl capitalize">
                {payment.status?.replace(/_/g, ' ')}
              </Text>
              <Text className="text-white/70 text-sm mt-1">{formatDate(payment.created_at)}</Text>
            </View>
            <View className="bg-white/20 p-4 rounded-full">
              <CreditCard size={32} color="white" />
            </View>
          </View>

          {/* Amount Details */}
          <View className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-gray-500 font-medium">Amount</Text>
              <Text className="text-gray-900 font-bold text-xl">${parseFloat(payment.amount).toFixed(2)}</Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-500 font-medium">Currency</Text>
              <Text className="text-gray-900 font-semibold uppercase">{payment.currency}</Text>
            </View>
          </View>

          {/* Related Links */}
          {payment.order_id && (
            <Pressable onPress={() => router.push(`/(screens)/orders/${payment.order_id}`)} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4 flex-row justify-between items-center">
              <View className="flex-row items-center">
                <Package size={20} color="#0f4c81" />
                <Text className="ml-3 font-medium text-gray-900">View Order Details</Text>
              </View>
              <ChevronRight size={20} color="#9ca3af" />
            </Pressable>
          )}

          {payment.request_id && (
            <Pressable onPress={() => router.push(`/(screens)/request/${payment.request_id}`)} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4 flex-row justify-between items-center">
              <View className="flex-row items-center">
                <FileText size={20} color="#f59e0b" />
                <Text className="ml-3 font-medium text-gray-900">View Service Request</Text>
              </View>
              <ChevronRight size={20} color="#9ca3af" />
            </Pressable>
          )}

          {/* Action Buttons */}
          <Pressable 
            onPress={downloadReceipt}
            disabled={downloading}
            className={`rounded-2xl flex-row justify-center items-center p-4 mb-10 shadow-sm ${downloading ? 'bg-ess-purple/70' : 'bg-ess-purple shadow-ess-purple/30'}`}
          >
            {downloading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Download size={20} color="white" />
                <Text className="text-white font-bold text-[16px] ml-2">Download Receipt</Text>
              </>
            )}
          </Pressable>

        </ScrollView>
      )}
    </View>
  );
}
