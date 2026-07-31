import { View, Text, Image, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, ShoppingCart, Star } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1">
        <View className="relative">
          <Image
            source={{ uri: 'https://via.placeholder.com/400' }}
            className="w-full h-80"
            resizeMode="cover"
          />
          <Pressable 
            onPress={() => router.back()}
            className="absolute top-4 left-4 bg-white/80 p-2 rounded-full"
          >
            <ArrowLeft size={24} color="#000" />
          </Pressable>
        </View>

        <View className="p-4">
          <Text className="text-2xl font-bold text-gray-900 mb-2">Premium Product {id}</Text>
          <View className="flex-row items-center mb-4">
            <Star size={20} color="#fbbf24" fill="#fbbf24" />
            <Text className="ml-1 text-gray-600 font-medium">4.8 (120 reviews)</Text>
          </View>
          
          <Text className="text-3xl font-bold text-blue-600 mb-6">$99.99</Text>
          
          <Text className="text-lg font-semibold text-gray-900 mb-2">Description</Text>
          <Text className="text-gray-600 leading-6 mb-6">
            This is a premium product designed to meet all your needs. It features high-quality materials and exceptional craftsmanship. Perfect for everyday use.
          </Text>
        </View>
      </ScrollView>

      <View className="p-4 border-t border-gray-200 bg-white flex-row gap-4">
        <Pressable 
          className="flex-1 bg-blue-600 p-4 rounded-xl items-center justify-center flex-row"
          onPress={() => router.push('/(screens)/cart')}
        >
          <ShoppingCart size={20} color="#fff" className="mr-2" />
          <Text className="text-white font-bold text-lg ml-2">Add to Cart</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
