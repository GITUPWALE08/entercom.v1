import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, MessageCircle, Plus, ChevronRight } from 'lucide-react-native';
import { chatApi, ChatConversation } from '../../../src/api/chat';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Avatar } from '../../../src/components/ui/Avatar';
import { EmptyState } from '../../../src/components/ui/EmptyState';

export default function ChatListScreen() {
  const queryClient = useQueryClient();

  const { data: conversations = [], isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const data = await chatApi.list();
      return Array.isArray(data) ? data : data.results || [];
    }
  });

  const createChatMutation = useMutation({
    mutationFn: ({ type, subject }: { type: string, subject: string }) => chatApi.create({
      subject,
      conversation_type: type
    }),
    onSuccess: (newChat) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      router.push(`/(screens)/chat/${newChat.id}`);
    }
  });

  const onRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const handleStartNewChat = () => {
    import('react-native').then(({ Alert }) => {
      global.showAppAlert('Start New Chat', 'What kind of support do you need?', [
        { text: 'General Support', onPress: () => createChatMutation.mutate({ type: 'support', subject: 'Support Hub' }) },
        { text: 'Order Issue', onPress: () => createChatMutation.mutate({ type: 'order', subject: 'Order Support' }) },
        { text: 'Request Enquiry', onPress: () => createChatMutation.mutate({ type: 'request', subject: 'Request Support' }) },
        { text: 'Payment Support', onPress: () => createChatMutation.mutate({ type: 'payment', subject: 'Payment Support' }) },
        { text: 'Cancel', style: 'cancel' }
      ]);
    });
  };

  const renderItem = ({ item }: { item: ChatConversation }) => {
    const isClosed = item.status === 'closed';
    return (
      <Pressable 
        onPress={() => router.push(`/(screens)/chat/${item.id}`)}
        className="flex-row p-4 border-b border-gray-100 bg-white items-center"
      >
        <Avatar size="md" fallback={item.subject?.charAt(0) || 'C'} className="mr-4 bg-ess-softBlue" />
        <View className="flex-1">
          <View className="flex-row justify-between items-start mb-1">
            <Text className="text-base font-bold text-gray-900 pr-2">
              {item.subject || 'Support Chat'}
            </Text>
            <Text className="text-xs text-gray-500 font-medium">
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>
          <View className="flex-row justify-between items-center mt-1">
            <Text className="text-sm text-gray-500" numberOfLines={1}>
              {item.conversation_type === 'support' ? 'Customer Support' : item.conversation_type}
            </Text>
            <View className={`px-2 py-0.5 rounded-full ${isClosed ? 'bg-gray-100' : 'bg-green-100'}`}>
               <Text className={`text-[10px] font-bold uppercase ${isClosed ? 'text-gray-600' : 'text-green-700'}`}>
                 {item.status}
               </Text>
            </View>
          </View>
        </View>
        <ChevronRight size={20} color="#cbd5e1" className="ml-2" />
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
        <Text className="text-xl font-bold text-gray-900 tracking-tight">Messages</Text>
        <Pressable 
          onPress={handleStartNewChat} 
          disabled={createChatMutation.isPending}
          className="bg-ess-purple w-10 h-10 rounded-full items-center justify-center"
        >
          {createChatMutation.isPending ? (
             <ActivityIndicator size="small" color="white" />
          ) : (
             <Plus size={20} color="white" />
          )}
        </Pressable>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0f4c81" />
        </View>
      ) : conversations.length === 0 ? (
        <View className="flex-1 px-6 pt-10">
          <EmptyState
            title="No Conversations"
            description="You don't have any active chats yet."
            icon={<MessageCircle size={44} color="#6b7280" />}
            action={
              <Pressable 
                onPress={handleStartNewChat}
                className="bg-ess-purple px-6 py-4 rounded-xl flex-row items-center justify-center w-full shadow-sm"
              >
                <Text className="text-white font-bold mr-2 text-lg">Start a New Chat</Text>
                <Plus size={20} color="white" />
              </Pressable>
            }
          />
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor="#0f4c81" />
          }
        />
      )}
    </View>
  );
}
