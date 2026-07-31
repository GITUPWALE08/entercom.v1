import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, CheckCircle2, CreditCard, MapPin } from 'lucide-react-native';
import { useCartStore } from '../../../src/store/cartStore';

export default function CheckoutScreen() {
  const { items, clearCart } = useCartStore();
  const [step, setStep] = useState(1);
  const [success, setSuccess] = useState(false);
  
  const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.product.price) * item.quantity), 0);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  const handleCompleteOrder = () => {
    // In a real app, integrate payment gateway here
    setTimeout(() => {
      clearCart();
      setSuccess(true);
    }, 1500);
  };

  if (success) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6">
        <View className="bg-emerald-100 p-6 rounded-full mb-6">
          <CheckCircle2 size={64} color="#059669" />
        </View>
        <Text className="text-2xl font-bold text-gray-900 mb-2">Order Confirmed!</Text>
        <Text className="text-gray-500 text-center mb-10 text-base">
          Thank you for your purchase. We have received your order and will process it shortly.
        </Text>
        <Pressable 
          onPress={() => router.replace('/(tabs)/orders')}
          className="w-full bg-blue-600 py-4 rounded-xl items-center mb-4"
        >
          <Text className="text-white font-bold text-lg">View My Orders</Text>
        </Pressable>
        <Pressable 
          onPress={() => router.replace('/(tabs)')}
          className="w-full py-4 rounded-xl items-center bg-gray-50"
        >
          <Text className="text-gray-700 font-bold text-lg">Back to Home</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white pt-16 pb-4 px-6 flex-row items-center justify-between border-b border-gray-100">
        <Pressable onPress={() => router.back()} className="p-2 -ml-2 bg-gray-50 rounded-full">
          <ArrowLeft size={24} color="#1f2937" />
        </Pressable>
        <Text className="text-xl font-bold text-gray-900">Checkout</Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1 p-6">
        <View className="flex-row items-center justify-between mb-8">
          <View className="items-center">
            <View className={`w-8 h-8 rounded-full items-center justify-center ${step >= 1 ? 'bg-blue-600' : 'bg-gray-200'}`}>
              <Text className="text-white font-bold">1</Text>
            </View>
            <Text className="text-xs font-medium mt-2 text-gray-600">Details</Text>
          </View>
          <View className={`flex-1 h-1 mx-2 rounded-full ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
          <View className="items-center">
            <View className={`w-8 h-8 rounded-full items-center justify-center ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}>
              <Text className="text-white font-bold">2</Text>
            </View>
            <Text className="text-xs font-medium mt-2 text-gray-600">Payment</Text>
          </View>
          <View className={`flex-1 h-1 mx-2 rounded-full ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`} />
          <View className="items-center">
            <View className={`w-8 h-8 rounded-full items-center justify-center ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}>
              <Text className="text-white font-bold">3</Text>
            </View>
            <Text className="text-xs font-medium mt-2 text-gray-600">Confirm</Text>
          </View>
        </View>

        {step === 1 && (
          <View>
            <Text className="text-lg font-bold text-gray-900 mb-4 flex-row items-center">
              <MapPin size={20} color="#374151" className="mr-2" /> Billing Information
            </Text>
            <View className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
              <View>
                <Text className="text-gray-700 font-medium mb-1">Full Name</Text>
                <TextInput className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3" placeholder="John Doe" />
              </View>
              <View>
                <Text className="text-gray-700 font-medium mb-1">Email</Text>
                <TextInput className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3" placeholder="john@example.com" keyboardType="email-address" />
              </View>
              <View>
                <Text className="text-gray-700 font-medium mb-1">Address</Text>
                <TextInput className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3" placeholder="123 Main St" />
              </View>
            </View>
            
            <Pressable 
              onPress={() => setStep(2)}
              className="bg-blue-600 py-4 rounded-xl items-center mt-8 shadow-sm"
            >
              <Text className="text-white font-bold text-lg">Continue to Payment</Text>
            </Pressable>
          </View>
        )}

        {step === 2 && (
          <View>
            <Text className="text-lg font-bold text-gray-900 mb-4 flex-row items-center">
              <CreditCard size={20} color="#374151" className="mr-2" /> Payment Method
            </Text>
            <View className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
              <View>
                <Text className="text-gray-700 font-medium mb-1">Card Number</Text>
                <TextInput className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3" placeholder="0000 0000 0000 0000" keyboardType="numeric" />
              </View>
              <View className="flex-row gap-4">
                <View className="flex-1">
                  <Text className="text-gray-700 font-medium mb-1">Expiry Date</Text>
                  <TextInput className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3" placeholder="MM/YY" />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-700 font-medium mb-1">CVC</Text>
                  <TextInput className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3" placeholder="123" keyboardType="numeric" secureTextEntry />
                </View>
              </View>
            </View>
            
            <View className="flex-row gap-4 mt-8">
              <Pressable 
                onPress={() => setStep(1)}
                className="flex-1 bg-gray-200 py-4 rounded-xl items-center"
              >
                <Text className="text-gray-700 font-bold text-lg">Back</Text>
              </Pressable>
              <Pressable 
                onPress={() => setStep(3)}
                className="flex-[2] bg-blue-600 py-4 rounded-xl items-center shadow-sm"
              >
                <Text className="text-white font-bold text-lg">Review Order</Text>
              </Pressable>
            </View>
          </View>
        )}

        {step === 3 && (
          <View className="pb-10">
            <Text className="text-lg font-bold text-gray-900 mb-4">Order Summary</Text>
            <View className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              {items.map((item) => (
                <View key={item.product.id} className="flex-row justify-between mb-3 pb-3 border-b border-gray-50">
                  <Text className="text-gray-700 flex-1" numberOfLines={1}>{item.quantity}x {item.product.name}</Text>
                  <Text className="text-gray-900 font-medium ml-4">${(parseFloat(item.product.price) * item.quantity).toFixed(2)}</Text>
                </View>
              ))}
              <View className="flex-row justify-between mt-2 mb-2">
                <Text className="text-gray-500">Subtotal</Text>
                <Text className="text-gray-900">${subtotal.toFixed(2)}</Text>
              </View>
              <View className="flex-row justify-between mb-4">
                <Text className="text-gray-500">Tax</Text>
                <Text className="text-gray-900">${tax.toFixed(2)}</Text>
              </View>
              <View className="flex-row justify-between pt-4 border-t border-gray-100">
                <Text className="text-lg font-bold text-gray-900">Total</Text>
                <Text className="text-lg font-bold text-blue-600">${total.toFixed(2)}</Text>
              </View>
            </View>
            
            <View className="flex-row gap-4 mt-8">
              <Pressable 
                onPress={() => setStep(2)}
                className="flex-1 bg-gray-200 py-4 rounded-xl items-center"
              >
                <Text className="text-gray-700 font-bold text-lg">Back</Text>
              </Pressable>
              <Pressable 
                onPress={handleCompleteOrder}
                className="flex-[2] bg-green-600 py-4 rounded-xl items-center shadow-sm"
              >
                <Text className="text-white font-bold text-lg">Confirm & Pay</Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
