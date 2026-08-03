import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Image } from 'react-native';
import { ShieldCheck, Calendar, CheckCircle2, ChevronRight, Bell, Clock, FileText, CreditCard, Star, ArrowRight, Package } from 'lucide-react-native';
import { useAuthStore } from '../../../src/store/authStore';
import { router } from 'expo-router';
import { requestsApi } from '../../../src/api/requests';
import { ordersApi } from '../../../src/api/orders';
import { paymentsApi } from '../../../src/api/payments';
import { productsApi } from '../../../src/api/products';
import { ensureArray } from '../../../src/utils/arrays';

export default function HomeScreen() {
  const user = useAuthStore((state) => state.user);

  const [requests, setRequests] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  const [loadingReqs, setLoadingReqs] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    requestsApi.list().then(res => setRequests(ensureArray(res))).catch(console.error).finally(() => setLoadingReqs(false));
    ordersApi.list().then(res => setOrders(ensureArray(res))).catch(console.error).finally(() => setLoadingOrders(false));
    paymentsApi.list().then(res => setPayments(ensureArray(res))).catch(console.error);
    productsApi.list().then(res => setProducts(ensureArray(res))).catch(console.error).finally(() => setLoadingProducts(false));
  }, []);

  const activeRequest = requests.find(r => r.status !== 'completed' && r.status !== 'cancelled');
  const activeRequestsCount = requests.filter(r => r.status !== 'completed' && r.status !== 'cancelled').length;
  const pastRequestsCount = requests.filter(r => r.status === 'completed' || r.status === 'cancelled').length;
  const pendingQuotesCount = requests.filter(r => r.status === 'pending_quote_approval').length;
  const unpaidInvoicesCount = payments.filter(p => p.status === 'pending').length;
  const loyaltyPoints = 1250;
  
  const recentOrder = orders?.[0];
  const recommendedProducts = products.slice(0, 3);

  const formatStatus = (status: string) => {
    if (!status) return 'Unknown';
    return status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <ScrollView className="flex-1 bg-gray-50" showsVerticalScrollIndicator={false}>
      {/* Hero Section */}
      <View className="bg-indigo-600 px-6 pt-16 pb-8 rounded-b-3xl">
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <Text className="text-indigo-100 text-sm font-medium">Welcome back,</Text>
            <Text className="text-white text-2xl font-bold mt-1">
              {user?.firstName || 'Customer'} {user?.lastName || ''}
            </Text>
          </View>
          <Pressable className="bg-indigo-500/30 p-2 rounded-full">
            <Bell size={24} color="white" />
          </Pressable>
        </View>

        <View className="bg-white/10 p-5 rounded-2xl flex-row items-center border border-white/20">
          <ShieldCheck size={32} color="#10b981" />
          <View className="ml-4">
            <Text className="text-white text-lg font-semibold">System Secured</Text>
            <Text className="text-indigo-100 text-sm mt-1">All cameras and sensors active</Text>
          </View>
        </View>
      </View>

      <View className="p-6">
        {/* Metric Cards */}
        <Text className="text-gray-900 text-lg font-bold mb-4">Overview</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-8" contentContainerStyle={{ gap: 12 }}>
          <Pressable onPress={() => router.push('/(screens)/requests')} className="bg-white p-4 rounded-2xl w-36 shadow-sm border border-gray-100 items-center">
            <View className="bg-blue-50 p-3 rounded-full mb-2">
              <Clock size={24} color="#3b82f6" />
            </View>
            <Text className="text-3xl font-bold text-gray-900">{activeRequestsCount}</Text>
            <Text className="text-gray-500 text-xs font-medium text-center mt-1">Active Requests</Text>
          </Pressable>

          <Pressable onPress={() => router.push('/(screens)/requests')} className="bg-white p-4 rounded-2xl w-36 shadow-sm border border-gray-100 items-center">
            <View className="bg-emerald-50 p-3 rounded-full mb-2">
              <CheckCircle2 size={24} color="#10b981" />
            </View>
            <Text className="text-3xl font-bold text-gray-900">{pastRequestsCount}</Text>
            <Text className="text-gray-500 text-xs font-medium text-center mt-1">Past Requests</Text>
          </Pressable>

          <Pressable onPress={() => router.push('/(screens)/quotes')} className="bg-white p-4 rounded-2xl w-36 shadow-sm border border-gray-100 items-center">
            <View className="bg-orange-50 p-3 rounded-full mb-2">
              <FileText size={24} color="#f97316" />
            </View>
            <Text className="text-3xl font-bold text-gray-900">{pendingQuotesCount}</Text>
            <Text className="text-gray-500 text-xs font-medium text-center mt-1">Pending Quotes</Text>
          </Pressable>

          <Pressable onPress={() => router.push('/(screens)/payments')} className="bg-white p-4 rounded-2xl w-36 shadow-sm border border-gray-100 items-center">
            <View className="bg-red-50 p-3 rounded-full mb-2">
              <CreditCard size={24} color="#ef4444" />
            </View>
            <Text className="text-3xl font-bold text-gray-900">{unpaidInvoicesCount}</Text>
            <Text className="text-gray-500 text-xs font-medium text-center mt-1">Unpaid Invoices</Text>
          </Pressable>

          <View className="bg-white p-4 rounded-2xl w-36 shadow-sm border border-gray-100 items-center">
            <View className="bg-purple-50 p-3 rounded-full mb-2">
              <Star size={24} color="#8b5cf6" />
            </View>
            <Text className="text-3xl font-bold text-gray-900">{loyaltyPoints}</Text>
            <Text className="text-gray-500 text-xs font-medium text-center mt-1">Loyalty Points</Text>
          </View>
        </ScrollView>

        {/* Active Request / Quick Action */}
        <Text className="text-gray-900 text-lg font-bold mb-4">Continue where you left off</Text>
        <View className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-8">
          {loadingReqs ? (
            <ActivityIndicator color="#4f46e5" size="small" className="py-4" />
          ) : activeRequest ? (
            <Pressable onPress={() => router.push(`/(screens)/request/${activeRequest.id}`)} className="flex-row items-center justify-between">
              <View className="flex-1 mr-4">
                <View className="bg-blue-100 self-start px-2 py-1 rounded mb-2">
                  <Text className="text-xs font-bold text-blue-700">{formatStatus(activeRequest.status)}</Text>
                </View>
                <Text className="text-gray-900 font-bold text-lg mb-1">{activeRequest.title || 'Service Request'}</Text>
                <Text className="text-gray-500 text-sm">We are reviewing your request details.</Text>
              </View>
              <View className="bg-indigo-600 px-4 py-2 rounded-lg">
                <Text className="text-white font-medium text-sm">View</Text>
              </View>
            </Pressable>
          ) : (
            <View className="items-center py-4">
              <View className="bg-indigo-50 p-3 rounded-full mb-3">
                <ShieldCheck size={28} color="#4f46e5" />
              </View>
              <Text className="text-gray-900 font-bold text-base mb-1">Need an installation or service?</Text>
              <Text className="text-gray-500 text-center text-sm mb-4">Start a new service request and get a quote within 24 hours.</Text>
              <Pressable onPress={() => router.push('/(screens)/requests')} className="bg-indigo-600 px-6 py-3 rounded-xl flex-row items-center">
                <Text className="text-white font-medium mr-2">Create Request</Text>
                <ArrowRight size={16} color="white" />
              </Pressable>
            </View>
          )}
        </View>

        {/* Recent Orders */}
        <Text className="text-gray-900 text-lg font-bold mb-4">Your Installations & Orders</Text>
        <View className="mb-8">
          {loadingOrders ? (
            <ActivityIndicator color="#4f46e5" size="small" />
          ) : recentOrder ? (
            <Pressable onPress={() => router.push(`/(screens)/orders/${recentOrder.id}`)} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex-row justify-between items-center">
              <View>
                <Text className="text-gray-500 text-sm mb-1">Order #{recentOrder.id?.split('-')[0]}</Text>
                <Text className="text-gray-900 font-bold text-lg">${recentOrder.total_amount || '0.00'}</Text>
              </View>
              <View className="items-end">
                <View className="bg-gray-100 px-3 py-1 rounded-full mb-2">
                  <Text className="text-gray-700 text-xs font-bold">{formatStatus(recentOrder.status)}</Text>
                </View>
                <Text className="text-indigo-600 text-sm font-medium">View Details</Text>
              </View>
            </Pressable>
          ) : (
            <View className="bg-gray-50 p-5 rounded-2xl border border-gray-200 items-center">
              <Text className="text-gray-500">You have no recent orders.</Text>
            </View>
          )}
        </View>

        {/* Recommended Products */}
        <Text className="text-gray-900 text-lg font-bold mb-4">Recommended for You</Text>
        <View className="space-y-4 mb-8">
          {loadingProducts ? (
            <ActivityIndicator color="#4f46e5" size="small" />
          ) : recommendedProducts.length > 0 ? (
            recommendedProducts.map(product => (
              <Pressable key={product.id} onPress={() => router.push(`/(screens)/product/${product.id}`)} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex-row items-center mb-3">
                <View className="h-16 w-16 bg-gray-100 rounded-xl overflow-hidden items-center justify-center mr-4">
                  {product.images && product.images.length > 0 ? (
                    <Image source={{ uri: product.images[0].image }} style={{ width: '100%', height: '100%' }} />
                  ) : (
                    <Package size={24} color="#9ca3af" />
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-gray-900 font-bold text-base truncate" numberOfLines={1}>{product.name}</Text>
                  <Text className="text-indigo-600 font-bold mt-1">${product.price}</Text>
                </View>
              </Pressable>
            ))
          ) : (
            <Text className="text-gray-500">No recommendations right now.</Text>
          )}
        </View>

      </View>
    </ScrollView>
  );
}
