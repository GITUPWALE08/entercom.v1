import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Switch, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Wrench, Briefcase, FileText, Upload, CheckCircle2 } from 'lucide-react-native';
import { careersApi } from '../../../src/api/careers';

export default function TechnicianCareerScreen() {
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [existingApplication, setExistingApplication] = useState<any>(null);
  const [form, setForm] = useState({
    experience: '',
    certifications: '',
    availability: false,
    about: ''
  });

  useEffect(() => {
    checkExistingApplication();
  }, []);

  const checkExistingApplication = async () => {
    try {
      setCheckingStatus(true);
      const apps = await careersApi.getTechnicianApplications();
      if (apps && apps.length > 0) {
        setExistingApplication(apps[0]);
      }
    } catch (error) {
      console.error('Failed to check existing application', error);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await careersApi.applyTechnician(form);
      setSuccess(true);
    } catch (error) {
      console.error(error);
      alert('Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

    );
  }

  if (checkingStatus) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#081f3d" />
        <Text className="text-gray-500 font-medium mt-4">Checking application status...</Text>
      </View>
    );
  }

  if (existingApplication) {
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'approved': return 'bg-green-100 text-green-800';
        case 'rejected': return 'bg-red-100 text-red-800';
        case 'under_review': return 'bg-blue-100 text-blue-800';
        case 'more_info_requested': return 'bg-orange-100 text-orange-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };

    return (
      <View className="flex-1 bg-gray-50">
        <View className="bg-white pt-16 pb-4 px-6 flex-row items-center justify-between border-b border-gray-100">
          <Pressable onPress={() => router.back()} className="p-2 -ml-2 bg-gray-50 rounded-full">
            <ArrowLeft size={24} color="#1f2937" />
          </Pressable>
          <Text className="text-xl font-bold text-gray-900">Application Status</Text>
          <View className="w-10" />
        </View>
        <ScrollView className="flex-1 p-6">
          <View className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-gray-900">Technician Application</Text>
              <View className={`px-3 py-1 rounded-full ${getStatusColor(existingApplication.status).split(' ')[0]}`}>
                <Text className={`text-xs font-bold ${getStatusColor(existingApplication.status).split(' ')[1]}`}>
                  {existingApplication.status.replace(/_/g, ' ').toUpperCase()}
                </Text>
              </View>
            </View>
            <Text className="text-gray-500 mb-4">
              Submitted on: {new Date(existingApplication.created_at).toLocaleDateString()}
            </Text>

            {existingApplication.status === 'rejected' && existingApplication.rejection_reason && (
              <View className="mt-2 p-4 bg-red-50 rounded-xl">
                <Text className="text-red-800 font-bold mb-1">Reason:</Text>
                <Text className="text-red-700">{existingApplication.rejection_reason}</Text>
              </View>
            )}

            {existingApplication.status === 'more_info_requested' && (
              <View className="mt-2 p-4 bg-orange-50 rounded-xl">
                <Text className="text-orange-800">
                  The reviewer has requested more information. Please wait for them to reach out to you or contact support.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
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
          disabled={loading}
          className={`py-4 rounded-xl items-center mb-10 shadow-sm ${loading ? 'bg-blue-400' : 'bg-blue-600'}`}
        >
          <Text className="text-white font-bold text-lg">{loading ? 'Submitting...' : 'Submit Application'}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
