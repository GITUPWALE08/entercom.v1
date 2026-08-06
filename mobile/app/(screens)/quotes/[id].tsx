import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, Download, Calendar } from 'lucide-react-native';
import { Card, CardContent } from '../../../src/components/ui/Card';
import { StatusBadge } from '../../../src/components/ui/StatusBadge';
import { Button } from '../../../src/components/ui/Button';

export default function QuoteDetailsScreen() {
  const { id } = useLocalSearchParams();
  
  // Mock quote data based on ID
  const quote = {
    id: id || 'QT-2023-001',
    date: '2023-11-10',
    validUntil: '2023-12-10',
    status: 'completed', // Using 'completed' for 'approved' to match StatusBadge enum
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
      {/* Premium Header */}
      <View className="bg-white pt-16 pb-4 px-7 flex-row items-center justify-between border-b border-gray-100 shadow-sm shadow-black/5 relative z-10">
        <Pressable onPress={() => router.back()} className="p-2 -ml-2 bg-gray-50 rounded-full">
          <ArrowLeft size={24} color="#081f3d" />
        </Pressable>
        <Text className="text-[20px] font-bold text-gray-900 tracking-tight">Quote Details</Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1 px-7 pt-6">
        {/* Header Card */}
        <Card className="mb-8 border-0 p-0 shadow-sm shadow-black/5 overflow-hidden">
          <CardContent className="p-5">
            <View className="flex-row justify-between items-start mb-5 pb-5 border-b border-gray-100">
              <View className="flex-1 pr-4">
                <Text className="text-gray-900 font-bold text-[22px] tracking-tight mb-1">{quote.title}</Text>
                <Text className="text-gray-500 font-medium text-[13px]">{quote.id}</Text>
              </View>
              <StatusBadge status={quote.status} />
            </View>
            
            <View className="flex-row justify-between">
              <View className="flex-row items-center">
                <View className="bg-gray-100 p-2 rounded-[10px] mr-3">
                  <Calendar size={16} color="#6b7280" />
                </View>
                <View>
                  <Text className="text-gray-500 text-[11px] font-bold uppercase tracking-widest mb-0.5">Date Issued</Text>
                  <Text className="text-gray-900 font-bold text-[13px]">{quote.date}</Text>
                </View>
              </View>
              <View className="flex-row items-center">
                <View className="bg-red-50 p-2 rounded-[10px] mr-3">
                  <Calendar size={16} color="#ef4444" />
                </View>
                <View>
                  <Text className="text-gray-500 text-[11px] font-bold uppercase tracking-widest mb-0.5">Valid Until</Text>
                  <Text className="text-red-500 font-bold text-[13px]">{quote.validUntil}</Text>
                </View>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Line Items */}
        <Text className="text-[13px] font-bold text-ess-darkPurple uppercase tracking-widest mb-3 ml-1">Quote Items</Text>
        <Card className="mb-8 border-0 p-0 shadow-sm shadow-black/5 overflow-hidden">
          <View className="p-5 border-b border-gray-100">
            {quote.items.map((item) => (
              <View key={item.id} className="mb-4 last:mb-0">
                <View className="flex-row justify-between mb-1">
                  <Text className="text-gray-900 font-bold text-[15px] tracking-tight flex-1 pr-4">{item.name}</Text>
                  <Text className="text-gray-900 font-extrabold text-[15px]">${(item.price * item.quantity).toFixed(2)}</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-gray-500 text-[13px] font-medium">{item.quantity} x ${item.price.toFixed(2)}</Text>
                  <View className="bg-gray-100 px-2 py-0.5 rounded-md">
                    <Text className="text-gray-600 text-[10px] font-bold uppercase tracking-widest">{item.type}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
          <View className="p-5 bg-ess-softBlue/20">
            <View className="flex-row justify-between mb-3">
              <Text className="text-gray-600 font-medium">Subtotal</Text>
              <Text className="text-gray-900 font-bold">${quote.subtotal.toFixed(2)}</Text>
            </View>
            <View className="flex-row justify-between mb-4">
              <Text className="text-gray-600 font-medium">Tax</Text>
              <Text className="text-gray-900 font-bold">${quote.tax.toFixed(2)}</Text>
            </View>
            <View className="flex-row justify-between pt-4 border-t border-gray-200/60">
              <Text className="font-extrabold text-ess-darkPurple text-[18px]">Total</Text>
              <Text className="font-extrabold text-ess-purple text-[22px] tracking-tight">${quote.total.toFixed(2)}</Text>
            </View>
          </View>
        </Card>

        {/* Notes */}
        <Text className="text-[13px] font-bold text-ess-darkPurple uppercase tracking-widest mb-3 ml-1">Notes & Terms</Text>
        <Card className="mb-10 border-0 shadow-sm shadow-black/5 overflow-hidden">
          <CardContent className="p-5">
            <Text className="text-gray-600 leading-relaxed font-medium text-[14px]">{quote.notes}</Text>
          </CardContent>
        </Card>

        {/* Actions */}
        {quote.status === 'pending' && (
          <View className="flex-row gap-4 mb-12">
            <Button variant="outline" size="lg" className="flex-1 border-gray-200" textClassName="text-gray-600">
              Decline
            </Button>
            <Button variant="primary" size="lg" className="flex-[2] shadow-lg shadow-ess-purple/20">
              Accept & Pay
            </Button>
          </View>
        )}
        
        {quote.status === 'completed' && (
          <View className="mb-12">
            <Button variant="primary" size="lg" className="w-full shadow-lg shadow-ess-purple/20">
              <View className="flex-row items-center justify-center">
                <Download size={20} color="white" className="mr-2" />
                <Text className="text-white font-bold text-[16px] tracking-wide">Download PDF</Text>
              </View>
            </Button>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
