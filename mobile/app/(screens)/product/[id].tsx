import React, { useState, useEffect } from 'react';
import { LogoLoader } from '../../../src/components/ui/Loader';
import { View, Text, Image, ScrollView, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, ShoppingCart, Star, Minus, Plus } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { productsApi, ProductItem } from '../../../src/api/products';
import { useCartStore } from '../../../src/store/cartStore';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [product, setProduct] = useState<ProductItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { addItem, items } = useCartStore();
  const cartItemCount = items.length;
  const [quantity, setQuantity] = useState(1);

  const fetchProduct = async (isRefresh = false) => {
    if (id) {
      if (!isRefresh) setLoading(true);
      try {
        const res = await productsApi.get(id as string);
        setProduct(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProduct(true);
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <LogoLoader />
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
      <ScrollView 
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#081f3d" />}
      >
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
          
          <View className="flex-row items-center justify-between mb-8">
            <Text className="text-4xl font-extrabold text-ess-purple">${product.price}</Text>
            {product.quantity_available <= 0 ? (
              <View className="bg-red-100 px-3 py-1 rounded-full">
                <Text className="text-red-700 font-bold text-xs uppercase tracking-widest">Out of Stock</Text>
              </View>
            ) : (
              <View className="bg-green-100 px-3 py-1 rounded-full">
                <Text className="text-green-700 font-bold text-xs uppercase tracking-widest">In Stock</Text>
              </View>
            )}
          </View>
          
          <Text className="text-xl font-bold text-gray-900 mb-3">Description</Text>
          <Text className="text-gray-600 leading-relaxed text-[16px] mb-8">
            {product.description || 'This is a premium product designed to meet all your needs. It features high-quality materials and exceptional craftsmanship. Perfect for everyday use.'}
          </Text>
        </View>
      </ScrollView>

      {product.quantity_available > 0 && (
        <View className="px-6 py-4 bg-white border-t border-gray-100 flex-row items-center justify-between">
          <Text className="text-gray-900 font-bold text-[16px]">Quantity</Text>
          <View className="flex-row items-center border border-gray-200 rounded-xl bg-gray-50">
            <Pressable 
              onPress={() => setQuantity(q => Math.max(1, q - 1))}
              className="p-3 bg-white rounded-l-xl"
            >
              <Minus size={18} color="#4b5563" />
            </Pressable>
            <Text className="px-5 font-bold text-[16px] text-gray-900 min-w-[50px] text-center">{quantity}</Text>
            <Pressable 
              onPress={() => setQuantity(q => q + 1)}
              className={`p-3 bg-white rounded-r-xl`}
            >
              <Plus size={18} color="#4b5563" />
            </Pressable>
          </View>
        </View>
      )}

      <View className="p-4 border-t border-gray-100 bg-white flex-row gap-4 pb-8 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <Pressable 
          disabled={product.quantity_available <= 0}
          className={`flex-1 py-4 rounded-[16px] items-center justify-center flex-row shadow-lg ${
            product.quantity_available <= 0 
              ? 'bg-gray-300 shadow-none' 
              : 'bg-ess-purple shadow-ess-purple/30'
          }`}
          onPress={() => {
            addItem(product, quantity);
            router.push('/(screens)/cart');
          }}
        >
          <ShoppingCart size={22} color={product.quantity_available <= 0 ? '#9ca3af' : '#fff'} className="mr-2" />
          <Text className={`font-bold text-[18px] ml-2 ${product.quantity_available <= 0 ? 'text-gray-500' : 'text-white'}`}>
            {product.quantity_available <= 0 ? 'Out of Stock' : 'Add to Cart'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
