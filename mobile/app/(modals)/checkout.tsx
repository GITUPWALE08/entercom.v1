import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { X, CreditCard, ChevronRight } from 'lucide-react-native';

export default function CheckoutModal() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-gray-50">
      <View className="flex-row justify-between items-center p-4 bg-white border-b border-gray-200 mt-2">
        <Text className="text-xl font-bold">Checkout</Text>
        <Pressable onPress={() => router.back()} className="p-2 -mr-2">
          <X size={24} color="#000" />
        </Pressable>
      </View>

      <ScrollView className="flex-1 p-4">
        <Text className="font-semibold text-gray-900 mb-3 ml-1">Shipping Address</Text>
        <View className="bg-white p-4 rounded-xl mb-6 shadow-sm">
          <TextInput 
            placeholder="Full Name"
            className="border-b border-gray-200 py-3 mb-2 text-base"
          />
          <TextInput 
            placeholder="Street Address"
            className="border-b border-gray-200 py-3 mb-2 text-base"
          />
          <View className="flex-row gap-4">
            <TextInput 
              placeholder="City"
              className="flex-1 border-b border-gray-200 py-3 mb-2 text-base"
            />
            <TextInput 
              placeholder="ZIP"
              className="flex-1 border-b border-gray-200 py-3 mb-2 text-base"
            />
          </View>
        </View>

        <Text className="font-semibold text-gray-900 mb-3 ml-1">Payment Method</Text>
        <Pressable className="bg-white p-4 rounded-xl flex-row items-center justify-between mb-6 shadow-sm border border-blue-500">
          <View className="flex-row items-center">
            <CreditCard size={24} color="#2563eb" />
            <Text className="ml-3 font-medium text-gray-900">Credit Card</Text>
          </View>
          <ChevronRight size={20} color="#9ca3af" />
        </Pressable>
      </ScrollView>

      <View className="p-4 bg-white border-t border-gray-200 shadow-lg">
        <Pressable 
          className="bg-black p-4 rounded-xl items-center"
          onPress={() => {
            // Dismiss modals on complete
            router.dismissAll();
          }}
        >
          <Text className="text-white font-bold text-lg">Place Order • $107.99</Text>
        </Pressable>
      </View>
    </View>
  );
}
