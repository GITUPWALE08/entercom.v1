import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { CheckCircle, XCircle, AlertCircle, Info, Loader2 } from 'lucide-react-native';
import { useAlertStore } from '../../store/alertStore';

const { width } = Dimensions.get('window');

export function AlertPopup() {
  const { isOpen, type, title, message, buttons, hideAlert } = useAlertStore();

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={40} color="#22c55e" />;
      case 'error':
        return <XCircle size={40} color="#ef4444" />;
      case 'pending':
        return <Loader2 size={40} color="#3b82f6" />;
      case 'cancel':
        return <AlertCircle size={40} color="#f97316" />;
      default:
        return <Info size={40} color="#6b7280" />;
    }
  };

  const getBgClass = () => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-200';
      case 'error': return 'bg-red-50 border-red-200';
      case 'pending': return 'bg-blue-50 border-blue-200';
      case 'cancel': return 'bg-orange-50 border-orange-200';
      default: return 'bg-white border-gray-200';
    }
  };

  const handleClose = () => {
    hideAlert();
  };

  return (
    <Modal
      visible={isOpen}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View className={`rounded-2xl p-6 border shadow-xl items-center ${getBgClass()}`} style={{ width: width * 0.85, maxWidth: 400 }}>
          <View className="mb-4">
            {getIcon()}
          </View>
          
          {title ? <Text className="text-lg font-bold text-gray-900 mb-2 text-center">{title}</Text> : null}
          <Text className="text-sm text-gray-600 mb-6 text-center">{message}</Text>
          
          <View className="w-full gap-2">
            {buttons && buttons.length > 0 ? (
              buttons.map((btn, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => {
                    if (btn.onPress) btn.onPress();
                    handleClose();
                  }}
                  className={`w-full py-3 rounded-xl items-center justify-center ${
                    btn.style === 'destructive' 
                      ? 'bg-red-500' 
                      : btn.style === 'cancel'
                      ? 'bg-gray-200'
                      : 'bg-black'
                  }`}
                >
                  <Text className={`font-semibold ${btn.style === 'cancel' ? 'text-gray-800' : 'text-white'}`}>
                    {btn.text}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <TouchableOpacity
                onPress={handleClose}
                className="w-full py-3 bg-black rounded-xl items-center justify-center"
              >
                <Text className="text-white font-semibold">Okay</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  }
});
