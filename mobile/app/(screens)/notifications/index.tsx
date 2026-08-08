import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Bell, CheckCircle2, ChevronRight, MessageSquare, Package, Calendar } from 'lucide-react-native';
import { notificationsApi, Notification } from '../../../src/api/notifications';

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await notificationsApi.getNotifications(0, 50);
      setNotifications(data.results || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchNotifications().finally(() => setLoading(false));
  }, [fetchNotifications]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  }, [fetchNotifications]);

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, status: 'read' })));
    } catch (err) {
      console.error(err);
    }
  };

  const handlePress = async (notification: Notification) => {
    // Actionable part
    if (notification.status !== 'read') {
      try {
        await notificationsApi.markAsRead(notification.id);
        setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, status: 'read' } : n));
      } catch (err) {
        console.error(err);
      }
    }
    
    // Route to appropriate screen based on resource type
    if (notification.resource_type === 'order') {
      router.push(`/(screens)/orders/${notification.resource_id}` as any);
    } else if (notification.resource_type === 'booking') {
      router.push(`/(screens)/bookings/${notification.resource_id}` as any);
    } else if (notification.resource_type === 'request') {
      router.push(`/(screens)/requests/${notification.resource_id}` as any);
    } else if (notification.resource_type === 'chat') {
      router.push(`/(screens)/chat`);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'order': return <Package size={20} color="#4f46e5" />;
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
        <Pressable onPress={handleMarkAllRead} className="w-10 h-10 items-center justify-center">
          <CheckCircle2 size={22} color="#4f46e5" />
        </Pressable>
      </View>

      {loading ? (
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
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4f46e5" />
          }
        />
      )}
    </View>
  );
}
