import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Briefcase, Clock, CheckCircle, XCircle, Plus, X, UploadCloud, File as FileIcon } from 'lucide-react-native';
import { technicianApi, TechnicianApplication } from '../../../src/api/technician';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { supabase } from '../../../src/lib/supabase';

export default function TechnicianPortalScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [application, setApplication] = useState<TechnicianApplication | null>(null);

  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [document, setDocument] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const apps = await technicianApi.listApplications();
      if (apps && apps.length > 0) {
        setApplication(apps[0]); // Show the latest application
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error);
      Alert.alert('Error', 'Failed to load technician portal data.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = () => {
    const skill = skillInput.trim();
    if (skill && !skills.includes(skill)) {
      setSkills([...skills, skill]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setDocument(result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking document', error);
      Alert.alert('Error', 'Could not pick document.');
    }
  };

  const handleSubmit = async () => {
    if (skills.length === 0) {
      Alert.alert('Error', 'Please add at least one skill.');
      return;
    }

    try {
      setSubmitting(true);
      let docUrl = '';

      if (document) {
        setUploadingDoc(true);
        try {
          const fileUri = document.uri;
          const fileName = document.name || `doc_${Date.now()}`;
          const fileType = document.mimeType || 'application/octet-stream';
          
          const base64 = await FileSystem.readAsStringAsync(fileUri, { encoding: 'base64' });
          const filePath = `technician-docs/${Date.now()}_${fileName}`;
          
          const { error: uploadError } = await supabase.storage
            .from('entercom-media')
            .upload(filePath, decode(base64), { contentType: fileType });
            
          if (uploadError) throw uploadError;
          
          const { data: publicUrlData } = supabase.storage
            .from('entercom-media')
            .getPublicUrl(filePath);
            
          docUrl = publicUrlData.publicUrl;
        } catch (uploadErr) {
          console.error('Upload error:', uploadErr);
          Alert.alert('Error', 'Failed to upload document.');
          setUploadingDoc(false);
          setSubmitting(false);
          return;
        }
        setUploadingDoc(false);
      }

      const applicationData: any = { skills, notes };
      if (docUrl) {
        applicationData.document_urls = [docUrl];
      }

      const newApp = await technicianApi.submitApplication(applicationData);
      setApplication(newApp);
      Alert.alert('Success', 'Your application has been submitted!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (application) {
    return (
      <View className="flex-1 bg-gray-50 p-6 items-center justify-center">
        <View className="bg-white p-8 rounded-3xl shadow-sm w-full max-w-sm items-center border border-gray-100">
          <View className="w-20 h-20 rounded-full bg-indigo-50 items-center justify-center mb-6">
            {application.status === 'pending' && <Clock size={40} color="#6366F1" />}
            {application.status === 'approved' && <CheckCircle size={40} color="#10B981" />}
            {application.status === 'rejected' && <XCircle size={40} color="#EF4444" />}
          </View>
          <Text className="text-2xl font-bold text-gray-900 mb-2">Application Status</Text>
          <Text className="text-lg text-gray-500 capitalize mb-8">{application.status}</Text>
          
          <View className="w-full bg-gray-50 p-4 rounded-xl">
            <Text className="text-sm font-semibold text-gray-700 mb-3">Your Skills</Text>
            <View className="flex-row flex-wrap" style={{ gap: 8 }}>
              {application.skills?.map((skill, index) => (
                <View key={index} className="bg-indigo-100 px-3 py-1.5 rounded-full">
                  <Text className="text-indigo-700 text-sm font-medium">{skill}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 24 }}>
      <View className="mb-8 mt-4">
        <View className="w-16 h-16 bg-indigo-50 rounded-2xl items-center justify-center mb-6">
          <Briefcase size={32} color="#4F46E5" />
        </View>
        <Text className="text-3xl font-extrabold text-gray-900 mb-2">Join as Technician</Text>
        <Text className="text-base text-gray-500 leading-6">Apply to become a verified technician on Entercom and start receiving job requests.</Text>
      </View>

      <View className="mb-8">
        <Text className="text-sm font-semibold text-gray-700 mb-3">Skills</Text>
        <View className="flex-row items-center mb-4" style={{ gap: 12 }}>
          <View className="flex-1 bg-gray-50 rounded-xl px-4 py-3 border border-gray-200 flex-row items-center">
            <TextInput
              className="flex-1 text-base text-gray-900"
              placeholder="e.g. Plumbing, Electrical..."
              value={skillInput}
              onChangeText={setSkillInput}
              onSubmitEditing={handleAddSkill}
            />
          </View>
          <TouchableOpacity 
            onPress={handleAddSkill}
            className="w-12 h-12 bg-indigo-600 rounded-xl items-center justify-center shadow-sm"
          >
            <Plus size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        {skills.length > 0 && (
          <View className="flex-row flex-wrap" style={{ gap: 8 }}>
            {skills.map((skill, index) => (
              <View key={index} className="bg-indigo-50 px-4 py-2 rounded-xl flex-row items-center border border-indigo-100">
                <Text className="text-indigo-700 font-medium mr-2">{skill}</Text>
                <TouchableOpacity onPress={() => handleRemoveSkill(skill)}>
                  <X size={16} color="#4338CA" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      <View className="mb-10">
        <Text className="text-sm font-semibold text-gray-700 mb-3">Additional Notes</Text>
        <View className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
          <TextInput
            className="text-base text-gray-900 h-28"
            placeholder="Tell us about your experience, certifications, or any other relevant details..."
            multiline
            textAlignVertical="top"
            value={notes}
            onChangeText={setNotes}
          />
        </View>
      </View>

      <View className="mb-10">
        <Text className="text-sm font-semibold text-gray-700 mb-3">Supporting Document / ID (Optional)</Text>
        
        {document ? (
          <View className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex-row items-center justify-between">
            <View className="flex-row items-center flex-1 mr-3">
              <FileIcon size={24} color="#4F46E5" />
              <Text className="ml-3 text-indigo-900 font-medium flex-1" numberOfLines={1}>
                {document.name}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setDocument(null)}>
              <X size={20} color="#4338CA" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={handlePickDocument}
            className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-6 items-center justify-center"
          >
            <UploadCloud size={32} color="#9CA3AF" />
            <Text className="text-gray-600 font-medium mt-3 text-center">
              Tap to upload PDF or Image
            </Text>
            <Text className="text-gray-400 text-xs mt-1 text-center">
              File size should not exceed 5MB
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        onPress={handleSubmit}
        disabled={submitting}
        className={`w-full py-4 rounded-2xl items-center justify-center flex-row shadow-sm ${
          submitting ? 'bg-indigo-400' : 'bg-indigo-600'
        }`}
      >
        {submitting ? (
          <View className="flex-row items-center">
            <ActivityIndicator color="#FFF" className="mr-3" />
            <Text className="text-white text-lg font-bold">
              {uploadingDoc ? 'Uploading...' : 'Submitting...'}
            </Text>
          </View>
        ) : (
          <Text className="text-white text-lg font-bold">Submit Application</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}
