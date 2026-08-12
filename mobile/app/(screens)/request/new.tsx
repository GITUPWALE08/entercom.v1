import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator, Alert, Switch } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, FileText, CheckCircle2 } from 'lucide-react-native';
import { requestsApi } from '../../../src/api/requests';

export default function CreateRequestScreen() {
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('installation');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [requiresTechnician, setRequiresTechnician] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const categories = [
    { label: 'New Installation', value: 'installation' },
    { label: 'Repair Service', value: 'repair' },
    { label: 'Maintenance', value: 'maintenance' },
    { label: 'Consultation / Quote', value: 'consultation' },
  ];

  const handleSubmit = async () => {
    if (!description || !address || !city || !postalCode) {
      global.showAppAlert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await requestsApi.create({
        category: category,
        description: description,
        requires_technician: requiresTechnician,
        location: {
          address: address,
          city: city,
          postal_code: postalCode
        }
      });
      setSuccess(true);
    } catch (error) {
      global.showAppAlert('Error', 'Failed to create service request');
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
        <Text className="text-2xl font-bold text-gray-900 mb-2">Request Created!</Text>
        <Text className="text-gray-500 text-center mb-10 text-base">
          Your service request has been submitted. Our team will review it shortly.
        </Text>
        <Pressable 
          onPress={() => router.replace('/(drawer)/(tabs)/requests')}
          className="w-full bg-ess-purple py-4 rounded-xl items-center mb-4 shadow-sm shadow-ess-purple/30"
        >
          <Text className="text-white font-bold text-lg">View My Requests</Text>
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
        <Text className="text-xl font-bold text-gray-900">New Request</Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1 p-6">
        <View className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4 mb-8">
          <View>
            <Text className="text-gray-700 font-medium mb-2">Category</Text>
            <View className="flex-row flex-wrap gap-2">
              {categories.map((cat) => (
                <Pressable
                  key={cat.value}
                  onPress={() => setCategory(cat.value)}
                  className={`px-4 py-2 rounded-xl border ${category === cat.value ? 'bg-ess-purple border-ess-purple' : 'bg-gray-50 border-gray-200'}`}
                >
                  <Text className={`font-medium ${category === cat.value ? 'text-white' : 'text-gray-700'}`}>{cat.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          <View>
            <Text className="text-gray-700 font-medium mb-1">Description</Text>
            <TextInput 
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-gray-900 min-h-[120px]" 
              placeholder="Tell us what you need..." 
              multiline
              textAlignVertical="top"
              value={description}
              onChangeText={setDescription}
            />
          </View>

          <View className="h-px bg-gray-100 my-2" />
          <Text className="font-bold text-gray-900 text-base mb-1">Location Details</Text>

          <View>
            <Text className="text-gray-700 font-medium mb-1">Address Line 1</Text>
            <TextInput 
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900" 
              placeholder="E.g. 123 Main St" 
              value={address}
              onChangeText={setAddress}
            />
          </View>

          <View className="flex-row gap-4">
            <View className="flex-1">
              <Text className="text-gray-700 font-medium mb-1">City</Text>
              <TextInput 
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900" 
                placeholder="City" 
                value={city}
                onChangeText={setCity}
              />
            </View>
            <View className="flex-1">
              <Text className="text-gray-700 font-medium mb-1">Postal Code</Text>
              <TextInput 
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900" 
                placeholder="Postal Code" 
                value={postalCode}
                onChangeText={setPostalCode}
              />
            </View>
          </View>

          <View className="h-px bg-gray-100 my-2" />
          
          <View className="flex-row items-center justify-between py-2">
            <View className="flex-1 pr-4">
              <Text className="font-bold text-gray-900 mb-1">Requires Technician</Text>
              <Text className="text-gray-500 text-sm">Check this if you need a professional to visit your location.</Text>
            </View>
            <Switch
              value={requiresTechnician}
              onValueChange={setRequiresTechnician}
              trackColor={{ false: '#d1d5db', true: '#4f46e5' }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        <Pressable 
          onPress={handleSubmit}
          disabled={loading}
          className="bg-ess-purple py-4 rounded-xl items-center shadow-sm flex-row justify-center mb-10 shadow-ess-purple/30"
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <FileText size={20} color="white" className="mr-2" />
              <Text className="text-white font-bold text-lg">Submit Request</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}
