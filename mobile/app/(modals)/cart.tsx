import { View, Text, ScrollView, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { X, Minus, Plus, Trash2 } from 'lucide-react-native';

export default function CartModal() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-gray-50">
      <View className="flex-row justify-between items-center p-4 bg-white border-b border-gray-200 mt-2">
        <Text className="text-xl font-bold">Your Cart</Text>
        <Pressable onPress={() => router.back()} className="p-2 -mr-2">
          <X size={24} color="#000" />
        </Pressable>
      </View>

      <ScrollView className="flex-1 p-4">
        <View className="bg-white p-4 rounded-xl mb-4 flex-row items-center shadow-sm">
          <Image 
            source={{ uri: 'https://via.placeholder.com/100' }}
            className="w-20 h-20 rounded-lg"
          />
          <View className="flex-1 ml-4">
            <Text className="font-semibold text-lg">Premium Product</Text>
            <Text className="text-blue-600 font-bold mt-1">$99.99</Text>
            
            <View className="flex-row items-center justify-between mt-3">
              <View className="flex-row items-center bg-gray-100 rounded-lg">
                <Pressable className="p-2"><Minus size={16} color="#4b5563" /></Pressable>
                <Text className="px-4 font-semibold">1</Text>
                <Pressable className="p-2"><Plus size={16} color="#4b5563" /></Pressable>
              </View>
              <Pressable className="p-2">
                <Trash2 size={20} color="#ef4444" />
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>

      <View className="p-4 bg-white border-t border-gray-200 shadow-lg">
        <View className="flex-row justify-between mb-2">
          <Text className="text-gray-600">Subtotal</Text>
          <Text className="font-semibold">$99.99</Text>
        </View>
        <View className="flex-row justify-between mb-4">
          <Text className="text-gray-600">Tax</Text>
          <Text className="font-semibold">$8.00</Text>
        </View>
        <View className="flex-row justify-between mb-6">
          <Text className="text-lg font-bold">Total</Text>
          <Text className="text-lg font-bold text-blue-600">$107.99</Text>
        </View>
        
        <Pressable 
          className="bg-blue-600 p-4 rounded-xl items-center"
          onPress={() => router.push('/(modals)/checkout')}
        >
          <Text className="text-white font-bold text-lg">Proceed to Checkout</Text>
        </Pressable>
      </View>
    </View>
  );
}
