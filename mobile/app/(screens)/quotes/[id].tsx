import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, FileText, CheckCircle2, Download, Calendar } from 'lucide-react-native';

export default function QuoteDetailsScreen() {
  const { id } = useLocalSearchParams();
  
  // Mock quote data based on ID
  const quote = {
    id: id || 'QT-2023-001',
    date: '2023-11-10',
    validUntil: '2023-12-10',
    status: 'approved',
    title: 'Office Security Installation',
    subtotal: 1100.00,
    tax: 150.00,
    total: 1250.00,
    items: [
      { id: '1', name: '4K Security Camera (Dome)', price: 250.00, quantity: 4, type: 'hardware' },
      { id: '2', name: 'Professional Installation', price: 100.00, quantity: 1, type: 'service' },
    ],
    notes: 'Includes 1-year warranty on all hardware and 30-day labor guarantee. Installation can be scheduled within 3 business days of approval.'
  };

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white pt-16 pb-4 px-6 flex-row items-center justify-between border-b border-gray-100">
        <Pressable onPress={() => router.back()} className="p-2 -ml-2 bg-gray-50 rounded-full">
          <ArrowLeft size={24} color="#1f2937" />
        </Pressable>
        <Text className="text-xl font-bold text-gray-900">Quote Details</Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1 p-6">
        {/* Header Card */}
        <View className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
          <View className="flex-row justify-between items-start mb-4 pb-4 border-b border-gray-50">
            <View className="flex-1 pr-4">
              <Text className="text-gray-900 font-bold text-xl mb-1">{quote.title}</Text>
              <Text className="text-gray-500">{quote.id}</Text>
            </View>
            <View className="bg-green-100 px-3 py-1.5 rounded-full flex-row items-center">
              <CheckCircle2 size={14} color="#166534" />
              <Text className="text-green-800 text-xs font-bold capitalize ml-1">{quote.status}</Text>
            </View>
          </View>
          
          <View className="flex-row justify-between">
            <View className="flex-row items-center">
              <Calendar size={16} color="#6b7280" className="mr-2" />
              <View>
                <Text className="text-gray-500 text-xs">Date Issued</Text>
                <Text className="text-gray-900 font-medium">{quote.date}</Text>
              </View>
            </View>
            <View className="flex-row items-center">
              <Calendar size={16} color="#ef4444" className="mr-2" />
              <View>
                <Text className="text-gray-500 text-xs">Valid Until</Text>
                <Text className="text-red-500 font-medium">{quote.validUntil}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Line Items */}
        <Text className="text-lg font-bold text-gray-900 mb-4 ml-1">Quote Items</Text>
        <View className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <View className="p-5 border-b border-gray-50">
            {quote.items.map((item) => (
              <View key={item.id} className="mb-4 last:mb-0">
                <View className="flex-row justify-between mb-1">
                  <Text className="text-gray-900 font-medium flex-1 pr-4">{item.name}</Text>
                  <Text className="text-gray-900 font-bold">${(item.price * item.quantity).toFixed(2)}</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-gray-500 text-sm">{item.quantity} x ${item.price.toFixed(2)}</Text>
                  <Text className="text-gray-400 text-xs uppercase">{item.type}</Text>
                </View>
              </View>
            ))}
          </View>
          <View className="p-5 bg-gray-50">
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-500">Subtotal</Text>
              <Text className="text-gray-900">${quote.subtotal.toFixed(2)}</Text>
            </View>
            <View className="flex-row justify-between mb-3">
              <Text className="text-gray-500">Tax</Text>
              <Text className="text-gray-900">${quote.tax.toFixed(2)}</Text>
            </View>
            <View className="flex-row justify-between pt-3 border-t border-gray-200">
              <Text className="font-bold text-gray-900 text-lg">Total</Text>
              <Text className="font-bold text-blue-600 text-lg">${quote.total.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Notes */}
        <Text className="text-lg font-bold text-gray-900 mb-4 ml-1">Notes & Terms</Text>
        <View className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-8">
          <Text className="text-gray-600 leading-relaxed">{quote.notes}</Text>
        </View>

        {/* Actions */}
        {quote.status === 'pending' && (
          <View className="flex-row gap-4 mb-10">
            <Pressable className="flex-1 bg-gray-200 py-4 rounded-xl items-center">
              <Text className="text-gray-700 font-bold text-lg">Decline</Text>
            </Pressable>
            <Pressable className="flex-[2] bg-blue-600 py-4 rounded-xl items-center shadow-sm">
              <Text className="text-white font-bold text-lg">Accept & Pay</Text>
            </Pressable>
          </View>
        )}
        
        {quote.status === 'approved' && (
          <Pressable className="w-full bg-gray-900 flex-row py-4 rounded-xl items-center justify-center shadow-sm mb-10">
            <Download size={20} color="white" className="mr-2" />
            <Text className="text-white font-bold text-lg">Download PDF</Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}
