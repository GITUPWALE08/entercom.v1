import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, Package, MapPin, CreditCard, AlertCircle, CheckCircle2, Clock, Circle, FileText } from 'lucide-react-native';
import { ordersApi, OrderItem } from '../../../src/api/orders';
import { paymentsApi } from '../../../src/api/payments';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { downloadReceipt } from '../../../src/utils/receipt';
import { StatusBadge } from '../../../src/components/ui/StatusBadge';
import { LogoLoader } from '../../../src/components/ui/Loader';

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<OrderItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    if (!id) return;
    try {
      setError(null);
      const data = await ordersApi.get(id);
      setOrder(data);
    } catch (err: any) {
      setError('Failed to load order details. Pull down to retry.');
      console.error('Order detail fetch error:', err);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder().finally(() => setLoading(false));
  }, [fetchOrder]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrder();
    setRefreshing(false);
  }, [fetchOrder]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
    });
  };

  const formatAmount = (amount?: string | number) => {
    if (!amount) return '0.00';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'fulfilled':
      case 'delivered':
      case 'completed': return 'bg-green-600';
      case 'cancelled':
      case 'canceled': return 'bg-red-600';
      default: return 'bg-ess-purple';
    }
  };

  const [processingPayment, setProcessingPayment] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const handlePayNow = async () => {
    if (!id) return;
    setProcessingPayment(true);
    try {
      const callbackUrl = Linking.createURL('payment-complete', { scheme: 'entercom' });
      const paymentRes = await paymentsApi.initialize({ 
        order_id: id,
        callback_url: callbackUrl
      });
      if (paymentRes.authorization_url) {
        await WebBrowser.openAuthSessionAsync(paymentRes.authorization_url, callbackUrl);
        await fetchOrder(); // Refresh the order state after modal closes
      }
    } catch (err: any) {
      global.showAppAlert('Payment Error', err.response?.data?.message || 'Failed to initialize payment.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleCancelOrder = () => {
    if (!id) return;
    global.showAppAlert(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      [
        { text: 'No, Keep It', style: 'cancel' },
        { 
          text: 'Yes, Cancel', 
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              await ordersApi.cancel(id, 'Cancelled via Mobile App');
              await fetchOrder();
            } catch (err: any) {
              global.showAppAlert('Cancel Error', 'Failed to cancel the order. Please try again.');
            } finally {
              setCancelling(false);
            }
          }
        }
      ]
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white pt-16 pb-4 px-6 flex-row items-center justify-between border-b border-gray-100">
        <Pressable onPress={() => router.back()} className="p-2 -ml-2 bg-gray-50 rounded-full">
          <ArrowLeft size={24} color="#1f2937" />
        </Pressable>
        <Text className="text-xl font-bold text-gray-900">
          Order #{id?.toString().split('-')[0]?.toUpperCase()}
        </Text>
        <View className="w-10" />
      </View>

      {loading ? (
        <LogoLoader text="Loading order..." />
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
      ) : !order ? null : (
        <ScrollView
          className="flex-1 p-6"
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#081f3d" />}
        >
          {/* Status Card */}
          <View className={`${getStatusColor(order.status)} p-6 rounded-2xl shadow-sm mb-6 flex-row justify-between items-center`}>
            <View>
              <Text className="text-white/80 font-medium mb-1">Status</Text>
              <Text className="text-white font-bold text-2xl capitalize">
                {order.status?.replace(/_/g, ' ')}
              </Text>
              <Text className="text-white/70 text-sm mt-1">{formatDate(order.created_at)}</Text>
            </View>
            <View className="bg-white/20 p-4 rounded-full">
              <Package size={32} color="white" />
            </View>
          </View>

          {(order.status === 'pending' || order.status === 'pending_payment') && (
            <View className="flex-row gap-3 mb-6">
              <Pressable 
                onPress={handleCancelOrder}
                disabled={cancelling || processingPayment}
                className="flex-1 bg-white border border-red-200 py-3 rounded-xl items-center"
              >
                <Text className="text-red-600 font-bold">{cancelling ? 'Cancelling...' : 'Cancel Order'}</Text>
              </Pressable>
              
              <Pressable 
                onPress={handlePayNow}
                disabled={processingPayment || cancelling}
                className="flex-[2] bg-ess-purple py-3 rounded-xl items-center"
              >
                <Text className="text-white font-bold">{processingPayment ? 'Redirecting...' : 'Pay Now'}</Text>
              </Pressable>
            </View>
          )}

          {order.request_id && (
            <Pressable onPress={() => router.push(`/(screens)/request/${order.request_id}`)} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-3 flex-row justify-between items-center">
              <View className="flex-row items-center">
                <View className="w-8 h-8 rounded-full bg-orange-50 items-center justify-center">
                  <FileText size={16} color="#f59e0b" />
                </View>
                <Text className="ml-3 font-semibold text-gray-900">View Service Request</Text>
              </View>
              <ArrowLeft size={16} color="#9ca3af" className="rotate-180" />
            </Pressable>
          )}
          
          {order.payment_id && (
            <Pressable onPress={() => router.push(`/(screens)/payment/${order.payment_id}`)} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6 flex-row justify-between items-center">
              <View className="flex-row items-center">
                <View className="w-8 h-8 rounded-full bg-green-50 items-center justify-center">
                  <CreditCard size={16} color="#16a34a" />
                </View>
                <Text className="ml-3 font-semibold text-gray-900">View Payment Details</Text>
              </View>
              <ArrowLeft size={16} color="#9ca3af" className="rotate-180" />
            </Pressable>
          )}

          <Pressable 
            onPress={() => {
              global.showAppAlert(
                'Download Receipt',
                'Choose your preferred format',
                [
                  { text: 'PDF', onPress: () => downloadReceipt(order, 'order', 'pdf') },
                  { text: 'Document (HTML)', onPress: () => downloadReceipt(order, 'order', 'html') },
                  { text: 'Cancel', style: 'cancel' }
                ]
              );
            }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6 flex-row justify-center items-center"
          >
            <FileText size={16} color="#4f46e5" />
            <Text className="ml-2 font-semibold text-ess-purple">Download Receipt</Text>
          </Pressable>

          {/* Order Items */}
          {order.items && order.items.length > 0 && (
            <>
              <Text className="text-lg font-bold text-gray-900 mb-4 ml-1">Order Summary</Text>
              <View className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                <View className="p-5 border-b border-gray-50">
                  {order.items.map((item: any, index: number) => (
                    <View key={item.id || index} className="flex-row justify-between mb-3 last:mb-0">
                      <Text className="text-gray-700 flex-1" numberOfLines={1}>
                        {item.quantity ?? 1}x {item.product_name || item.name || 'Item'}
                      </Text>
                      <Text className="text-gray-900 font-medium ml-4">
                        ${formatAmount(item.unit_price || item.price)}
                      </Text>
                    </View>
                  ))}
                </View>
                <View className="p-5 bg-gray-50">
                  <View className="flex-row justify-between pt-3 border-t border-gray-200">
                    <Text className="font-bold text-gray-900 text-base">Total</Text>
                    <Text className="font-bold text-ess-purple text-base">
                      ${formatAmount(order.total_amount)}
                    </Text>
                  </View>
                </View>
              </View>
            </>
          )}

          {/* No items fallback */}
          {(!order.items || order.items.length === 0) && (
            <View className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6 flex-row justify-between">
              <Text className="text-gray-500 font-medium">Total Amount</Text>
              <Text className="text-gray-900 font-bold">${formatAmount(order.total_amount)}</Text>
            </View>
          )}

          {/* Status Badge */}
          <View className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-10 flex-row items-center">
            <Package size={20} color="#6b7280" />
            <View className="ml-3 flex-1">
              <Text className="text-gray-900 font-medium mb-1">Order Status</Text>
              <StatusBadge status={order.status} />
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}
