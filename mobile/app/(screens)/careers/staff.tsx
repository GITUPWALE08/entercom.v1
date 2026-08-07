import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Users } from 'lucide-react-native';

export default function StaffCareerScreen() {
  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white pt-16 pb-4 px-6 flex-row items-center justify-between border-b border-gray-100">
        <Pressable onPress={() => router.back()} className="p-2 -ml-2 bg-gray-50 rounded-full">
          <ArrowLeft size={24} color="#1f2937" />
        </Pressable>
        <Text className="text-xl font-bold text-gray-900">Join as Staff</Text>
        <View className="w-10" />
      </View>

      <View className="flex-1 items-center justify-center p-6">
        <View className="bg-indigo-100 p-6 rounded-full mb-6">
          <Users size={64} color="#4338ca" />
        </View>
        <Text className="text-2xl font-bold text-gray-900 mb-2 text-center">Coming Soon</Text>
        <Text className="text-gray-500 text-center text-base">
          Our staff applications are currently closed. Check back later!
        </Text>
      </View>
    </View>
  );
}
