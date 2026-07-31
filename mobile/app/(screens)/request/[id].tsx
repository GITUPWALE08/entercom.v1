import { View, Text, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle2, Circle, Clock } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RequestDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const timelineEvents = [
    { id: 1, title: 'Request Submitted', date: 'Oct 12, 10:00 AM', status: 'completed' },
    { id: 2, title: 'Processing', date: 'Oct 12, 11:30 AM', status: 'completed' },
    { id: 3, title: 'In Transit', date: 'Oct 13, 09:00 AM', status: 'active' },
    { id: 4, title: 'Delivered', date: 'Expected Oct 14', status: 'pending' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center p-4 border-b border-gray-200">
        <Pressable onPress={() => router.back()} className="mr-4 p-2 -ml-2">
          <ArrowLeft size={24} color="#000" />
        </Pressable>
        <Text className="text-xl font-bold flex-1">Request #{id}</Text>
      </View>

      <ScrollView className="flex-1 p-6">
        <View className="mb-8 p-4 bg-blue-50 rounded-xl">
          <Text className="text-blue-800 font-semibold mb-1">Status</Text>
          <Text className="text-2xl font-bold text-blue-900">In Transit</Text>
          <Text className="text-blue-700 mt-2">Your item is on the way and should arrive soon.</Text>
        </View>

        <Text className="text-lg font-bold mb-6 text-gray-900">Timeline</Text>
        
        <View className="pl-2">
          {timelineEvents.map((event, index) => (
            <View key={event.id} className="flex-row mb-8 relative">
              {/* Timeline line */}
              {index < timelineEvents.length - 1 && (
                <View className="absolute left-[11px] top-8 bottom-[-32px] w-0.5 bg-gray-200" />
              )}
              
              <View className="mr-4 bg-white z-10">
                {event.status === 'completed' ? (
                  <CheckCircle2 size={24} color="#16a34a" />
                ) : event.status === 'active' ? (
                  <Clock size={24} color="#2563eb" />
                ) : (
                  <Circle size={24} color="#d1d5db" />
                )}
              </View>
              
              <View className="flex-1 -mt-1">
                <Text className={`font-semibold text-base ${event.status === 'pending' ? 'text-gray-500' : 'text-gray-900'}`}>
                  {event.title}
                </Text>
                <Text className="text-gray-500 mt-1">{event.date}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
