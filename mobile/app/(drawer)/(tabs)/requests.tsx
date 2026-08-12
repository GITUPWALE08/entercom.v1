import React, { useState, useEffect, useCallback } from 'react';
import { LogoLoader } from '../../../src/components/ui/Loader';
import { ListSkeleton } from '../../../src/components/ui/Skeleton';
import { ScrollView, View, Text, Pressable, RefreshControl } from 'react-native';
import { AppScrollView } from '../../../src/components/ui/AppScrollView';
import { ClipboardList, ChevronRight, Plus, FileText, Search, Filter } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Input } from '../../../src/components/ui/Input';
import { router } from 'expo-router';
import { Card, CardContent } from '../../../src/components/ui/Card';
import { StatusBadge } from '../../../src/components/ui/StatusBadge';
import { requestsApi, RequestItem } from '../../../src/api/requests';
import { ensureArray } from '../../../src/utils/arrays';
import { EmptyState } from '../../../src/components/ui/EmptyState';

export default function RequestsScreen() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all'|'active'|'completed'>('all');

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

  const filteredRequests = requests.filter(req => {
    // text search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = (req.title || req.service_type || '').toLowerCase().includes(query);
      const matchesCategory = (req.category || '').toLowerCase().includes(query);
      if (!matchesTitle && !matchesCategory) return false;
    }
    
    // status filter
    if (activeFilter === 'active') {
      if (req.status === 'completed' || req.status === 'cancelled') return false;
    } else if (activeFilter === 'completed') {
      if (req.status !== 'completed' && req.status !== 'cancelled') return false;
    }
    
    return true;
  });

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <AppScrollView
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

        {/* Search & Filter */}
        <View className="mb-6">
          <Input 
            placeholder="Search requests..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            leftIcon={<Search size={20} color="#9ca3af" />}
          />
          <View className="flex-row mt-4 gap-2">
            {(['all', 'active', 'completed'] as const).map((f) => (
              <Pressable
                key={f}
                onPress={() => setActiveFilter(f)}
                className={`px-4 py-2 rounded-full border ${activeFilter === f ? 'bg-ess-purple border-ess-purple' : 'bg-white border-gray-200'}`}
              >
                <Text className={`font-semibold capitalize ${activeFilter === f ? 'text-white' : 'text-gray-600'}`}>{f}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {loading ? (
          <View className="mb-24">
            <ListSkeleton />
          </View>
        ) : error ? (
          <View className="items-center justify-center py-20">
            <Text className="text-red-500 text-center font-medium px-8">{error}</Text>
          </View>
        ) : filteredRequests.length === 0 ? (
          <View className="mb-24 pt-10">
            <EmptyState
              title="No matching requests"
              description="Try adjusting your search or filters."
              icon={<Search size={44} color="#6b7280" />}
            />
          </View>
        ) : (
          <View className="mb-24">
            {filteredRequests.map((request) => (
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
      </AppScrollView>

      {/* Floating Action Button */}
      <Pressable
        onPress={() => router.push('/(screens)/request/new')}
        className="absolute bottom-28 right-7 bg-ess-purple w-16 h-16 rounded-[24px] items-center justify-center shadow-lg shadow-ess-purple/40"
      >
        <Plus size={32} color="white" />
      </Pressable>
    </SafeAreaView>
  );
}
