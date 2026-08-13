import React from 'react';
import { View, Text, ScrollView, Pressable, Image } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Trash2, Plus, Minus,  ShoppingBag, ShoppingCart } from 'lucide-react-native';
import { useCartStore } from '../../../src/store/cartStore';

export default function CartScreen() {
  const { items, updateQuantity, removeItem } = useCartStore();
  
  const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.product.price) * item.quantity), 0);

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white pt-16 pb-4 px-6 flex-row items-center justify-between border-b border-gray-100">
        <Pressable onPress={() => router.back()} className="p-2 -ml-2 bg-gray-50 rounded-full">
          <ArrowLeft size={24} color="#1f2937" />
        </Pressable>
        <Text className="text-xl font-bold text-gray-900">Your Cart ({items.length})</Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1 px-6 pt-6">
        {items.length === 0 ? (
          <View className="items-center justify-center py-20 mt-10">
            <View className="bg-gray-100 p-6 rounded-full mb-6">
              icon={<ShoppingCart className="w-10 h-10" />}
            </View>
            <Text className="text-xl font-bold text-gray-900 mb-2">Your cart is empty</Text>
            <Text className="text-gray-500 text-center mb-8 px-8">Looks like you haven't added any products or services yet.</Text>
            <Pressable 
              onPress={() => router.replace('/(drawer)/(tabs)/explore' as any)}
              className="bg-ess-purple px-8 py-4 rounded-xl"
            >
              <Text className="text-white font-bold text-lg">Browse Shop</Text>
            </Pressable>
          </View>
        ) : (
          <View className="pb-32">
            {items.map((item) => (
              <View key={item.product.id} className="bg-white p-4 rounded-2xl flex-row mb-4 shadow-sm border border-gray-100">
                <View className="w-24 h-24 bg-gray-100 rounded-xl overflow-hidden justify-center items-center">
                  {item.product.images?.[0]?.image ? (
                    <Image source={{ uri: item.product.images?.[0]?.image }} className="w-full h-full" resizeMode="cover" />
                  ) : (
                    <ShoppingBag size={32} color="#9ca3af" />
                  )}
                </View>
                
                <View className="flex-1 ml-4 justify-between">
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1 pr-2">
                      <Text className="font-semibold text-gray-900" numberOfLines={2}>{item.product.name}</Text>
                      <Text className="text-ess-purple font-bold mt-1">${parseFloat(item.product.price).toFixed(2)}</Text>
                    </View>
                    <Pressable onPress={() => removeItem(item.product.id)} className="p-2 bg-red-50 rounded-lg">
                      <Trash2 size={16} color="#ef4444" />
                    </Pressable>
                  </View>
                  
                  <View className="flex-row items-center mt-2">
                    <Pressable 
                      onPress={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="w-8 h-8 bg-gray-100 rounded-lg items-center justify-center"
                    >
                      <Minus size={16} color="#4b5563" />
                    </Pressable>
                    <Text className="w-10 text-center font-semibold text-gray-900">{item.quantity}</Text>
                    <Pressable 
                      onPress={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="w-8 h-8 bg-ess-softBlue rounded-lg items-center justify-center"
                    >
                      <Plus size={16} color="#0A0F1C" />
                    </Pressable>
                  </View>
                </View>
              </View>
            ))}
            
            <View className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mt-4">
              <Text className="font-bold text-gray-900 text-lg mb-4">Order Summary</Text>
              
              <View className="flex-row justify-between mb-3">
                <Text className="text-gray-500">Subtotal</Text>
                <Text className="text-gray-900 font-medium">${subtotal.toFixed(2)}</Text>
              </View>
              <View className="flex-row justify-between mb-4">
                <Text className="text-gray-500">Tax</Text>
                <Text className="text-gray-900 font-medium">Calculated at checkout</Text>
              </View>
              <View className="h-px bg-gray-100 mb-4" />
              <View className="flex-row justify-between">
                <Text className="font-bold text-gray-900 text-lg">Total</Text>
                <Text className="font-bold text-ess-purple text-lg">${subtotal.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {items.length > 0 && (
        <View className="absolute bottom-0 left-0 right-0 bg-white p-6 border-t border-gray-100">
          <Pressable 
            onPress={() => router.push('/(screens)/checkout')}
            className="bg-ess-purple py-4 rounded-xl items-center shadow-sm"
          >
            <Text className="text-white font-bold text-lg">Proceed to Checkout</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
