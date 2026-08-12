import React, { useState, useEffect, useCallback } from 'react';
import { LogoLoader } from '../../../src/components/ui/Loader';
import { ListSkeleton } from '../../../src/components/ui/Skeleton';
import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ArrowLeft, Package, Clock, CheckCircle2, ChevronRight, XCircle, AlertCircle } from 'lucide-react-native';
import { ordersApi, OrderItem } from '../../../src/api/orders';
import { ensureArray } from '../../../src/utils/arrays';
import { EmptyState } from '../../../src/components/ui/EmptyState';

export default function OrdersScreen() {
  const {
    data: orders = [],
    isLoading,
    isError,
    error,
    refetch,
    isRefetching
  } = useQuery({
    queryKey: ['orders'],
    queryFn: () => ordersApi.list().then(ensureArray)
  });

  const onRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const getStatusStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
      case 'fulfilled':
      case 'completed':
        return { bg: 'bg-green-100', text: 'text-green-800', icon: <CheckCircle2 size={16} color="#166534" /> };
      case 'processing':
      case 'pending':
      case 'confirmed':
        return { bg: 'bg-blue-100', text: 'text-blue-800', icon: <Clock size={16} color="#1e40af" /> };
      case 'cancelled':
      case 'canceled':
        return { bg: 'bg-red-100', text: 'text-red-800', icon: <XCircle size={16} color="#991b1b" /> };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-800', icon: <Package size={16} color="#1f2937" /> };
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatAmount = (amount?: string | number) => {
    if (!amount) return '0.00';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white pt-16 pb-4 px-6 flex-row items-center justify-between border-b border-gray-100">
        <Pressable onPress={() => router.back()} className="p-2 -ml-2 bg-gray-50 rounded-full">
          <ArrowLeft size={24} color="#1f2937" />
        </Pressable>
        <Text className="text-xl font-bold text-gray-900">My Orders</Text>
        <View className="w-10" />
      </View>

      {isLoading ? (
        <ScrollView className="flex-1">
          <ListSkeleton />
        </ScrollView>
      ) : isError ? (
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor="#081f3d" />}
        >
          <View className="flex-1 items-center justify-center py-20">
            <AlertCircle size={48} color="#ef4444" />
            <Text className="text-red-500 text-center font-medium mt-4 px-8">
              {error instanceof Error ? error.message : 'Failed to load orders. Pull down to retry.'}
            </Text>
          </View>
        </ScrollView>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor="#081f3d" />}
        >
          {orders.length === 0 ? (
            <EmptyState 
              title="No orders yet" 
              description="You haven't placed any orders yet. Start exploring our products!" 
              icon={<Package size={44} color="#6b7280" />}
              action={
                <Pressable
                  onPress={() => router.replace('/(drawer)/(tabs)/requests' as any)}
                  className="bg-ess-purple px-8 py-4 rounded-xl"
                >
                  <Text className="text-white font-bold text-lg">View Requests</Text>
                </Pressable>
              }
            />
          ) : (
            orders.map((item) => {
              const statusStyle = getStatusStyle(item.status);
              return (
                <Pressable
                  key={item.id}
                  onPress={() => router.push(`/(screens)/orders/${item.id}`)}
                  className="bg-white p-5 rounded-2xl mb-4 shadow-sm border border-gray-100"
                >
                  <View className="flex-row justify-between items-center mb-3">
                    <View>
                      <Text className="text-gray-900 font-bold text-lg">
                        #{item.id?.split('-')[0]?.toUpperCase()}
                      </Text>
                      <Text className="text-gray-500 text-sm">{formatDate(item.created_at)}</Text>
                    </View>
                    <View className={`px-3 py-1.5 rounded-full flex-row items-center ${statusStyle.bg}`}>
                      {statusStyle.icon}
                      <Text className={`text-xs font-bold capitalize ml-1 ${statusStyle.text}`}>
                        {item.status?.replace(/_/g, ' ')}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row justify-between items-center pt-3 border-t border-gray-50 mt-1">
                    <View>
                      <Text className="text-gray-500 text-sm">Total</Text>
                      <Text className="text-gray-900 font-bold text-base">
                        ${formatAmount(item.total_amount)}
                      </Text>
                    </View>
                    <View>
                      <Text className="text-gray-500 text-sm">Items</Text>
                      <Text className="text-gray-900 font-bold text-base">
                        {item.items?.length ?? '—'}
                      </Text>
                    </View>
                    <View className="bg-gray-50 p-2 rounded-full">
                      <ChevronRight size={20} color="#6b7280" />
                    </View>
                  </View>
                </Pressable>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}
