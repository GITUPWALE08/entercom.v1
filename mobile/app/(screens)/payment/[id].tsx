import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl, Modal, TextInput, Alert, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, CreditCard, AlertCircle, Package, FileText, ChevronRight, Download, ExternalLink, X, ShieldAlert } from 'lucide-react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { paymentsApi, PaymentItem } from '../../../src/api/payments';
import { ordersApi } from '../../../src/api/orders';
import { AppScrollView } from '../../../src/components/ui/AppScrollView';
import { LogoLoader } from '../../../src/components/ui/Loader';
import { downloadReceipt } from '../../../src/utils/receipt';

export default function PaymentDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [payment, setPayment] = useState<PaymentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [downloading, setDownloading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Modals
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [escalateModalVisible, setEscalateModalVisible] = useState(false);
  const [reason, setReason] = useState('');
  const [cancelOrderToo, setCancelOrderToo] = useState(false);

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

  const handleInitializePayment = async () => {
    if (!payment?.order_id) return;
    try {
      setActionLoading(true);
      const callbackUrl = Linking.createURL('payment-complete', { scheme: 'entercom' });
      const response = await paymentsApi.initialize({ 
        order_id: payment.order_id,
        callback_url: callbackUrl
      });
      if (response.authorization_url) {
        await WebBrowser.openAuthSessionAsync(response.authorization_url, callbackUrl);
        const updatedPayment = await paymentsApi.get(id!);
        setPayment(updatedPayment);
        if (updatedPayment.status === 'completed' || updatedPayment.status === 'paid' || updatedPayment.status === 'successful') {
          global.showAppAlert('Payment Successful', 'Your payment was processed successfully.', [
            { text: 'OK', onPress: () => router.replace('/') }
          ]);
        }
      } else {
        global.showAppAlert('Notice', 'Payment already processed or no checkout URL available.');
      }
    } catch (err) {
      global.showAppAlert('Error', 'Failed to initialize payment.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelPayment = async () => {
    try {
      setActionLoading(true);
      await paymentsApi.cancel(id!, reason);
      
      if (cancelOrderToo && payment?.order_id) {
        await ordersApi.cancel(payment.order_id, reason || 'Cancelled with payment');
      }

      setCancelModalVisible(false);
      setReason('');
      setCancelOrderToo(false);
      await fetchPayment();
      global.showAppAlert('Success', 'Payment cancelled.');
    } catch (err) {
      global.showAppAlert('Error', 'Failed to cancel payment.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEscalate = async () => {
    if (!reason.trim()) {
      global.showAppAlert('Error', 'Reason is required for escalation.');
      return;
    }
    try {
      setActionLoading(true);
      await paymentsApi.escalate(id!, reason);
      setEscalateModalVisible(false);
      setReason('');
      await fetchPayment();
      global.showAppAlert('Success', 'Payment escalated to support.');
    } catch (err) {
      global.showAppAlert('Error', 'Failed to escalate payment.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadReceipt = () => {
    if (!payment) return;
    
    global.showAppAlert(
      'Download Receipt',
      'Choose your preferred format',
      [
        { 
          text: 'PDF', 
          onPress: async () => {
            try {
              setDownloading(true);
              await downloadReceipt(payment, 'payment', 'pdf');
            } finally {
              setDownloading(false);
            }
          }
        },
        { 
          text: 'Document (HTML)', 
          onPress: async () => {
            try {
              setDownloading(true);
              await downloadReceipt(payment, 'payment', 'html');
            } finally {
              setDownloading(false);
            }
          }
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'paid':
      case 'success': return 'bg-green-600';
      case 'cancelled':
      case 'failed': return 'bg-red-600';
      default: return 'bg-ess-purple';
    }
  };

  const isPending = payment?.status?.toLowerCase() === 'pending';

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
        <LogoLoader text="Loading payment details..." />
      ) : error ? (
        <AppScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#081f3d" />}
        >
          <View className="flex-1 items-center justify-center py-20">
            <AlertCircle size={48} color="#ef4444" />
            <Text className="text-red-500 text-center font-medium mt-4 px-8">{error}</Text>
          </View>
        </AppScrollView>
      ) : !payment ? null : (
        <AppScrollView
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

          {/* Action Buttons based on state */}
          <View className="space-y-3 mb-6">
            {isPending && (
              <>
                <Pressable 
                  onPress={handleInitializePayment}
                  disabled={actionLoading}
                  className="bg-green-600 p-4 rounded-2xl flex-row justify-center items-center mb-3 shadow-sm shadow-green-600/30"
                >
                  {actionLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <ExternalLink size={20} color="white" />
                      <Text className="text-white font-bold text-[16px] ml-2">Proceed to Payment</Text>
                    </>
                  )}
                </Pressable>

                <Pressable 
                  onPress={() => { setReason(''); setCancelModalVisible(true); }}
                  disabled={actionLoading}
                  className="bg-white border-2 border-red-500 p-4 rounded-2xl flex-row justify-center items-center mb-3"
                >
                  <X size={20} color="#ef4444" />
                  <Text className="text-red-500 font-bold text-[16px] ml-2">Cancel Payment</Text>
                </Pressable>
              </>
            )}

            {!isPending && (
              <Pressable 
            onPress={handleDownloadReceipt}
            disabled={downloading}
            className="flex-row items-center justify-center p-3 border border-gray-200 rounded-xl mt-4"
          >
            {downloading ? (
              <ActivityIndicator size="small" color="#4f46e5" />
            ) : (
              <>
                <FileText size={18} color="#4f46e5" />
                <Text className="ml-2 font-semibold text-ess-purple">Download Receipt</Text>
              </>
            )}
          </Pressable>
            )}

            <Pressable 
              onPress={() => { setReason(''); setEscalateModalVisible(true); }}
              disabled={actionLoading}
              className="bg-orange-50 border border-orange-200 p-4 rounded-2xl flex-row justify-center items-center"
            >
              <ShieldAlert size={20} color="#f97316" />
              <Text className="text-orange-500 font-bold text-[16px] ml-2">Escalate Issue</Text>
            </Pressable>
          </View>

          {/* Related Links */}
          <View className="mb-10">
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
          </View>

        </AppScrollView>
      )}

      {/* Cancel Modal */}
      <Modal visible={cancelModalVisible} transparent animationType="fade">
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="bg-white w-full rounded-3xl p-6 shadow-xl">
            <Text className="text-xl font-bold text-gray-900 mb-2">Cancel Payment</Text>
            <Text className="text-gray-500 mb-4">Are you sure you want to cancel this payment? Please provide a reason.</Text>
            
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-900 mb-4 min-h-[100px]"
              placeholder="Reason for cancellation (optional)"
              multiline
              textAlignVertical="top"
              value={reason}
              onChangeText={setReason}
            />

            <View className="mb-6 space-y-4">
              <Pressable 
                onPress={() => setCancelOrderToo(false)}
                className="flex-row items-start"
              >
                <View className="mt-0.5">
                  {!cancelOrderToo ? <AlertCircle size={20} color="#4f46e5" /> : <View className="w-5 h-5 rounded-full border-2 border-gray-300" />}
                </View>
                <View className="ml-3">
                  <Text className="font-bold text-gray-900">Cancel Payment Only</Text>
                  <Text className="text-gray-500 text-sm">The associated order will remain active.</Text>
                </View>
              </Pressable>

              <Pressable 
                onPress={() => setCancelOrderToo(true)}
                className="flex-row items-start"
              >
                <View className="mt-0.5">
                  {cancelOrderToo ? <AlertCircle size={20} color="#4f46e5" /> : <View className="w-5 h-5 rounded-full border-2 border-gray-300" />}
                </View>
                <View className="ml-3">
                  <Text className="font-bold text-gray-900">Cancel Order & Payment</Text>
                  <Text className="text-gray-500 text-sm">Cancel both this payment and its associated order.</Text>
                </View>
              </Pressable>
            </View>
            
            <View className="flex-row justify-end space-x-3">
              <Pressable 
                className="px-5 py-3 rounded-xl bg-gray-100"
                onPress={() => { setCancelModalVisible(false); setCancelOrderToo(false); }}
              >
                <Text className="text-gray-700 font-medium">Keep It</Text>
              </Pressable>
              <Pressable 
                className="px-5 py-3 rounded-xl bg-red-500"
                onPress={handleCancelPayment}
                disabled={actionLoading}
              >
                {actionLoading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold">Yes, Cancel</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Escalate Modal */}
      <Modal visible={escalateModalVisible} transparent animationType="fade">
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="bg-white w-full rounded-3xl p-6 shadow-xl">
            <Text className="text-xl font-bold text-gray-900 mb-2">Escalate Issue</Text>
            <Text className="text-gray-500 mb-4">Briefly describe the issue you are facing with this payment.</Text>
            
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-900 mb-6 min-h-[100px]"
              placeholder="E.g. I was charged twice..."
              multiline
              textAlignVertical="top"
              value={reason}
              onChangeText={setReason}
            />
            
            <View className="flex-row justify-end space-x-3">
              <Pressable 
                className="px-5 py-3 rounded-xl bg-gray-100"
                onPress={() => setEscalateModalVisible(false)}
              >
                <Text className="text-gray-700 font-medium">Cancel</Text>
              </Pressable>
              <Pressable 
                className={`px-5 py-3 rounded-xl ${reason.trim() ? 'bg-orange-500' : 'bg-orange-300'}`}
                onPress={handleEscalate}
                disabled={actionLoading || !reason.trim()}
              >
                {actionLoading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold">Escalate</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}
