import React, { useState, useRef, useEffect, useCallback } from 'react';
import { LogoLoader } from '../../../src/components/ui/Loader';
import { View, Text, TextInput, ScrollView, Pressable, KeyboardAvoidingView, Platform, Keyboard, ActivityIndicator, Alert, Image } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Send, ShieldAlert, Paperclip, MoreVertical, X, File as FileIcon, Image as ImageIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '../../../src/components/ui/Avatar';
import { chatApi, ChatMessage, ChatConversation } from '../../../src/api/chat';
import { useChatWebsocket } from '../../../src/hooks/useChatWebsocket';
import { useAuthStore } from '../../../src/store/authStore';
import { useLocalSearchParams } from 'expo-router';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [attachment, setAttachment] = useState<{ uri: string, name: string, mimeType: string, type: 'image' | 'document' } | null>(null);
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
        if (!id) return;
        const convos = await chatApi.list();
        let targetConvo = convos.find(c => c.id === id);
        if (!targetConvo) {
           // fallback just in case
           targetConvo = convos[0];
        }
        setConversation(targetConvo);
        
        if (targetConvo) {
          const msgsData = await chatApi.getMessages(targetConvo.id);
          // Sort chronologically (oldest first for normal top-to-bottom scroll view)
          const sorted = [...msgsData.results].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          setMessages(sorted);
        }
      } catch (err) {
        console.error('Failed to load chat:', err);
      } finally {
        setLoading(false);
      }
    }
    loadConversation();
  }, []);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setAttachment({
          uri: asset.uri,
          name: asset.fileName || 'image.jpg',
          mimeType: asset.mimeType || 'image/jpeg',
          type: 'image'
        });
      }
    } catch (error) {
      console.error(error);
      global.showAppAlert('Error', 'Failed to pick image');
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setAttachment({
          uri: asset.uri,
          name: asset.name,
          mimeType: asset.mimeType || 'application/octet-stream',
          type: 'document'
        });
      }
    } catch (error) {
      console.error(error);
      global.showAppAlert('Error', 'Failed to pick document');
    }
  };

  const handleAttachmentPress = () => {
    global.showAppAlert(
      'Attach File',
      'Choose the type of file to attach',
      [
        { text: 'Photo', onPress: pickImage },
        { text: 'Document', onPress: pickDocument },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const sendMessage = async () => {
    if ((inputText.trim().length === 0 && !attachment) || !conversation || sending) return;

    const tempText = inputText.trim();
    const tempAttachment = attachment;
    setInputText('');
    setAttachment(null);
    Keyboard.dismiss();
    setSending(true);

    try {
      const files = tempAttachment ? [{
        uri: tempAttachment.uri,
        name: tempAttachment.name,
        type: tempAttachment.mimeType
      } as any] : [];

      const newMsg = await chatApi.sendMessage(conversation.id, tempText, 'text', files);
      handleNewMessage(newMsg);
    } catch (err) {
      console.error(err);
      global.showAppAlert('Error', 'Failed to send message.');
      setInputText(tempText);
      setAttachment(tempAttachment);
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
        <LogoLoader />
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
              <Text className="text-[17px] font-bold text-gray-900 tracking-tight">{conversation?.subject || 'Chat'}</Text>
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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
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
                  {msg.attachments && msg.attachments.length > 0 && (
                    <View className="mb-2">
                      {msg.attachments.map((att) => (
                        att.file_type?.startsWith('image/') ? (
                          <Image key={att.id} source={{ uri: att.file }} className="w-48 h-48 rounded-lg mb-2 bg-black/10" resizeMode="cover" />
                        ) : (
                          <View key={att.id} className="flex-row items-center bg-black/5 p-2 rounded-lg mb-2">
                            <FileIcon size={20} color={isUser ? "white" : "#0f4c81"} />
                            <Text className={`ml-2 text-sm max-w-[150px] ${isUser ? 'text-white' : 'text-gray-800'}`} numberOfLines={1}>{att.file_name}</Text>
                          </View>
                        )
                      ))}
                    </View>
                  )}
                  {msg.body ? (
                    <Text className={`text-[15px] leading-relaxed ${isUser ? 'text-white' : 'text-gray-800'}`}>
                      {msg.body}
                    </Text>
                  ) : null}
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

        {/* Attachment Preview Area */}
        {attachment && (
          <View className="bg-white px-4 pt-2 flex-row items-center border-t border-gray-100">
            <View className="flex-row items-center bg-gray-100 p-2 rounded-xl flex-1 border border-gray-200 shadow-sm">
              {attachment.type === 'image' ? (
                <Image source={{ uri: attachment.uri }} className="w-12 h-12 rounded-lg mr-3" />
              ) : (
                <View className="w-12 h-12 rounded-lg bg-ess-softBlue items-center justify-center mr-3">
                  <FileIcon size={24} color="#0f4c81" />
                </View>
              )}
              <View className="flex-1">
                <Text className="text-sm font-semibold text-gray-800" numberOfLines={1}>
                  {attachment.name}
                </Text>
                <Text className="text-xs text-gray-500 uppercase mt-0.5">
                  {attachment.type}
                </Text>
              </View>
              <Pressable 
                onPress={() => setAttachment(null)} 
                className="p-2 bg-gray-200 rounded-full ml-2"
              >
                <X size={16} color="#4b5563" />
              </Pressable>
            </View>
          </View>
        )}

        {/* Premium Input Area */}
        <View 
          className="bg-white pt-3 px-4 shadow-lg shadow-black/10"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
        >
          <View className="flex-row items-end">
            <Pressable onPress={handleAttachmentPress} className="p-3 mr-1 items-center justify-center rounded-full">
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
              disabled={(inputText.trim().length === 0 && !attachment) || sending}
              className={`w-12 h-12 rounded-full items-center justify-center shadow-sm ${
                (inputText.trim().length > 0 || attachment) ? 'bg-ess-purple shadow-ess-purple/30' : 'bg-gray-200'
              }`}
            >
              <Send size={18} color={(inputText.trim().length > 0 || attachment) ? "white" : "#9ca3af"} className="ml-1" />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
