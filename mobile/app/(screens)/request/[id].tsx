import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, AlertCircle, FileText, CheckCircle2, Clock, Circle, MessageCircle, CreditCard } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { requestsApi, RequestItem } from '../../../src/api/requests';
import { StatusBadge } from '../../../src/components/ui/StatusBadge';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { supabase } from '../../../src/lib/supabase';
import { Camera, UploadCloud } from 'lucide-react-native';

export default function RequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [request, setRequest] = useState<RequestItem | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [verifying, setVerifying] = useState(false);
  const [verificationPhoto, setVerificationPhoto] = useState<string | null>(null);

  const handlePickVerificationPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setVerifying(true);
        const asset = result.assets[0];
        
        const base64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: 'base64' });
        const filePath = `verifications/${Date.now()}_job_${id}.jpg`;
        
        const { error: uploadError } = await supabase.storage
          .from('entercom-media')
          .upload(filePath, decode(base64), { contentType: 'image/jpeg' });
          
        if (uploadError) throw uploadError;
        
        const { data: publicUrlData } = supabase.storage
          .from('entercom-media')
          .getPublicUrl(filePath);
          
        setVerificationPhoto(publicUrlData.publicUrl);
        setVerifying(false);
      }
    } catch (err) {
      console.error(err);
      // Alert imported implicitly or just use console
      setVerifying(false);
    }
  };

  const handleCompleteJob = async () => {
    if (!verificationPhoto) return;
    try {
      setVerifying(true);
      await requestsApi.submit_verification(id as string, { 
        photos: [verificationPhoto],
        notes: 'Job completed successfully.' 
      });
      fetchRequest();
    } catch (err) {
      console.error(err);
    } finally {
      setVerifying(false);
    }
  };

  const fetchRequest = useCallback(async () => {
    if (!id) return;
    try {
      setError(null);
      const [requestData, timelineData] = await Promise.all([
        requestsApi.get(id),
        requestsApi.timeline(id).catch(() => []), // timeline may not exist for all requests
      ]);
      setRequest(requestData);
      setTimeline(Array.isArray(timelineData) ? timelineData : []);
    } catch (err: any) {
      setError('Failed to load request details. Pull down to retry.');
      console.error('Request detail fetch error:', err);
    }
  }, [id]);

  useEffect(() => {
    fetchRequest().finally(() => setLoading(false));
  }, [fetchRequest]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRequest();
    setRefreshing(false);
  }, [fetchRequest]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
    });
  };

  const getStatusBgColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'resolved': return 'bg-green-600';
      case 'cancelled':
      case 'canceled': return 'bg-red-600';
      case 'in_progress': return 'bg-blue-600';
      default: return 'bg-ess-purple';
    }
  };

  const getTimelineIcon = (eventType?: string) => {
    if (!eventType) return <Circle size={22} color="#d1d5db" />;
    const type = eventType.toLowerCase();
    if (type.includes('complet') || type.includes('resolv') || type.includes('done')) {
      return <CheckCircle2 size={22} color="#16a34a" />;
    }
    if (type.includes('progress') || type.includes('active') || type.includes('assign')) {
      return <Clock size={22} color="#2563eb" />;
    }
    return <Circle size={22} color="#9ca3af" />;
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-5 py-4 border-b border-gray-100">
        <Pressable onPress={() => router.back()} className="mr-4 p-2 -ml-2 bg-gray-50 rounded-full">
          <ArrowLeft size={24} color="#1f2937" />
        </Pressable>
        <Text className="text-xl font-bold flex-1 text-gray-900" numberOfLines={1}>
          Request #{id?.toString().substring(0, 8).toUpperCase()}
        </Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#081f3d" />
          <Text className="text-gray-500 mt-4 font-medium">Loading request...</Text>
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
      ) : !request ? null : (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#081f3d" />}
        >
          {/* Status Card */}
          <View className={`${getStatusBgColor(request.status)} mx-5 mt-5 p-5 rounded-2xl mb-4`}>
            <Text className="text-white/80 font-medium mb-1 text-sm">Current Status</Text>
            <StatusBadge status={request.status} />
            <Text className="text-white/70 text-xs mt-3">
              Last updated: {formatDate(request.updated_at)}
            </Text>
          </View>

          {request.order_id && (
            <Pressable onPress={() => router.push(`/(screens)/orders/${request.order_id}`)} className="mx-5 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-3 flex-row justify-between items-center">
              <View className="flex-row items-center">
                <View className="w-8 h-8 rounded-full bg-blue-50 items-center justify-center">
                  <FileText size={16} color="#0f4c81" />
                </View>
                <Text className="ml-3 font-semibold text-gray-900">View Order Details</Text>
              </View>
              <ArrowLeft size={16} color="#9ca3af" className="rotate-180" />
            </Pressable>
          )}

          {request.payment_id && (
            <Pressable onPress={() => router.push(`/(screens)/payment/${request.payment_id}`)} className="mx-5 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-3 flex-row justify-between items-center">
              <View className="flex-row items-center">
                <View className="w-8 h-8 rounded-full bg-green-50 items-center justify-center">
                  <CreditCard size={16} color="#16a34a" />
                </View>
                <Text className="ml-3 font-semibold text-gray-900">View Payment Details</Text>
              </View>
              <ArrowLeft size={16} color="#9ca3af" className="rotate-180" />
            </Pressable>
          )}

          {/* Request Details */}
          <View className="mx-5 mt-5 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <View className="flex-row items-center mb-4">
              <View className="w-10 h-10 bg-ess-softBlue rounded-[12px] items-center justify-center mr-3">
                <FileText size={20} color="#0f4c81" />
              </View>
              <Text className="text-lg font-bold text-gray-900">Request Details</Text>
            </View>

            <View className="space-y-3">
              {request.service_type && (
                <View className="flex-row justify-between">
                  <Text className="text-gray-500 font-medium">Service Type</Text>
                  <Text className="text-gray-900 font-semibold">{request.service_type}</Text>
                </View>
              )}
              {request.category && (
                <View className="flex-row justify-between">
                  <Text className="text-gray-500 font-medium">Category</Text>
                  <Text className="text-gray-900 font-semibold capitalize">{request.category}</Text>
                </View>
              )}
              {request.priority && (
                <View className="flex-row justify-between">
                  <Text className="text-gray-500 font-medium">Priority</Text>
                  <Text className="text-gray-900 font-semibold capitalize">{request.priority}</Text>
                </View>
              )}
              {request.created_at && (
                <View className="flex-row justify-between">
                  <Text className="text-gray-500 font-medium">Submitted</Text>
                  <Text className="text-gray-900 font-semibold">{formatDate(request.created_at)}</Text>
                </View>
              )}
              {request.address && (
                <View className="mt-1 pt-3 border-t border-gray-100">
                  <Text className="text-gray-500 font-medium mb-1">Address</Text>
                  <Text className="text-gray-900">{request.address}</Text>
                </View>
              )}
              {request.description && (
                <View className="mt-1 pt-3 border-t border-gray-100">
                  <Text className="text-gray-500 font-medium mb-1">Description</Text>
                  <Text className="text-gray-700 leading-relaxed">{request.description}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Technician Completion Verification Panel */}
          {request?.status === 'in_progress' && (
            <View className="mx-5 mt-5 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
              <Text className="text-lg font-bold text-gray-900 mb-4">Job Verification</Text>
              
              {verificationPhoto ? (
                <View className="mb-4 bg-green-50 rounded-xl p-4 flex-row items-center">
                  <CheckCircle2 size={24} color="#16a34a" />
                  <Text className="ml-3 text-green-800 font-semibold flex-1">Photo Uploaded Successfully</Text>
                </View>
              ) : (
                <Pressable 
                  onPress={handlePickVerificationPhoto}
                  disabled={verifying}
                  className="mb-4 bg-gray-50 border border-dashed border-gray-300 rounded-xl p-6 items-center justify-center"
                >
                  {verifying ? (
                    <ActivityIndicator color="#0f4c81" />
                  ) : (
                    <>
                      <Camera size={32} color="#9ca3af" />
                      <Text className="text-gray-600 font-medium mt-3">Upload Completion Photo</Text>
                    </>
                  )}
                </Pressable>
              )}

              <Pressable 
                onPress={handleCompleteJob}
                disabled={verifying || !verificationPhoto}
                className={`p-4 rounded-xl items-center justify-center flex-row shadow-sm ${
                  verificationPhoto ? 'bg-ess-purple' : 'bg-gray-200'
                }`}
              >
                {verifying ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className={`font-bold text-base ${verificationPhoto ? 'text-white' : 'text-gray-400'}`}>
                    Submit & Complete Job
                  </Text>
                )}
              </Pressable>
            </View>
          )}

          {/* Timeline */}
          {timeline.length > 0 && (
            <View className="mx-5 mt-5 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
              <Text className="text-lg font-bold text-gray-900 mb-5">Activity Timeline</Text>
              <View className="pl-1">
                {timeline.map((event: any, index: number) => (
                  <View key={event.id || index} className="flex-row mb-6 relative">
                    {index < timeline.length - 1 && (
                      <View className="absolute left-[11px] top-7 bottom-[-24px] w-0.5 bg-gray-200" />
                    )}
                    <View className="mr-4 bg-white z-10">
                      {getTimelineIcon(event.event_type || event.status)}
                    </View>
                    <View className="flex-1 -mt-0.5">
                      <Text className="font-semibold text-gray-900 text-base">
                        {event.event_type?.replace(/_/g, ' ') || event.title || 'Update'}
                      </Text>
                      {event.description && (
                        <Text className="text-gray-500 text-sm mt-0.5">{event.description}</Text>
                      )}
                      <Text className="text-gray-400 text-xs mt-1">{formatDate(event.created_at)}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Chat CTA */}
          <View className="mx-5 mt-2 mb-10">
            <Pressable
              onPress={() => router.push('/(screens)/chat')}
              className="bg-ess-purple flex-row items-center justify-center p-4 rounded-2xl"
            >
              <MessageCircle size={20} color="white" />
              <Text className="text-white font-bold ml-2 text-base">Chat with Support</Text>
            </Pressable>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
