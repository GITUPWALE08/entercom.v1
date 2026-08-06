import React, { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, ShoppingCart, Star } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { productsApi, ProductItem } from '../../../src/api/products';
import { useCartStore } from '../../../src/store/cartStore';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [product, setProduct] = useState<ProductItem | null>(null);
  const [loading, setLoading] = useState(true);
  const { addItem, items } = useCartStore();
  const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    if (id) {
      productsApi.get(id as string)
        .then(res => setProduct(res))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#4f46e5" />
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center p-4">
        <Text className="text-xl font-bold text-gray-900 mb-4">Product not found</Text>
        <Pressable className="bg-blue-600 px-6 py-3 rounded-xl" onPress={() => router.back()}>
          <Text className="text-white font-bold text-lg">Go Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1">
        <View className="relative">
          {product.images && product.images.length > 0 ? (
            <Image
              source={{ uri: product.images[0].image }}
              className="w-full h-80 bg-gray-100"
              resizeMode="cover"
            />
          ) : (
             <View className="w-full h-80 bg-gray-100 items-center justify-center">
                <ShoppingCart size={64} color="#9ca3af" />
             </View>
          )}
          <Pressable 
            onPress={() => router.back()}
            className="absolute top-4 left-4 bg-white/90 p-2.5 rounded-full shadow-sm"
          >
            <ArrowLeft size={24} color="#081f3d" />
          </Pressable>

          <Pressable 
            onPress={() => router.push('/(screens)/cart')}
            className="absolute top-4 right-4 bg-white/90 p-2.5 rounded-full shadow-sm"
          >
            <ShoppingCart size={24} color="#081f3d" />
            {cartItemCount > 0 && (
              <View className="absolute -top-1 -right-1 bg-red-500 rounded-full w-5 h-5 items-center justify-center border-2 border-white">
                <Text className="text-white text-[10px] font-bold">{cartItemCount}</Text>
              </View>
            )}
          </Pressable>
        </View>

        <View className="p-6">
          <Text className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">{product.name}</Text>
          <View className="flex-row items-center mb-6">
            <Star size={20} color="#fbbf24" fill="#fbbf24" />
            <Text className="ml-1.5 text-gray-600 font-semibold">4.8 (120 reviews)</Text>
          </View>
          
          <Text className="text-4xl font-extrabold text-ess-purple mb-8">${product.price}</Text>
          
          <Text className="text-xl font-bold text-gray-900 mb-3">Description</Text>
          <Text className="text-gray-600 leading-relaxed text-[16px] mb-8">
            {product.description || 'This is a premium product designed to meet all your needs. It features high-quality materials and exceptional craftsmanship. Perfect for everyday use.'}
          </Text>
        </View>
      </ScrollView>

      <View className="p-4 border-t border-gray-100 bg-white flex-row gap-4 pb-8 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <Pressable 
          className="flex-1 bg-ess-purple py-4 rounded-[16px] items-center justify-center flex-row shadow-lg shadow-ess-purple/30"
          onPress={() => {
            addItem(product);
            router.push('/(screens)/cart');
          }}
        >
          <ShoppingCart size={22} color="#fff" className="mr-2" />
          <Text className="text-white font-bold text-[18px] ml-2">Add to Cart</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
