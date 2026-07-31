import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Switch } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Wrench, Briefcase, FileText, Upload, CheckCircle2 } from 'lucide-react-native';

export default function TechnicianCareerScreen() {
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    experience: '',
    certifications: '',
    availability: false,
    about: ''
  });

  const handleSubmit = () => {
    // Submit logic
    setSuccess(true);
  };

  if (success) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6">
        <View className="bg-emerald-100 p-6 rounded-full mb-6">
          <CheckCircle2 size={64} color="#059669" />
        </View>
        <Text className="text-2xl font-bold text-gray-900 mb-2 text-center">Application Submitted!</Text>
        <Text className="text-gray-500 text-center mb-10 text-base">
          Thank you for applying to be a technician. Our team will review your application and get back to you within 3-5 business days.
        </Text>
        <Pressable 
          onPress={() => router.back()}
          className="w-full bg-blue-600 py-4 rounded-xl items-center"
        >
          <Text className="text-white font-bold text-lg">Return to Profile</Text>
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
        <Text className="text-xl font-bold text-gray-900">Join as Technician</Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1 p-6">
        <View className="bg-blue-50 p-6 rounded-2xl mb-8 border border-blue-100 items-center text-center">
          <View className="w-16 h-16 bg-blue-600 rounded-2xl items-center justify-center mb-4 shadow-sm">
            <Briefcase size={32} color="white" />
          </View>
          <Text className="text-xl font-bold text-gray-900 mb-2">Build your career with us</Text>
          <Text className="text-gray-600 text-center">
            Join our network of elite security and smart home technicians. Access exclusive jobs, flexible hours, and competitive pay.
          </Text>
        </View>

        <Text className="text-lg font-bold text-gray-900 mb-4 ml-1">Professional Details</Text>
        <View className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6 space-y-4">
          <View>
            <Text className="text-gray-700 font-medium mb-1">Years of Experience</Text>
            <TextInput 
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3" 
              placeholder="e.g. 5" 
              keyboardType="numeric"
              value={form.experience}
              onChangeText={(text) => setForm({...form, experience: text})}
            />
          </View>
          <View>
            <Text className="text-gray-700 font-medium mb-1">Certifications (Optional)</Text>
            <TextInput 
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3" 
              placeholder="e.g. CompTIA, CEDIA" 
              value={form.certifications}
              onChangeText={(text) => setForm({...form, certifications: text})}
            />
          </View>
          <View>
            <Text className="text-gray-700 font-medium mb-1">About You & Your Skills</Text>
            <TextInput 
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 min-h-[100px]" 
              placeholder="Tell us about your background..." 
              multiline
              textAlignVertical="top"
              value={form.about}
              onChangeText={(text) => setForm({...form, about: text})}
            />
          </View>
        </View>

        <Text className="text-lg font-bold text-gray-900 mb-4 ml-1">Documents</Text>
        <View className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6">
          <Pressable className="border-2 border-dashed border-gray-200 rounded-xl p-6 items-center justify-center bg-gray-50">
            <Upload size={28} color="#9ca3af" className="mb-2" />
            <Text className="text-gray-900 font-medium mb-1">Upload Resume</Text>
            <Text className="text-gray-500 text-xs">PDF, DOCX up to 5MB</Text>
          </Pressable>
        </View>

        <View className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-10 flex-row items-center justify-between">
          <View className="flex-1 pr-4">
            <Text className="text-gray-900 font-medium mb-1">Available immediately?</Text>
            <Text className="text-gray-500 text-xs">Can you start taking jobs right away after approval?</Text>
          </View>
          <Switch 
            value={form.availability} 
            onValueChange={(val) => setForm({...form, availability: val})}
            trackColor={{ false: '#d1d5db', true: '#3b82f6' }} 
          />
        </View>

        <Pressable 
          onPress={handleSubmit}
          className="bg-blue-600 py-4 rounded-xl items-center mb-10 shadow-sm"
        >
          <Text className="text-white font-bold text-lg">Submit Application</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
