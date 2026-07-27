import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, DEPARTMENTS } from '../../constants';
import { createSurgery } from '../../services/surgery';
import { useAuthStore } from '../../hooks/useAuthStore';
import Toast from 'react-native-toast-message';
import QRCode from 'react-native-qrcode-svg';

export default function CreateSurgeryScreen() {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [qrData, setQrData] = useState('');
  const [formData, setFormData] = useState({
    patientName: '',
    patientAge: '',
    patientGender: 'male',
    doctorName: '',
    department: DEPARTMENTS[0],
    operationType: '',
    operationDescription: '',
    otRoom: '',
    familyPhone: '',
    anesthesiaType: '',
  });

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.patientName || !formData.doctorName || !formData.operationType) {
      Toast.show({ type: 'error', text1: 'Please fill all required fields' });
      return;
    }
    setLoading(true);
    try {
      const qrId = `SUR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const surgeryData = {
        patientName: formData.patientName,
        patientAge: parseInt(formData.patientAge) || 0,
        patientGender: formData.patientGender as 'male' | 'female' | 'other',
        doctorName: formData.doctorName,
        department: formData.department,
        operationType: formData.operationType,
        operationDescription: formData.operationDescription,
        otRoom: formData.otRoom,
        hospitalId: user?.hospitalId || 'hospital_1',
        scheduledDate: new Date(),
        status: 'scheduled' as const,
        qrCodeData: qrId,
        familyPhoneNumbers: formData.familyPhone ? [formData.familyPhone] : [],
        familyNotificationTokens: [],
        anesthesiaType: formData.anesthesiaType,
        createdBy: user?.uid || 'system',
      };
      await createSurgery(surgeryData);
      setQrData(qrId);
      setStep(2);
      Toast.show({ type: 'success', text1: 'Surgery created successfully!' });
    } catch (error: any) {
      Toast.show({ type: 'error', text1: error.message || 'Failed to create surgery' });
    } finally {
      setLoading(false);
    }
  };

  if (step === 2 && qrData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <MaterialCommunityIcons name="check-circle" size={64} color={COLORS.success} />
          <Text style={styles.successTitle}>Surgery Created!</Text>
          <Text style={styles.successText}>Share this QR code with the family</Text>
          <View style={styles.qrContainer}>
            <QRCode value={qrData} size={200} />
          </View>
          <Text style={styles.qrText}>{qrData}</Text>
          <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
            <Text style={styles.buttonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Surgery</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.form}>
        <Text style={styles.sectionTitle}>Patient Information</Text>
        <TextInput style={styles.input} placeholder="Patient Name *" value={formData.patientName} onChangeText={(t) => updateField('patientName', t)} />
        <View style={styles.row}>
          <TextInput style={[styles.input, styles.halfInput]} placeholder="Age" keyboardType="numeric" value={formData.patientAge} onChangeText={(t) => updateField('patientAge', t)} />
          <View style={styles.genderContainer}>
            {['male', 'female', 'other'].map((g) => (
              <TouchableOpacity key={g} style={[styles.genderBtn, formData.patientGender === g && { backgroundColor: COLORS.primary }]} onPress={() => updateField('patientGender', g)}>
                <Text style={[styles.genderText, formData.patientGender === g && { color: COLORS.surface }]}>{g}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <Text style={styles.sectionTitle}>Surgery Details</Text>
        <TextInput style={styles.input} placeholder="Doctor Name *" value={formData.doctorName} onChangeText={(t) => updateField('doctorName', t)} />
        <TextInput style={styles.input} placeholder="Operation Type *" value={formData.operationType} onChangeText={(t) => updateField('operationType', t)} />
        <TextInput style={styles.input} placeholder="OT Room" value={formData.otRoom} onChangeText={(t) => updateField('otRoom', t)} />
        <TextInput style={styles.input} placeholder="Anesthesia Type" value={formData.anesthesiaType} onChangeText={(t) => updateField('anesthesiaType', t)} />
        <TextInput style={[styles.input, styles.textArea]} placeholder="Operation Description" multiline numberOfLines={4} value={formData.operationDescription} onChangeText={(t) => updateField('operationDescription', t)} />
        <Text style={styles.sectionTitle}>Family Contact</Text>
        <TextInput style={styles.input} placeholder="Family Phone Number" keyboardType="phone-pad" value={formData.familyPhone} onChangeText={(t) => updateField('familyPhone', t)} />
        <TouchableOpacity style={[styles.button, loading && { opacity: 0.7 }]} onPress={handleSubmit} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Creating...' : 'Create Surgery & Generate QR'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 24 },
  headerTitle: { fontSize: 20, fontFamily: 'Poppins-Bold', color: COLORS.text },
  form: { padding: 24, paddingTop: 0 },
  sectionTitle: { fontSize: 16, fontFamily: 'Poppins-SemiBold', color: COLORS.primary, marginTop: 16, marginBottom: 12 },
  input: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, fontSize: 15, fontFamily: 'Poppins-Regular', color: COLORS.text, borderWidth: 1, borderColor: COLORS.border, marginBottom: 12 },
  row: { flexDirection: 'row', gap: 12 },
  halfInput: { flex: 1 },
  genderContainer: { flexDirection: 'row', flex: 2, gap: 8 },
  genderBtn: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  genderText: { fontSize: 12, fontFamily: 'Poppins-Medium', color: COLORS.textSecondary },
  textArea: { height: 100, textAlignVertical: 'top' },
  button: { backgroundColor: COLORS.primary, borderRadius: 16, padding: 18, alignItems: 'center', marginTop: 24, marginBottom: 40 },
  buttonText: { color: COLORS.surface, fontSize: 16, fontFamily: 'Poppins-Bold' },
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  successTitle: { fontSize: 24, fontFamily: 'Poppins-Bold', color: COLORS.text, marginTop: 16 },
  successText: { fontSize: 14, fontFamily: 'Poppins-Regular', color: COLORS.textSecondary, marginTop: 8, marginBottom: 24 },
  qrContainer: { backgroundColor: COLORS.surface, padding: 24, borderRadius: 24, borderWidth: 2, borderColor: COLORS.border },
  qrText: { fontSize: 12, fontFamily: 'Poppins-Regular', color: COLORS.textMuted, marginTop: 16 },
});