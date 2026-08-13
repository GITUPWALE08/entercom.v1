import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Briefcase, Clock, CheckCircle, XCircle, Plus, X, UploadCloud, File as FileIcon } from 'lucide-react-native';
import { technicianApi, TechnicianApplication } from '../../../src/api/technician';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { supabase } from '../../../src/lib/supabase';
import { LogoLoader } from '../../../src/components/ui/Loader';

const Checkbox = ({ label, checked, onChange }: any) => (
  <TouchableOpacity onPress={() => onChange(!checked)} className="flex-row items-center mb-3 mr-4">
    <View className={`w-5 h-5 rounded border items-center justify-center mr-2 ${checked ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 bg-white'}`}>
      {checked && <View className="w-2.5 h-2.5 bg-white rounded-sm" />}
    </View>
    <Text className="text-gray-700 text-base">{label}</Text>
  </TouchableOpacity>
);

const Radio = ({ label, selected, onChange }: any) => (
  <TouchableOpacity onPress={onChange} className="flex-row items-center mb-3 mr-4">
    <View className="w-5 h-5 rounded-full border items-center justify-center mr-2 border-gray-300 bg-white">
      {selected && <View className="w-2.5 h-2.5 rounded-full bg-indigo-600" />}
    </View>
    <Text className="text-gray-700 text-base">{label}</Text>
  </TouchableOpacity>
);

const Input = ({ label, value, onChangeText, multiline = false, placeholder = '' }: any) => (
  <View className="mb-4">
    <Text className="text-sm font-semibold text-gray-700 mb-1">{label}</Text>
    <TextInput
      className={`bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 ${multiline ? 'h-24 pt-3' : ''}`}
      value={value}
      onChangeText={onChangeText}
      multiline={multiline}
      placeholder={placeholder}
      placeholderTextColor="#9ca3af"
      textAlignVertical={multiline ? 'top' : 'center'}
    />
  </View>
);

