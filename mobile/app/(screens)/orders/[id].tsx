import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, Package, Truck, MapPin, CreditCard, ChevronRight } from 'lucide-react-native';

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams();
  
  // Mock order data based on ID
  const order = {
    id: id || 'ORD-1234',
    date: '2023-10-15 14:30',
    status: 'delivered',
    subtotal: 450.00,
    tax: 49.99,
    total: 499.99,
    shippingAddress: '123 Main St, Anytown, CA 12345',
    paymentMethod: 'Visa ending in 4242',
    items: [
      { id: '1', name: 'Security Camera Pro', price: 250.00, quantity: 1 },
      { id: '2', name: 'Smart Home Hub', price: 200.00, quantity: 1 },
    ],
    trackingEvents: [
      { id: '1', status: 'Delivered', date: 'Oct 18, 10:45 AM', completed: true },
      { id: '2', status: 'Out for delivery', date: 'Oct 18, 07:30 AM', completed: true },
      { id: '3', status: 'Shipped', date: 'Oct 16, 04:15 PM', completed: true },
      { id: '4', status: 'Order processing', date: 'Oct 15, 14:30 PM', completed: true },
    ]
  };

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white pt-16 pb-4 px-6 flex-row items-center justify-between border-b border-gray-100">
        <Pressable onPress={() => router.back()} className="p-2 -ml-2 bg-gray-50 rounded-full">
          <ArrowLeft size={24} color="#1f2937" />
        </Pressable>
        <Text className="text-xl font-bold text-gray-900">Order {order.id}</Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1 p-6">
        {/* Status Card */}
        <View className="bg-blue-600 p-6 rounded-2xl shadow-sm mb-6 flex-row justify-between items-center">
          <View>
            <Text className="text-blue-100 font-medium mb-1">Status</Text>
            <Text className="text-white font-bold text-2xl capitalize">{order.status}</Text>
          </View>
          <View className="bg-white/20 p-4 rounded-full">
            <Package size={32} color="white" />
          </View>
        </View>

        {/* Tracking */}
        <Text className="text-lg font-bold text-gray-900 mb-4 ml-1">Tracking History</Text>
        <View className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6">
          {order.trackingEvents.map((event, index) => (
            <View key={event.id} className="flex-row mb-4 last:mb-0 relative">
              {index !== order.trackingEvents.length - 1 && (
                <View className="absolute left-[11px] top-6 bottom-[-20px] w-0.5 bg-gray-200" />
              )}
              <View className={`w-6 h-6 rounded-full items-center justify-center mr-4 z-10 ${event.completed ? 'bg-blue-600' : 'bg-gray-200 border-2 border-white'}`}>
                {event.completed && <View className="w-2 h-2 bg-white rounded-full" />}
              </View>
              <View className="flex-1 pt-0.5">
                <Text className={`font-bold ${event.completed ? 'text-gray-900' : 'text-gray-400'}`}>{event.status}</Text>
                <Text className="text-gray-500 text-sm mt-0.5">{event.date}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Order Details */}
        <Text className="text-lg font-bold text-gray-900 mb-4 ml-1">Order Summary</Text>
        <View className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <View className="p-5 border-b border-gray-50">
            {order.items.map((item) => (
              <View key={item.id} className="flex-row justify-between mb-3 last:mb-0">
                <Text className="text-gray-700 flex-1" numberOfLines={1}>{item.quantity}x {item.name}</Text>
                <Text className="text-gray-900 font-medium ml-4">${(item.price * item.quantity).toFixed(2)}</Text>
              </View>
            ))}
          </View>
          <View className="p-5 bg-gray-50">
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-500">Subtotal</Text>
              <Text className="text-gray-900">${order.subtotal.toFixed(2)}</Text>
            </View>
            <View className="flex-row justify-between mb-3">
              <Text className="text-gray-500">Tax</Text>
              <Text className="text-gray-900">${order.tax.toFixed(2)}</Text>
            </View>
            <View className="flex-row justify-between pt-3 border-t border-gray-200">
              <Text className="font-bold text-gray-900 text-base">Total</Text>
              <Text className="font-bold text-blue-600 text-base">${order.total.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Shipping & Payment */}
        <Text className="text-lg font-bold text-gray-900 mb-4 ml-1">Information</Text>
        <View className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-10">
          <View className="p-5 flex-row items-start border-b border-gray-50">
            <MapPin size={20} color="#6b7280" className="mr-3 mt-0.5" />
            <View className="flex-1">
              <Text className="text-gray-900 font-medium mb-1">Shipping Address</Text>
              <Text className="text-gray-500">{order.shippingAddress}</Text>
            </View>
          </View>
          <View className="p-5 flex-row items-center">
            <CreditCard size={20} color="#6b7280" className="mr-3" />
            <View className="flex-1">
              <Text className="text-gray-900 font-medium mb-1">Payment Method</Text>
              <Text className="text-gray-500">{order.paymentMethod}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
