import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, Image, ActivityIndicator, SafeAreaView, ScrollView } from 'react-native';
import { AppScrollView } from '../../../src/components/ui/AppScrollView';
import { router } from 'expo-router';
import { Search, ShoppingCart, ChevronRight, Star, Shield, Wifi, Home, Tv, X } from 'lucide-react-native';
import { Card, CardContent } from '../../../src/components/ui/Card';
import { Button } from '../../../src/components/ui/Button';
import { productsApi, ProductItem } from '../../../src/api/products';
import { useCartStore } from '../../../src/store/cartStore';

const featuredBundle = {
  id: 1,
  title: 'Ultimate Smart Home Bundle',
  description: 'Complete security and automation setup for your modern home.',
  price: '$1,299',
  image: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&q=80&w=1000',
};

// const featuredBundle = {
//   id: 1,
//   title: 'Ultimate Smart Home Bundle',
//   description: 'Complete security and automation setup for your modern home.',
//   price: '$1,299',
//   image: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&q=80&w=1000',
// };

const categories = [
  { id: 1, name: 'Security', icon: Shield },
  { id: 2, name: 'Network', icon: Wifi },
  { id: 3, name: 'Smart Home', icon: Home },
  { id: 4, name: 'Audio/Video', icon: Tv },
];

export default function ExploreScreen() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { addItem, items } = useCartStore();
  const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    productsApi.list().then(res => setProducts(res || [])).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory ? (p.category_name || p.category)?.toLowerCase().includes(selectedCategory.toLowerCase()) : true;
    return matchesSearch && matchesCat;
  });

  const trendingList = filteredProducts.slice(0, 5);
  const recommendedList = filteredProducts.slice(5, 10).length > 0 ? filteredProducts.slice(5, 10) : filteredProducts.slice(0, 5);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Premium Header */}
      <View className="flex-row items-center justify-between px-7 pt-4 pb-4 bg-gray-50 z-10">
        <View>
          <Text className="text-[13px] font-bold text-ess-darkPurple uppercase tracking-widest mb-1">Entercom Shop</Text>
          <Text className="text-3xl font-bold text-gray-900 tracking-tight">Explore</Text>
        </View>
        <View className="flex-row space-x-3">
          <Pressable onPress={() => setShowSearch(!showSearch)} className="p-3 bg-white rounded-full border border-gray-100 shadow-sm shadow-black/5">
            <Search size={22} color="#081f3d" />
          </Pressable>
          <Pressable onPress={() => router.push('/(screens)/cart')} className="p-3 bg-white rounded-full border border-gray-100 shadow-sm shadow-black/5 relative">
            <ShoppingCart size={22} color="#081f3d" />
            {cartItemCount > 0 && (
              <View className="absolute top-0 right-0 bg-red-500 rounded-full w-5 h-5 items-center justify-center border-2 border-white">
                <Text className="text-white text-[10px] font-bold">{cartItemCount}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      {showSearch && (
        <View className="px-7 pb-4 bg-gray-50">
          <View className="flex-row items-center bg-white rounded-2xl px-4 py-2 border border-gray-200 shadow-sm shadow-black/5">
            <Search size={20} color="#9ca3af" />
            <TextInput
              className="flex-1 ml-3 text-[16px] text-gray-900 font-medium py-2"
              placeholder="Search products..."
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <X size={20} color="#9ca3af" />
              </Pressable>
            )}
          </View>
        </View>
      )}

      <AppScrollView 
        className="flex-1 px-5" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        
        {/* Featured Hero */}
        <View className="px-7 py-4">
          <Pressable className="rounded-[32px] overflow-hidden bg-ess-darkPurple relative h-80 shadow-lg shadow-ess-purple/20">
            <Image 
              source={{ uri: featuredBundle.image }} 
              className="w-full h-full opacity-60"
              resizeMode="cover"
            />
            {/* Gradient overlay for text readability */}
            <View className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            
            <View className="absolute inset-0 p-6 justify-end">
              <View className="bg-ess-purple/90 self-start px-3 py-1.5 rounded-full mb-3 backdrop-blur-md">
                <Text className="text-white text-[11px] font-bold uppercase tracking-widest">Featured Bundle</Text>
              </View>
              <Text className="text-3xl font-extrabold text-white mb-2 tracking-tight leading-tight">{featuredBundle.title}</Text>
              <Text className="text-indigo-100 text-[15px] mb-5 font-medium leading-relaxed">{featuredBundle.description}</Text>
              
              <View className="flex-row items-center justify-between">
                <Text className="text-2xl font-bold text-white">{featuredBundle.price}</Text>
                <Button variant="primary" className="bg-white" textClassName="text-ess-darkPurple">
                  View Details
                </Button>
              </View>
            </View>
          </Pressable>
        </View>

        {/* Categories */}
        <View className="py-4 mt-2">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 28 }}>
            <Pressable onPress={() => setSelectedCategory(null)} className="items-center mr-6">
              <View className={`w-16 h-16 rounded-[20px] items-center justify-center mb-3 shadow-sm border ${selectedCategory === null ? 'bg-ess-purple border-ess-purple' : 'bg-white border-gray-100 shadow-black/5'}`}>
                <Home size={26} color={selectedCategory === null ? "white" : "#4f46e5"} />
              </View>
              <Text className={`text-[12px] font-bold tracking-wide ${selectedCategory === null ? 'text-ess-purple' : 'text-gray-700'}`}>All</Text>
            </Pressable>
            {categories.map((cat) => (
              <Pressable key={cat.id} onPress={() => setSelectedCategory(cat.name)} className="items-center mr-6">
                <View className={`w-16 h-16 rounded-[20px] items-center justify-center mb-3 shadow-sm border ${selectedCategory === cat.name ? 'bg-ess-purple border-ess-purple' : 'bg-white border-gray-100 shadow-black/5'}`}>
                  <cat.icon size={26} color={selectedCategory === cat.name ? "white" : "#4f46e5"} />
                </View>
                <Text className={`text-[12px] font-bold tracking-wide ${selectedCategory === cat.name ? 'text-ess-purple' : 'text-gray-700'}`}>{cat.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Trending Now */}
        <View className="mt-8">
          <View className="flex-row items-center justify-between px-7 mb-5">
            <Text className="text-[20px] font-bold text-gray-900 tracking-tight">Trending Now</Text>
            <Pressable className="flex-row items-center">
              <Text className="text-[13px] font-bold text-ess-purple mr-1">See All</Text>
              <ChevronRight size={16} color="#4f46e5" />
            </Pressable>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 28 }}>
            {loading ? (
              <ActivityIndicator color="#081f3d" size="large" className="my-10 ml-4" />
            ) : trendingList.map((product) => (
              <Pressable key={product.id} className="w-48 mr-4" onPress={() => router.push(`/(screens)/product/${product.id}`)}>
                <Card className="border-0 p-0 overflow-hidden h-full">
                  {product.images && product.images.length > 0 ? (
                    <Image source={{ uri: product.images[0].image }} className="w-full h-40 bg-gray-100" resizeMode="cover" />
                  ) : (
                    <View className="w-full h-40 bg-gray-100 items-center justify-center">
                       <ShoppingCart size={40} color="#9ca3af" />
                    </View>
                  )}
                  <CardContent className="p-4">
                    <Text className="font-bold text-gray-900 text-[16px] tracking-tight mb-1" numberOfLines={1}>{product.name}</Text>
                    <View className="flex-row items-center mb-3">
                      <Star size={12} color="#f7941d" fill="#f7941d" />
                      <Text className="text-xs font-bold text-gray-500 ml-1.5">4.8</Text>
                    </View>
                    <Text className="font-bold text-ess-purple text-lg">${product.price}</Text>
                  </CardContent>
                </Card>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Recommended for You */}
        <View className="mt-12">
          <View className="flex-row items-center justify-between px-7 mb-5">
            <Text className="text-[20px] font-bold text-gray-900 tracking-tight">Recommended for You</Text>
          </View>
          
          <View className="px-7 space-y-4">
            {loading ? (
              <ActivityIndicator color="#081f3d" size="large" className="my-10" />
            ) : recommendedList.map((product) => (
              <Pressable key={product.id} onPress={() => router.push(`/(screens)/product/${product.id}`)}>
                <Card className="border-0 p-0 overflow-hidden">
                  <View className="flex-row items-center p-3">
                    {product.images && product.images.length > 0 ? (
                      <Image source={{ uri: product.images[0].image }} className="w-28 h-28 rounded-[20px] mr-4 bg-gray-100" resizeMode="cover" />
                    ) : (
                      <View className="w-28 h-28 rounded-[20px] mr-4 bg-gray-100 items-center justify-center">
                        <ShoppingCart size={32} color="#9ca3af" />
                      </View>
                    )}
                    <View className="flex-1 justify-center py-2">
                      <Text className="font-bold text-[17px] tracking-tight text-gray-900 mb-1" numberOfLines={1}>{product.name}</Text>
                      <View className="flex-row items-center mb-3">
                        <Star size={14} color="#f7941d" fill="#f7941d" />
                        <Text className="text-[13px] font-semibold text-gray-500 ml-1.5">4.9 Rating</Text>
                      </View>
                      <View className="flex-row items-center justify-between">
                        <Text className="font-bold text-xl text-ess-purple tracking-tight">${product.price}</Text>
                        <Button variant="outline" size="sm" className="px-4 border-gray-200" onPress={() => addItem(product)}>
                          Add
                        </Button>
                      </View>
                    </View>
                  </View>
                </Card>
              </Pressable>
            ))}
          </View>
        </View>

      </AppScrollView>
    </SafeAreaView>
  );
}
