import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, KeyboardAvoidingView, Platform, Keyboard, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Send, ShieldAlert, Paperclip, MoreVertical } from 'lucide-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '../../../src/components/ui/Avatar';
import { chatApi, ChatMessage, ChatConversation } from '../../../src/api/chat';
import { useChatWebsocket } from '../../../src/hooks/useChatWebsocket';
import { useAuthStore } from '../../../src/store/authStore';

export default function ChatScreen() {
  const user = useAuthStore((state) => state.user);
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();

  const handleNewMessage = useCallback((msg: ChatMessage) => {
    setMessages(prev => {
      if (prev.some(m => m.id === msg.id)) return prev;
      return [...prev, msg];
    });
  }, []);

  const { isConnected, markRead } = useChatWebsocket({
    conversationId: conversation?.id || null,
    onMessageReceived: handleNewMessage,
  });

  useEffect(() => {
    async function loadConversation() {
      try {
        const convos = await chatApi.list();
        let targetConvo = convos.find(c => c.status !== 'closed' && c.conversation_type === 'support');
        if (!targetConvo) {
          targetConvo = await chatApi.create({
            subject: 'Support Hub',
            conversation_type: 'support'
          });
        }
        setConversation(targetConvo);
        
        const msgsData = await chatApi.getMessages(targetConvo.id);
        setMessages(msgsData.results.reverse()); // Assume API returns latest first
      } catch (err) {
        console.error('Failed to load chat:', err);
      } finally {
        setLoading(false);
      }
    }
    loadConversation();
  }, []);

  const sendMessage = async () => {
    if (inputText.trim().length === 0 || !conversation || sending) return;

    const tempText = inputText.trim();
    setInputText('');
    Keyboard.dismiss();
    setSending(true);

    try {
      const newMsg = await chatApi.sendMessage(conversation.id, tempText);
      handleNewMessage(newMsg);
    } catch (err) {
      console.error(err);
      alert('Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Premium Header */}
      <View className="bg-white px-5 py-4 flex-row items-center justify-between border-b border-gray-100 shadow-sm shadow-black/5 z-10">
        <View className="flex-row items-center">
          <Pressable onPress={() => router.back()} className="p-2 -ml-2 mr-2 bg-gray-50 rounded-full">
            <ArrowLeft size={22} color="#081f3d" />
          </Pressable>
          <View className="flex-row items-center">
            <View className="relative mr-3">
              <Avatar size="sm" fallback="AI" className="bg-ess-darkPurple" />
              <View className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
            </View>
            <View>
              <Text className="text-[17px] font-bold text-gray-900 tracking-tight">Entercom Support</Text>
              <Text className="text-[12px] text-gray-500 font-medium">{isConnected ? 'Connected' : 'Reconnecting...'}</Text>
            </View>
          </View>
        </View>
        <Pressable className="p-2 bg-gray-50 rounded-full">
          <MoreVertical size={20} color="#081f3d" />
        </Pressable>
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          ref={scrollViewRef}
          className="flex-1 px-4" 
          contentContainerStyle={{ paddingTop: 20, paddingBottom: 20 }}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        >
          {/* Trust Badge */}
          <View className="items-center mb-8">
            <View className="bg-ess-softBlue/30 px-4 py-2 rounded-full flex-row items-center">
              <ShieldAlert size={14} color="#0f4c81" className="mr-2" />
              <Text className="text-[11px] font-bold text-ess-darkPurple uppercase tracking-widest">Secure & Encrypted Chat</Text>
            </View>
          </View>

          {/* Chat Bubbles */}
          {messages.map((msg) => {
            const isUser = msg.sender?.id === user?.id;
            return (
              <View 
                key={msg.id} 
                className={`mb-5 max-w-[85%] ${isUser ? 'self-end' : 'self-start'}`}
              >
                <View 
                  className={`p-4 rounded-2xl shadow-sm shadow-black/5 ${
                    isUser 
                      ? 'bg-ess-purple rounded-br-[4px]' 
                      : 'bg-white border border-gray-100 rounded-bl-[4px]'
                  }`}
                >
                  <Text className={`text-[15px] leading-relaxed ${isUser ? 'text-white' : 'text-gray-800'}`}>
                    {msg.body}
                  </Text>
                </View>
                <Text 
                  className={`text-[11px] text-gray-400 font-medium mt-1.5 ${isUser ? 'text-right mr-1' : 'ml-1'}`}
                >
                  {formatTime(msg.created_at)}
                </Text>
              </View>
            );
          })}
        </ScrollView>

        {/* Premium Input Area */}
        <View 
          className="bg-white pt-3 px-4 border-t border-gray-100 shadow-lg shadow-black/10"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
        >
          <View className="flex-row items-end">
            <Pressable className="p-3 mr-1 items-center justify-center rounded-full">
              <Paperclip size={22} color="#9ca3af" />
            </Pressable>
            
            <View className="flex-1 bg-gray-50 rounded-[24px] border border-gray-200 px-4 pt-3 pb-3 mr-2">
              <TextInput
                value={inputText}
                onChangeText={setInputText}
                placeholder="Type your message..."
                placeholderTextColor="#9ca3af"
                multiline
                maxLength={500}
                className="max-h-24 text-[15px] text-gray-900 min-h-[20px]"
                style={{ textAlignVertical: 'top' }}
              />
            </View>
            
            <Pressable 
              onPress={sendMessage}
              disabled={inputText.trim().length === 0 || sending}
              className={`w-12 h-12 rounded-full items-center justify-center shadow-sm ${
                inputText.trim().length > 0 ? 'bg-ess-purple shadow-ess-purple/30' : 'bg-gray-200'
              }`}
            >
              <Send size={18} color={inputText.trim().length > 0 ? "white" : "#9ca3af"} className="ml-1" />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
