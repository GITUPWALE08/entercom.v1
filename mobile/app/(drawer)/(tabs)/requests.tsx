import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { ClipboardList, ChevronRight, Plus, FileText } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Card, CardContent } from '../../../src/components/ui/Card';
import { StatusBadge } from '../../../src/components/ui/StatusBadge';
import { requestsApi, RequestItem } from '../../../src/api/requests';
import { ensureArray } from '../../../src/utils/arrays';

export default function RequestsScreen() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    try {
      setError(null);
      const data = await requestsApi.list();
      setRequests(ensureArray(data));
    } catch (err: any) {
      setError('Failed to load requests. Pull down to retry.');
      console.error('Requests fetch error:', err);
    }
  }, []);

  useEffect(() => {
    fetchRequests().finally(() => setLoading(false));
  }, [fetchRequests]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRequests();
    setRefreshing(false);
  }, [fetchRequests]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1 px-7 pt-10"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#081f3d" />}
      >
        <View className="mb-8 flex-row items-center justify-between">
          <View>
            <Text className="text-[13px] font-bold text-ess-darkPurple uppercase tracking-widest mb-1">Entercom Support</Text>
            <Text className="text-3xl font-bold text-gray-900 tracking-tight">Service Requests</Text>
          </View>
          <View className="bg-white p-3 rounded-[16px] shadow-sm shadow-black/5 border border-gray-100">
            <ClipboardList size={24} color="#4f46e5" />
          </View>
        </View>

        {loading ? (
          <View className="items-center justify-center py-20">
            <ActivityIndicator size="large" color="#081f3d" />
            <Text className="text-gray-500 mt-4 font-medium">Loading requests...</Text>
          </View>
        ) : error ? (
          <View className="items-center justify-center py-20">
            <Text className="text-red-500 text-center font-medium px-8">{error}</Text>
          </View>
        ) : requests.length === 0 ? (
          <View className="items-center justify-center py-20">
            <View className="bg-ess-softBlue p-6 rounded-full mb-6">
              <ClipboardList size={48} color="#0f4c81" />
            </View>
            <Text className="text-xl font-bold text-gray-900 mb-2">No requests yet</Text>
            <Text className="text-gray-500 text-center px-8 font-medium mb-2">
              Tap the + button to submit your first service request.
            </Text>
          </View>
        ) : (
          <View className="mb-24">
            {requests.map((request) => (
              <Pressable
                key={request.id}
                onPress={() => router.push(`/(screens)/request/${request.id}`)}
              >
                <Card className="mb-5 border-0 p-0 shadow-sm shadow-black/5 overflow-hidden">
                  <CardContent className="p-5">
                    <View className="flex-row justify-between items-start mb-4">
                      <View className="flex-row items-center flex-1">
                        <View className="w-12 h-12 bg-ess-softBlue rounded-[16px] items-center justify-center mr-4 shadow-sm shadow-black/5">
                          <FileText size={22} color="#0f4c81" />
                        </View>
                        <View className="flex-1 pr-2">
                          <Text className="text-[17px] font-bold text-gray-900 tracking-tight" numberOfLines={1}>
                            {request.title || request.service_type || 'Service Request'}
                          </Text>
                          <Text className="text-gray-500 text-[13px] mt-0.5 font-medium">
                            {request.category || 'General'} • {formatDate(request.created_at)}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View className="flex-row justify-between items-center pt-3 border-t border-gray-100">
                      <StatusBadge status={request.status} />
                      <View className="bg-gray-50 p-2 rounded-full">
                        <ChevronRight size={16} color="#0f4c81" />
                      </View>
                    </View>
                  </CardContent>
                </Card>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <Pressable
        onPress={() => router.push('/(screens)/requests')}
        className="absolute bottom-8 right-7 bg-ess-purple w-16 h-16 rounded-[24px] items-center justify-center shadow-lg shadow-ess-purple/40"
      >
        <Plus size={32} color="white" />
      </Pressable>
    </SafeAreaView>
  );
}