export default function TechnicianPortalScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [application, setApplication] = useState<TechnicianApplication | null>(null);

  // Form State
  const [formData, setFormData] = useState<Record<string, any>>({
    skills: [],
    documents: [], // checklists
  });
  const [uploadedDocs, setUploadedDocs] = useState<any[]>([]);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const apps = await technicianApi.listApplications();
      if (apps && apps.length > 0) {
        setApplication(apps[0]);
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error);
      global.showAppAlert('Error', 'Failed to load technician portal data.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleCheckbox = (key: string, value: string, checked: boolean) => {
    setFormData(prev => {
      const arr = prev[key] || [];
      if (checked) {
        return { ...prev, [key]: [...arr, value] };
      } else {
        return { ...prev, [key]: arr.filter((i: string) => i !== value) };
      }
    });
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
        multiple: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setUploadedDocs(prev => [...prev, ...result.assets]);
      }
    } catch (error) {
      console.error('Error picking document', error);
      global.showAppAlert('Error', 'Could not pick document.');
    }
  };

  const removeDoc = (index: number) => {
    setUploadedDocs(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      let docUrls: string[] = [];

      if (uploadedDocs.length > 0) {
        for (const doc of uploadedDocs) {
          try {
            const fileUri = doc.uri;
            const fileName = doc.name || `doc_${Date.now()}`;
            const fileType = doc.mimeType || 'application/octet-stream';
            
            const base64 = await FileSystem.readAsStringAsync(fileUri, { encoding: 'base64' });
            const filePath = `technician-docs/${Date.now()}_${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
            
            const { error: uploadError } = await supabase.storage
              .from('entercom-media')
              .upload(filePath, decode(base64), { contentType: fileType });
              
            if (uploadError) throw uploadError;
            
            const { data: publicUrlData } = supabase.storage
              .from('entercom-media')
              .getPublicUrl(filePath);
              
            docUrls.push(publicUrlData.publicUrl);
          } catch (uploadErr) {
            console.error('Upload error:', uploadErr);
            global.showAppAlert('Error', 'Failed to upload one or more documents.');
            setSubmitting(false);
            return;
          }
        }
      }

      const applicationData = {
        skills: formData.skills || [],
        document_urls: docUrls,
        form_data: { ...formData, checklist_documents: formData.documents },
      };

      const newApp = await technicianApi.submitApplication(applicationData);
      setApplication(newApp);
      global.showAppAlert('Success', 'Your application has been submitted!');
    } catch (error: any) {
      global.showAppAlert('Error', error.message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <LogoLoader />
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
        </View>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
      <View className="mb-6 mt-2">
        <View className="w-16 h-16 bg-indigo-50 rounded-2xl items-center justify-center mb-4">
          <Briefcase size={32} color="#4F46E5" />
        </View>
        <Text className="text-3xl font-extrabold text-gray-900 mb-2">Join as Technician</Text>
        <Text className="text-base text-gray-500 leading-6">Please complete this form accurately to apply as an installer or technician.</Text>
      </View>

      {/* 1. Personal Information */}
      <View className="mb-8">
        <Text className="text-xl font-bold text-gray-900 mb-4">1. Personal Information</Text>
        <Input label="Full Name" value={formData.full_name} onChangeText={(v:any) => handleChange('full_name', v)} />
        <Input label="Phone Number" value={formData.phone} onChangeText={(v:any) => handleChange('phone', v)} />
        <Input label="Email Address" value={formData.email} onChangeText={(v:any) => handleChange('email', v)} />
        <Input label="Residential Address" value={formData.address} onChangeText={(v:any) => handleChange('address', v)} multiline />
        <Input label="State" value={formData.state} onChangeText={(v:any) => handleChange('state', v)} />
      </View>

      {/* 2. Position */}
      <View className="mb-8">
        <Text className="text-xl font-bold text-gray-900 mb-4">2. Position Applying For</Text>
        <View className="flex-row flex-wrap">
          <Radio label="Installer" selected={formData.position === 'installer'} onChange={() => handleChange('position', 'installer')} />
          <Radio label="Technician" selected={formData.position === 'technician'} onChange={() => handleChange('position', 'technician')} />
          <Radio label="Both" selected={formData.position === 'both'} onChange={() => handleChange('position', 'both')} />
        </View>
      </View>

      {/* 3. Engagement */}
      <View className="mb-8">
        <Text className="text-xl font-bold text-gray-900 mb-4">3. Preferred Engagement</Text>
        <View className="flex-row flex-wrap">
          <Radio label="Freelance" selected={formData.engagement === 'freelance'} onChange={() => handleChange('engagement', 'freelance')} />
          <Radio label="Contract" selected={formData.engagement === 'contract'} onChange={() => handleChange('engagement', 'contract')} />
          <Radio label="Full-Time" selected={formData.engagement === 'full-time'} onChange={() => handleChange('engagement', 'full-time')} />
        </View>
      </View>

      {/* 4. Skills */}
      <View className="mb-8">
        <Text className="text-xl font-bold text-gray-900 mb-4">4. Areas of Experience</Text>
        <View className="flex-row flex-wrap">
          {['CCTV', 'Networking', 'Access Control', 'Biometrics', 'Alarm', 'Solar'].map(skill => (
            <Checkbox key={skill} label={skill} checked={(formData.skills || []).includes(skill)} onChange={(c: boolean) => handleCheckbox('skills', skill, c)} />
          ))}
        </View>
        <View className="mt-4">
          <Input label="Other relevant experience" value={formData.other_experience} onChangeText={(v:any) => handleChange('other_experience', v)} multiline />
        </View>
      </View>

      {/* 5. Work Experience */}
      <View className="mb-8">
        <Text className="text-xl font-bold text-gray-900 mb-4">5. Past Work Experience</Text>
        <Input label="Company / Client" value={formData.work1_company} onChangeText={(v:any) => handleChange('work1_company', v)} />
        <Input label="Role" value={formData.work1_role} onChangeText={(v:any) => handleChange('work1_role', v)} />
        <Input label="Period (e.g. Jan 2024 - Dec 2025)" value={formData.work1_period} onChangeText={(v:any) => handleChange('work1_period', v)} />
        <Input label="Key Responsibilities" value={formData.work1_responsibilities} onChangeText={(v:any) => handleChange('work1_responsibilities', v)} multiline />
      </View>

      {/* 6. Documents */}
      <View className="mb-8">
        <Text className="text-xl font-bold text-gray-900 mb-4">6. Document Checklist & Upload</Text>
        <Text className="text-gray-500 mb-4">Please upload copies of the following documents where applicable (CV, ID, Certifications, Portfolio).</Text>
        
        <TouchableOpacity 
          onPress={handlePickDocument}
          className="w-full bg-gray-50 border-2 border-gray-300 border-dashed rounded-2xl p-6 items-center justify-center mb-6"
        >
          <UploadCloud size={32} color="#6b7280" />
          <Text className="text-gray-700 font-semibold mt-2">Tap to pick files</Text>
        </TouchableOpacity>

        {uploadedDocs.length > 0 && (
          <View className="bg-gray-50 p-4 rounded-xl mb-4">
            {uploadedDocs.map((doc, idx) => (
              <View key={idx} className="flex-row items-center justify-between py-2 border-b border-gray-200">
                <View className="flex-row items-center flex-1">
                  <FileIcon size={20} color="#4F46E5" className="mr-3" />
                  <Text className="text-gray-700 flex-1" numberOfLines={1}>{doc.name}</Text>
                </View>
                <TouchableOpacity onPress={() => removeDoc(idx)} className="p-2">
                  <X size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Submit */}
      <TouchableOpacity 
        onPress={handleSubmit}
        disabled={submitting}
        className={`w-full py-4 rounded-xl items-center justify-center flex-row ${submitting ? 'bg-indigo-400' : 'bg-ess-purple'}`}
      >
        {submitting ? (
          <ActivityIndicator color="white" className="mr-2" />
        ) : null}
        <Text className="text-white font-bold text-lg">{submitting ? 'Submitting...' : 'Submit Application'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
