import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, FlatList, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Bell, CheckCircle2, ChevronRight, MessageSquare, Package, Calendar, CreditCard, Archive, Filter } from 'lucide-react-native';
import { notificationsApi, Notification } from '../../../src/api/notifications';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function NotificationsScreen() {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const queryClient = useQueryClient();

  const { data = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await notificationsApi.getNotifications(0, 50);
      return Array.isArray(res) ? res : res.results || [];
    }
  });

  const notifications = filter === 'unread' ? data.filter(n => n.status === 'unread') : data;

  const onRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] })
  });

  const archiveAllMutation = useMutation({
    mutationFn: () => notificationsApi.archiveAll(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] })
  });

  const handleMarkAllRead = () => markAllReadMutation.mutate();
  
  const handleArchiveAll = () => {
    Alert.alert('Archive All', 'Are you sure you want to archive all notifications?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Archive', style: 'destructive', onPress: () => archiveAllMutation.mutate() }
    ]);
  };

  const handlePress = async (notification: Notification) => {
    if (notification.status !== 'read') {
      try {
        await notificationsApi.markAsRead(notification.id);
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      } catch (err) {
        console.error(err);
      }
    }
    
    // Route to appropriate screen based on resource type
    if (!notification.resource_id) {
       return;
    }
    
    if (notification.resource_type === 'order') {
      router.push(`/(screens)/orders/${notification.resource_id}` as any);
    } else if (notification.resource_type === 'request' || notification.resource_type === 'booking') {
      router.push(`/(screens)/request/${notification.resource_id}` as any);
    } else if (notification.resource_type === 'payment' || notification.resource_type === 'invoice') {
      router.push(`/(screens)/payment/${notification.resource_id}` as any);
    } else if (notification.resource_type === 'quote') {
      router.push(`/(screens)/quotes/${notification.resource_id}` as any);
    } else if (notification.resource_type === 'chat') {
      router.push(`/(screens)/chat/${notification.resource_id}` as any);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'order': return <Package size={20} color="#4f46e5" />;
      case 'payment': 
      case 'invoice': return <CreditCard size={20} color="#4f46e5" />;
      case 'booking': return <Calendar size={20} color="#4f46e5" />;
      case 'chat': return <MessageSquare size={20} color="#4f46e5" />;
      default: return <Bell size={20} color="#4f46e5" />;
    }
  };

  const renderItem = ({ item }: { item: Notification }) => {
    const isUnread = item.status === 'unread';
    return (
      <Pressable 
        onPress={() => handlePress(item)}
        className={`flex-row p-4 border-b border-gray-100 ${isUnread ? 'bg-indigo-50/50' : 'bg-white'}`}
      >
        <View className={`w-10 h-10 rounded-full items-center justify-center mr-4 ${isUnread ? 'bg-indigo-100' : 'bg-gray-100'}`}>
          {getIcon(item.resource_type)}
        </View>
        <View className="flex-1">
          <View className="flex-row justify-between items-start mb-1">
            <Text className={`text-base flex-1 pr-2 ${isUnread ? 'font-bold text-gray-900' : 'font-semibold text-gray-800'}`}>
              {item.title}
            </Text>
            <Text className="text-xs text-gray-500 font-medium">
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>
          <Text className={`text-sm ${isUnread ? 'text-gray-700' : 'text-gray-500'}`}>
            {item.message}
          </Text>
          
          {/* Actionable buttons */}
          {isUnread && (
             <View className="mt-3 flex-row gap-2">
               <View className="bg-ess-purple/10 px-3 py-1.5 rounded-lg border border-ess-purple/20">
                 <Text className="text-ess-purple text-xs font-bold uppercase tracking-wider">View Details</Text>
               </View>
             </View>
          )}
        </View>
        {!isUnread && (
           <View className="justify-center ml-2">
             <ChevronRight size={20} color="#cbd5e1" />
           </View>
        )}
      </Pressable>
    );
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="pt-16 pb-4 px-6 flex-row items-center justify-between border-b border-gray-100 bg-white shadow-sm z-10">
        <Pressable onPress={() => router.back()} className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center">
          <ArrowLeft size={20} color="#1f2937" />
        </Pressable>
        <Text className="text-xl font-bold text-gray-900 tracking-tight">Notifications</Text>
        <View className="flex-row items-center gap-2">
          <Pressable onPress={handleArchiveAll} className="bg-gray-50 px-2 py-1.5 rounded-full border border-gray-200">
            <Archive size={18} color="#4b5563" />
          </Pressable>
          <Pressable onPress={handleMarkAllRead} className="bg-indigo-50 px-2 py-1.5 rounded-full border border-indigo-100">
            <CheckCircle2 size={18} color="#4f46e5" />
          </Pressable>
        </View>
      </View>

      {/* Filter Tabs */}
      <View className="flex-row px-6 py-3 bg-gray-50 border-b border-gray-100">
        <Pressable 
          onPress={() => setFilter('all')} 
          className={`mr-3 px-4 py-1.5 rounded-full ${filter === 'all' ? 'bg-gray-900' : 'bg-white border border-gray-200'}`}
        >
          <Text className={`font-bold ${filter === 'all' ? 'text-white' : 'text-gray-600'}`}>All</Text>
        </Pressable>
        <Pressable 
          onPress={() => setFilter('unread')} 
          className={`px-4 py-1.5 rounded-full ${filter === 'unread' ? 'bg-gray-900' : 'bg-white border border-gray-200'}`}
        >
          <Text className={`font-bold ${filter === 'unread' ? 'text-white' : 'text-gray-600'}`}>Unread</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#4f46e5" />
        </View>
      ) : notifications.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-20 h-20 bg-gray-50 rounded-full items-center justify-center mb-4">
            <Bell size={32} color="#9ca3af" />
          </View>
          <Text className="text-lg font-bold text-gray-900 mb-2">No Notifications</Text>
          <Text className="text-gray-500 text-center">You're all caught up! New notifications will appear here.</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor="#4f46e5" />
          }
        />
      )}
    </View>
  );
}
