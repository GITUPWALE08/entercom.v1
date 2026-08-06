import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Switch } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, GraduationCap, Upload, CheckCircle2 } from 'lucide-react-native';
import { careersApi } from '../../../src/api/careers';

export default function InternshipCareerScreen() {
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    university: '',
    major: '',
    graduationYear: '',
    about: ''
  });

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await careersApi.applyInternship(form);
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
          Thank you for applying for an internship. Our university relations team will review your application and contact you soon.
        </Text>
        <Pressable 
          onPress={() => router.back()}
          className="w-full bg-ess-purple py-4 rounded-xl items-center"
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
        <Text className="text-xl font-bold text-gray-900">Internship Application</Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1 p-6">
        <View className="bg-purple-50 p-6 rounded-2xl mb-8 border border-purple-100 items-center text-center">
          <View className="w-16 h-16 bg-ess-purple rounded-2xl items-center justify-center mb-4 shadow-sm">
            <GraduationCap size={32} color="white" />
          </View>
          <Text className="text-xl font-bold text-gray-900 mb-2">Kickstart your career</Text>
          <Text className="text-gray-600 text-center">
            Join our 12-week summer internship program. Gain hands-on experience in smart home security, software engineering, and sales.
          </Text>
        </View>

        <Text className="text-lg font-bold text-gray-900 mb-4 ml-1">Academic Details</Text>
        <View className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6 space-y-4">
          <View>
            <Text className="text-gray-700 font-medium mb-1">University / College</Text>
            <TextInput 
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3" 
              placeholder="e.g. Stanford University" 
              value={form.university}
              onChangeText={(text) => setForm({...form, university: text})}
            />
          </View>
          <View>
            <Text className="text-gray-700 font-medium mb-1">Major / Field of Study</Text>
            <TextInput 
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3" 
              placeholder="e.g. Computer Science" 
              value={form.major}
              onChangeText={(text) => setForm({...form, major: text})}
            />
          </View>
          <View>
            <Text className="text-gray-700 font-medium mb-1">Expected Graduation Year</Text>
            <TextInput 
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3" 
              placeholder="e.g. 2027" 
              keyboardType="numeric"
              value={form.graduationYear}
              onChangeText={(text) => setForm({...form, graduationYear: text})}
            />
          </View>
          <View>
            <Text className="text-gray-700 font-medium mb-1">Why do you want to join us?</Text>
            <TextInput 
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 min-h-[100px]" 
              placeholder="Tell us what excites you about Entercom..." 
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
            <Text className="text-gray-900 font-medium mb-1">Upload Resume & Transcript</Text>
            <Text className="text-gray-500 text-xs">PDF up to 5MB</Text>
          </Pressable>
        </View>

        <Pressable 
          onPress={handleSubmit}
          disabled={loading}
          className={`py-4 rounded-xl items-center mb-10 shadow-sm ${loading ? 'bg-indigo-300' : 'bg-ess-purple'}`}
        >
          <Text className="text-white font-bold text-lg">{loading ? 'Submitting...' : 'Submit Application'}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
