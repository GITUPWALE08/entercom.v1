import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Switch } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Briefcase, Upload, CheckCircle2 } from 'lucide-react-native';
import { careersApi } from '../../../src/api/careers';

export default function StaffCareerScreen() {
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    role: '',
    experience: '',
    linkedin: '',
    about: ''
  });

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await careersApi.applyStaff(form);
      setSuccess(true);
    } catch (error) {
      console.error(error);
      alert('Failed to submit application. Please try again.');
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
        <Text className="text-2xl font-bold text-gray-900 mb-2 text-center">Application Submitted!</Text>
        <Text className="text-gray-500 text-center mb-10 text-base">
          Thank you for applying. Our talent acquisition team will review your application and get back to you shortly.
        </Text>
        <Pressable 
          onPress={() => router.back()}
          className="w-full bg-gray-900 py-4 rounded-xl items-center"
        >
          <Text className="text-white font-bold text-lg">Return to Dashboard</Text>
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
        <Text className="text-xl font-bold text-gray-900">Corporate Staff Application</Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1 p-6">
        <View className="bg-gray-100 p-6 rounded-2xl mb-8 border border-gray-200 items-center text-center">
          <View className="w-16 h-16 bg-gray-900 rounded-2xl items-center justify-center mb-4 shadow-sm">
            <Briefcase size={32} color="white" />
          </View>
          <Text className="text-xl font-bold text-gray-900 mb-2">Join our HQ Team</Text>
          <Text className="text-gray-600 text-center">
            Help us build the future of home security. We're looking for driven individuals across Engineering, Product, Marketing, and Support.
          </Text>
        </View>

        <Text className="text-lg font-bold text-gray-900 mb-4 ml-1">Professional Details</Text>
        <View className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6 space-y-4">
          <View>
            <Text className="text-gray-700 font-medium mb-1">Desired Role / Department</Text>
            <TextInput 
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3" 
              placeholder="e.g. Senior Software Engineer" 
              value={form.role}
              onChangeText={(text) => setForm({...form, role: text})}
            />
          </View>
          <View>
            <Text className="text-gray-700 font-medium mb-1">Years of Experience</Text>
            <TextInput 
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3" 
              placeholder="e.g. 8" 
              keyboardType="numeric"
              value={form.experience}
              onChangeText={(text) => setForm({...form, experience: text})}
            />
          </View>
          <View>
            <Text className="text-gray-700 font-medium mb-1">LinkedIn Profile URL</Text>
            <TextInput 
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3" 
              placeholder="https://linkedin.com/in/..." 
              autoCapitalize="none"
              keyboardType="url"
              value={form.linkedin}
              onChangeText={(text) => setForm({...form, linkedin: text})}
            />
          </View>
          <View>
            <Text className="text-gray-700 font-medium mb-1">Cover Letter / About You</Text>
            <TextInput 
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 min-h-[100px]" 
              placeholder="Tell us why you are a great fit..." 
              multiline
              textAlignVertical="top"
              value={form.about}
              onChangeText={(text) => setForm({...form, about: text})}
            />
          </View>
        </View>

        <Text className="text-lg font-bold text-gray-900 mb-4 ml-1">Documents</Text>
        <View className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-10">
          <Pressable className="border-2 border-dashed border-gray-200 rounded-xl p-6 items-center justify-center bg-gray-50">
            <Upload size={28} color="#9ca3af" className="mb-2" />
            <Text className="text-gray-900 font-medium mb-1">Upload Resume</Text>
            <Text className="text-gray-500 text-xs">PDF up to 5MB</Text>
          </Pressable>
        </View>

        <Pressable 
          onPress={handleSubmit}
          disabled={loading}
          className={`py-4 rounded-xl items-center mb-10 shadow-sm ${loading ? 'bg-gray-400' : 'bg-gray-900'}`}
        >
          <Text className="text-white font-bold text-lg">{loading ? 'Submitting...' : 'Submit Application'}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
