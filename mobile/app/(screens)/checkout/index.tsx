import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert, TouchableOpacity, Modal, FlatList } from 'react-native';
import { ChevronDown, X } from 'lucide-react-native';
import { router } from 'expo-router';
import { ArrowLeft, CheckCircle2, Wrench, Receipt, Circle, CheckCircle } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useCartStore } from '../../../src/store/cartStore';
import { ordersApi } from '../../../src/api/orders';
import { paymentsApi } from '../../../src/api/payments';
import { requestsApi, RequestItem } from '../../../src/api/requests';

export default function CheckoutScreen() {
  const { items, clearCart } = useCartStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // New State mapping to web app
  const [activeRequests, setActiveRequests] = useState<RequestItem[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [selectedRequestId, setSelectedRequestId] = useState<string>('');
  const [requiresTechnician, setRequiresTechnician] = useState<boolean>(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.product.price) * item.quantity), 0);
  const tax = subtotal * 0.1; // Kept only for display if needed, but web sets total = subtotal
  const total = subtotal; // Web checkout calculates Tax at checkout and makes Total = Subtotal for now

  useEffect(() => {
    requestsApi.list()
      .then(res => {
        // Filter out completed or cancelled requests
        const filtered = (res || []).filter((r: any) => r.status !== 'completed' && r.status !== 'cancelled');
        setActiveRequests(filtered);
      })
      .catch(console.error)
      .finally(() => setLoadingRequests(false));
  }, []);

  const handleCompleteOrder = async () => {
    if (items.length === 0) {
      global.showAppAlert('Error', 'Your cart is empty');
      return;
    }

    setLoading(true);
    try {
      const orderData: any = {
        total_amount: total.toFixed(2),
        items: items.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
          price: item.product.price, // Required by some backend endpoints even if web doesn't send it
        })),
      };
      
      // Attach service request or requires_technician like the web app
      if (selectedRequestId) {
        orderData.request_id = selectedRequestId;
      } else {
        orderData.requires_technician = requiresTechnician;
      }
      
      const order = await ordersApi.create(orderData);
      
      if (order && order.id) {
        const callbackUrl = Linking.createURL('payment-complete', { scheme: 'entercom' });
        const paymentRes = await paymentsApi.initialize({ 
          order_id: order.id,
          callback_url: callbackUrl
        });
        
        if (paymentRes.authorization_url) {
          clearCart(); // Clear cart just like web before redirecting
          const result = await WebBrowser.openAuthSessionAsync(
            paymentRes.authorization_url,
            callbackUrl
          );
          
          // Regardless of success/dismissal, rely on backend webhook for truth.
          // Send user to order details screen to poll/view actual status.
          router.replace(`/(screens)/orders/${order.id}`);
          return;
        } else {
          // If no auth URL (e.g. zero amount or mock), just go to order directly
          clearCart();
          router.replace(`/(screens)/orders/${order.id}`);
          return;
        }
      }
      
      // Fallback if order creation somehow didn't return an id (unlikely)
      clearCart();
      router.replace('/(screens)/orders');
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Unable to complete your order. Please try again.';
      global.showAppAlert('Checkout Failed', errMsg);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6">
        <View className="bg-emerald-100 p-6 rounded-full mb-6">
          <CheckCircle2 size={64} color="#059669" />
        </View>
        <Text className="text-2xl font-bold text-gray-900 mb-2">Order Created!</Text>
        <Text className="text-gray-500 text-center mb-10 text-base">
          You are being redirected to Paystack. If you didn't finish the payment, you can do so from your Orders.
        </Text>
        <Pressable 
          onPress={() => router.replace('/(drawer)/(tabs)/orders' as any)}
          className="w-full bg-ess-purple py-4 rounded-xl items-center mb-4"
        >
          <Text className="text-white font-bold text-lg">View My Orders</Text>
        </Pressable>
        <Pressable 
          onPress={() => router.replace('/(drawer)/(tabs)/' as any)}
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
        <View className="flex-row items-center justify-center mb-8 px-4">
          <View className="items-center">
            <View className={`w-8 h-8 rounded-full items-center justify-center ${step >= 1 ? 'bg-ess-purple' : 'bg-gray-200'}`}>
              <Text className="text-white font-bold">1</Text>
            </View>
            <Text className="text-xs font-medium mt-2 text-gray-600">Service Options</Text>
          </View>
          <View className={`w-24 h-1 mx-2 rounded-full ${step >= 2 ? 'bg-ess-purple' : 'bg-gray-200'}`} />
          <View className="items-center">
            <View className={`w-8 h-8 rounded-full items-center justify-center ${step >= 2 ? 'bg-ess-purple' : 'bg-gray-200'}`}>
              <Text className="text-white font-bold">2</Text>
            </View>
            <Text className="text-xs font-medium mt-2 text-gray-600">Review & Pay</Text>
          </View>
        </View>

        {step === 1 && (
          <View>
            <Text className="text-lg font-bold text-gray-900 mb-2 flex-row items-center">
              <Wrench size={20} color="#374151" className="mr-2" /> Service Request Attachment
            </Text>
            <Text className="text-gray-500 mb-6 text-sm">
              If you are buying hardware for a specific installation, please select the active service request below. (Optional)
            </Text>

            <View className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4 mb-8">
              {loadingRequests ? (
                <View className="py-4 items-center justify-center">
                  <ActivityIndicator color="#0A0F1C" />
                </View>
              ) : (
                <View>
                  <TouchableOpacity 
                    onPress={() => setIsDropdownOpen(true)}
                    className="flex-row items-center justify-between p-4 border border-gray-200 rounded-xl bg-gray-50"
                  >
                    <View className="flex-1">
                      {selectedRequestId === '' ? (
                        <Text className="font-medium text-gray-700">No request (Direct Purchase)</Text>
                      ) : (
                        <View>
                          <Text className="font-medium text-ess-purple">
                            {activeRequests.find(r => r.id === selectedRequestId)?.title || activeRequests.find(r => r.id === selectedRequestId)?.service_type?.replace('_', ' ')}
                          </Text>
                          <Text className="text-gray-500 text-xs mt-1">
                            {activeRequests.find(r => r.id === selectedRequestId)?.address || 'No location specified'}
                          </Text>
                        </View>
                      )}
                    </View>
                    <ChevronDown size={20} color="#9ca3af" />
                  </TouchableOpacity>

                  <Modal visible={isDropdownOpen} animationType="slide" transparent={true}>
                    <View className="flex-1 justify-end bg-black/50">
                      <View className="bg-white rounded-t-3xl h-[60%]">
                        <View className="flex-row justify-between items-center p-6 border-b border-gray-100">
                          <Text className="text-lg font-bold text-gray-900">Select Service Request</Text>
                          <TouchableOpacity onPress={() => setIsDropdownOpen(false)}>
                            <X size={24} color="#9ca3af" />
                          </TouchableOpacity>
                        </View>
                        
                        <FlatList
                          data={[{ id: '' } as any, ...activeRequests]}
                          keyExtractor={(item) => item.id || 'none'}
                          contentContainerStyle={{ padding: 24 }}
                          renderItem={({ item: req }) => (
                            <TouchableOpacity 
                              onPress={() => {
                                setSelectedRequestId(req.id);
                                setIsDropdownOpen(false);
                              }}
                              className={`flex-row items-center p-4 border rounded-xl mb-3 ${selectedRequestId === req.id ? 'border-ess-purple bg-ess-purple/5' : 'border-gray-200 bg-gray-50'}`}
                            >
                              {selectedRequestId === req.id ? <CheckCircle color="#0A0F1C" size={20} className="mr-3" /> : <Circle color="#9ca3af" size={20} className="mr-3" />}
                              <View className="flex-1">
                                {req.id === '' ? (
                                  <Text className={`font-medium ${selectedRequestId === '' ? 'text-ess-purple' : 'text-gray-700'}`}>
                                    No request (Direct Purchase)
                                  </Text>
                                ) : (
                                  <>
                                    <Text className={`font-medium ${selectedRequestId === req.id ? 'text-ess-purple' : 'text-gray-700'}`}>
                                      {req.title || req.service_type?.replace('_', ' ')}
                                    </Text>
                                    <View className="flex-row items-center mt-1">
                                      <Text className="text-xs text-gray-500 mr-2 capitalize">
                                        {req.status.replace('_', ' ')}
                                      </Text>
                                      <Text className="text-xs text-gray-400" numberOfLines={1}>
                                        • {req.address || 'No location'}
                                      </Text>
                                    </View>
                                  </>
                                )}
                              </View>
                            </TouchableOpacity>
                          )}
                        />
                      </View>
                    </View>
                  </Modal>
                </View>
              )}
            </View>

            {/* Requires Technician Checkbox (Only if no request is selected) */}
            {selectedRequestId === '' && (
              <TouchableOpacity 
                onPress={() => setRequiresTechnician(!requiresTechnician)}
                className="flex-row items-center bg-gray-50 p-5 rounded-xl border border-gray-200 mb-8"
              >
                {requiresTechnician ? (
                  <CheckCircle2 color="#0A0F1C" size={24} className="mr-3" />
                ) : (
                  <Circle color="#9ca3af" size={24} className="mr-3" />
                )}
                <Text className="text-gray-700 font-medium flex-1">
                  Do you need a technician to help with installation or setup for these items?
                </Text>
              </TouchableOpacity>
            )}
            
            <Pressable 
              onPress={() => setStep(2)}
              className="bg-ess-purple py-4 rounded-xl items-center shadow-sm"
            >
              <Text className="text-white font-bold text-lg">Continue to Summary</Text>
            </Pressable>
          </View>
        )}

        {step === 2 && (
          <View className="pb-10">
            <Text className="text-lg font-bold text-gray-900 mb-4 flex-row items-center">
              <Receipt size={20} color="#374151" className="mr-2" /> Order Summary
            </Text>
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
                <Text className="text-gray-900">Calculated at checkout</Text>
              </View>
              <View className="flex-row justify-between pt-4 border-t border-gray-100">
                <Text className="text-lg font-bold text-gray-900">Total</Text>
                <Text className="text-lg font-bold text-ess-purple">${total.toFixed(2)}</Text>
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
                onPress={handleCompleteOrder}
                disabled={loading}
                className="flex-[2] bg-ess-purple py-4 rounded-xl items-center shadow-sm flex-row justify-center"
              >
                {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Pay with Paystack</Text>}
              </Pressable>
            </View>
            <Text className="text-center text-xs text-gray-400 mt-4">You will be redirected to Paystack securely.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
