import React from 'react';
import { View, Text, ScrollView, Image, Pressable, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { Search, ShoppingCart, ChevronRight, Star, Shield, Wifi, Home, Tv } from 'lucide-react-native';

const featuredBundle = {
  id: 1,
  title: 'Ultimate Smart Home Bundle',
  description: 'Complete security and automation setup for your modern home.',
  price: '$1,299',
  image: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&q=80&w=1000',
};

const trendingProducts = [
  { id: 1, name: 'Smart Lock Pro', price: '$249', rating: 4.8, image: 'https://images.unsplash.com/photo-1558089687-f282ffcbc126?auto=format&fit=crop&q=80&w=400' },
  { id: 2, name: '4K Security Camera', price: '$199', rating: 4.9, image: 'https://images.unsplash.com/photo-1557438159-51eec7a6c9e8?auto=format&fit=crop&q=80&w=400' },
  { id: 3, name: 'Mesh Wi-Fi System', price: '$299', rating: 4.7, image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&q=80&w=400' },
];

const categories = [
  { id: 1, name: 'Security', icon: Shield },
  { id: 2, name: 'Network', icon: Wifi },
  { id: 3, name: 'Smart Home', icon: Home },
  { id: 4, name: 'Audio/Video', icon: Tv },
];

export default function ExploreScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 pt-4 pb-2 mt-8">
        <View>
          <Text className="text-sm font-medium text-slate-500">Shop</Text>
          <Text className="text-3xl font-bold text-slate-900">Explore</Text>
        </View>
        <View className="flex-row space-x-3">
          <Pressable className="p-3 bg-slate-50 rounded-full border border-slate-100">
            <Search size={22} color="#0f4c81" />
          </Pressable>
          <Pressable onPress={() => router.push('/(screens)/cart')} className="p-3 bg-slate-50 rounded-full border border-slate-100 relative">
            <ShoppingCart size={22} color="#0f4c81" />
            <View className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border border-white" />
          </Pressable>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        
        {/* Featured Hero */}
        <View className="px-6 py-4">
          <Pressable className="rounded-3xl overflow-hidden bg-slate-900 relative h-72">
            <Image 
              source={{ uri: featuredBundle.image }} 
              className="w-full h-full opacity-70"
              resizeMode="cover"
            />
            <View className="absolute inset-0 bg-black/30 p-6 justify-end">
              <View className="bg-white/20 self-start px-3 py-1.5 rounded-full mb-3">
                <Text className="text-white text-xs font-bold uppercase tracking-wider">Featured Bundle</Text>
              </View>
              <Text className="text-3xl font-extrabold text-white mb-2 leading-tight">{featuredBundle.title}</Text>
              <Text className="text-slate-200 text-sm mb-5 leading-relaxed">{featuredBundle.description}</Text>
              <View className="flex-row items-center justify-between">
                <Text className="text-2xl font-bold text-white">{featuredBundle.price}</Text>
                <Pressable className="bg-white px-6 py-3 rounded-full">
                  <Text className="text-slate-900 font-bold">View Details</Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        </View>

        {/* Categories */}
        <View className="py-4">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24 }}>
            {categories.map((cat) => (
              <Pressable key={cat.id} className="items-center mr-6">
                <View className="w-16 h-16 bg-slate-50 rounded-2xl items-center justify-center mb-3 shadow-sm border border-slate-100">
                  <cat.icon size={28} color="#0f4c81" />
                </View>
                <Text className="text-xs font-semibold text-slate-700">{cat.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Trending Now */}
        <View className="mt-6">
          <View className="flex-row items-center justify-between px-6 mb-4">
            <Text className="text-xl font-bold text-slate-900">Trending Now</Text>
            <Pressable className="flex-row items-center">
              <Text className="text-sm font-bold text-blue-600 mr-1">See All</Text>
              <ChevronRight size={16} color="#2563eb" />
            </Pressable>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24 }}>
            {trendingProducts.map((product) => (
              <Pressable key={product.id} className="w-44 mr-4 bg-white rounded-3xl p-3 shadow-sm border border-slate-100">
                <Image 
                  source={{ uri: product.image }} 
                  className="w-full h-36 rounded-2xl mb-3"
                  resizeMode="cover"
                />
                <Text className="font-bold text-slate-900 text-base mb-1" numberOfLines={1}>{product.name}</Text>
                <View className="flex-row items-center justify-between mt-1">
                  <Text className="font-extrabold text-blue-700 text-lg">{product.price}</Text>
                  <View className="flex-row items-center bg-slate-50 px-2 py-1 rounded-md">
                    <Star size={12} color="#eab308" fill="#eab308" />
                    <Text className="text-xs font-bold text-slate-700 ml-1">{product.rating}</Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Recommended for You */}
        <View className="mt-10">
          <View className="flex-row items-center justify-between px-6 mb-4">
            <Text className="text-xl font-bold text-slate-900">Recommended for You</Text>
          </View>
          
          <View className="px-6">
            {trendingProducts.slice().reverse().map((product) => (
              <Pressable key={product.id} className="flex-row items-center bg-white rounded-3xl p-3 mb-4 shadow-sm border border-slate-100">
                <Image 
                  source={{ uri: product.image }} 
                  className="w-28 h-28 rounded-2xl mr-4 bg-slate-100"
                  resizeMode="cover"
                />
                <View className="flex-1 justify-center py-2">
                  <Text className="font-bold text-lg text-slate-900 mb-1">{product.name}</Text>
                  <View className="flex-row items-center mb-3">
                    <Star size={14} color="#eab308" fill="#eab308" />
                    <Text className="text-sm font-semibold text-slate-600 ml-1.5">{product.rating} Rating</Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className="font-extrabold text-xl text-blue-700">{product.price}</Text>
                    <Pressable className="bg-slate-900 px-4 py-2 rounded-full">
                      <Text className="text-white text-xs font-bold">Add to Cart</Text>
                    </Pressable>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
