import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  Share,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import QRCode from 'react-native-qrcode-svg';

import { COLORS, FONTS, DEPARTMENTS } from '../../constants';
import { createSurgery, getSurgery } from '../../services/surgery';
import { useAuthStore } from '../../hooks/useAuthStore';

interface FormErrors {
  [key: string]: string;
}

export default function CreateSurgeryScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [qrData, setQrData] = useState('');
  const [createdPatientName, setCreatedPatientName] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  const [showDeptPicker, setShowDeptPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [scheduledDate, setScheduledDate] = useState(new Date());

  const [formData, setFormData] = useState({
    patientName: '',
    patientAge: '',
    patientGender: 'male' as 'male' | 'female' | 'other',
    doctorName: '',
    department: DEPARTMENTS[0],
    operationType: '',
    operationDescription: '',
    otRoom: '',
    familyPhone: '',
    anesthesiaType: '',
  });

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const resetForm = () => {
    Haptics.selectionAsync();
    Alert.alert('Reset Form', 'Clear all fields and start over?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: () => {
          setFormData({
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
          setScheduledDate(new Date());
          setErrors({});
          setStep(1);
          setQrData('');
          setCreatedPatientName('');
          Toast.show({ type: 'info', text1: 'Form reset' });
        },
      },
    ]);
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.patientName.trim()) newErrors.patientName = 'Patient name is required';
    if (!formData.doctorName.trim()) newErrors.doctorName = 'Doctor name is required';
    if (!formData.operationType.trim()) newErrors.operationType = 'Operation type is required';

    if (formData.patientAge && (isNaN(Number(formData.patientAge)) || Number(formData.patientAge) <= 0)) {
      newErrors.patientAge = 'Enter a valid age';
    }

    if (formData.familyPhone && formData.familyPhone.replace(/\D/g, '').length < 7) {
      newErrors.familyPhone = 'Enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({ type: 'error', text1: 'Please fix the highlighted fields' });
      return;
    }

    setLoading(true);
    try {
      const surgeryData = {
        patientName: formData.patientName.trim(),
        patientAge: parseInt(formData.patientAge) || 0,
        patientGender: formData.patientGender as 'male' | 'female' | 'other',
        doctorName: formData.doctorName.trim(),
        department: formData.department,
        operationType: formData.operationType.trim(),
        operationDescription: formData.operationDescription.trim(),
        otRoom: formData.otRoom.trim(),
        hospitalId: user?.hospitalId || 'hospital_1',
        scheduledDate,
        status: 'scheduled' as const,
        familyPhoneNumbers: formData.familyPhone ? [formData.familyPhone.trim()] : [],
        familyNotificationTokens: [],
        anesthesiaType: formData.anesthesiaType.trim(),
        createdBy: user?.uid || 'system',
      };

      const newId = await createSurgery(surgeryData);
      const created = await getSurgery(newId);

      if (!created?.qrCodeData) {
        throw new Error('Surgery created but QR code could not be generated');
      }

      setQrData(created.qrCodeData);
      setCreatedPatientName(created.patientName);
      setStep(2);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({ type: 'success', text1: 'Surgery created successfully!' });
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({ type: 'error', text1: error?.message || 'Failed to create surgery' });
    } finally {
      setLoading(false);
    }
  };

  const copyQrData = async () => {
    await Clipboard.setStringAsync(qrData);
    Haptics.selectionAsync();
    Toast.show({ type: 'success', text1: 'QR data copied to clipboard' });
  };

  const shareQr = async () => {
    Haptics.selectionAsync();
    try {
      await Share.share({
        message: `SurgeryTrack - Track ${createdPatientName}'s surgery.\nQR Data: ${qrData}`,
      });
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Could not share' });
    }
  };

  const onDateChange = (_event: unknown, selectedDate?: Date) => {
    if (Platform.OS === 'ios') setShowDatePicker(false);
    if (selectedDate) {
      const updated = new Date(scheduledDate);
      updated.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
      setScheduledDate(updated);
    }
  };

  const onTimeChange = (_event: unknown, selectedTime?: Date) => {
    if (Platform.OS === 'ios') setShowTimePicker(false);
    if (selectedTime) {
      const updated = new Date(scheduledDate);
      updated.setHours(selectedTime.getHours(), selectedTime.getMinutes());
      setScheduledDate(updated);
    }
  };

  const genderOptions = useMemo(
    () => [
      { label: 'M', value: 'male' as const },
      { label: 'F', value: 'female' as const },
      { label: 'O', value: 'other' as const },
    ],
    []
  );

  // ---------- Success Step ----------

  if (step === 2 && qrData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="arrow-left" size={20} color={COLORS.text} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Surgery Created</Text>

          <View style={styles.headerActionPlaceholder} />
        </View>

        <Animated.View entering={FadeIn.duration(400)} style={styles.successContainer}>
          <MaterialCommunityIcons name="check-circle" size={64} color={COLORS.success} />
          <Text style={styles.successTitle}>Surgery Created!</Text>
          <Text style={styles.successText}>Share this QR code with the family</Text>

          <View style={styles.qrContainer}>
            <QRCode value={qrData} size={180} />
          </View>

          <View style={styles.qrActionsRow}>
            <TouchableOpacity style={styles.qrActionBtn} onPress={copyQrData} activeOpacity={0.85}>
              <MaterialCommunityIcons name="content-copy" size={16} color={COLORS.primary} />
              <Text style={styles.qrActionText}>Copy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.qrActionBtn} onPress={shareQr} activeOpacity={0.85}>
              <MaterialCommunityIcons name="share-variant" size={16} color={COLORS.primary} />
              <Text style={styles.qrActionText}>Share</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              Haptics.selectionAsync();
              navigation.goBack();
            }}
            activeOpacity={0.9}
          >
            <Text style={styles.buttonText}>Done</Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    );
  }

  // ---------- Form Step ----------

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color={COLORS.text} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Create Surgery</Text>

        <TouchableOpacity
          style={styles.headerActionButton}
          onPress={resetForm}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="refresh" size={20} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* Progress */}
      <View style={styles.progressRow}>
        <View style={[styles.progressStep, styles.progressStepActive]}>
          <Text style={styles.progressStepText}>1</Text>
        </View>
        <View style={styles.progressLine} />
        <View style={styles.progressStep}>
          <Text style={[styles.progressStepText, { color: COLORS.textMuted }]}>2</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.form}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Patient Info */}
        <Animated.View entering={FadeInDown.delay(40)}>
          <Text style={styles.sectionTitle}>Patient Information</Text>

          <TextInput
            style={[styles.input, errors.patientName && styles.inputError]}
            placeholder="Patient Name *"
            placeholderTextColor={COLORS.textMuted}
            value={formData.patientName}
            onChangeText={(t) => updateField('patientName', t)}
          />
          {errors.patientName && <Text style={styles.errorText}>{errors.patientName}</Text>}

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <TextInput
                style={[styles.input, errors.patientAge && styles.inputError]}
                placeholder="Age"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="numeric"
                value={formData.patientAge}
                onChangeText={(t) => updateField('patientAge', t)}
              />
              {errors.patientAge && <Text style={styles.errorText}>{errors.patientAge}</Text>}
            </View>

            <View style={styles.genderContainer}>
              {genderOptions.map((g) => {
                const active = formData.patientGender === g.value;
                return (
                  <TouchableOpacity
                    key={g.value}
                    style={[styles.genderBtn, active && styles.genderBtnActive]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      updateField('patientGender', g.value);
                    }}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.genderText, active && styles.genderTextActive]}>
                      {g.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </Animated.View>

        {/* Surgery Details */}
        <Animated.View entering={FadeInDown.delay(80)}>
          <Text style={styles.sectionTitle}>Surgery Details</Text>

          <TextInput
            style={[styles.input, errors.doctorName && styles.inputError]}
            placeholder="Doctor Name *"
            placeholderTextColor={COLORS.textMuted}
            value={formData.doctorName}
            onChangeText={(t) => updateField('doctorName', t)}
          />
          {errors.doctorName && <Text style={styles.errorText}>{errors.doctorName}</Text>}

          <TouchableOpacity
            style={styles.input}
            onPress={() => setShowDeptPicker(true)}
            activeOpacity={0.85}
          >
            <View style={styles.pickerRow}>
              <Text style={styles.pickerText}>{formData.department}</Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color={COLORS.textMuted} />
            </View>
          </TouchableOpacity>

          <TextInput
            style={[styles.input, errors.operationType && styles.inputError]}
            placeholder="Operation Type *"
            placeholderTextColor={COLORS.textMuted}
            value={formData.operationType}
            onChangeText={(t) => updateField('operationType', t)}
          />
          {errors.operationType && <Text style={styles.errorText}>{errors.operationType}</Text>}

          <TextInput
            style={styles.input}
            placeholder="OT Room"
            placeholderTextColor={COLORS.textMuted}
            value={formData.otRoom}
            onChangeText={(t) => updateField('otRoom', t)}
          />

          <TextInput
            style={styles.input}
            placeholder="Anesthesia Type"
            placeholderTextColor={COLORS.textMuted}
            value={formData.anesthesiaType}
            onChangeText={(t) => updateField('anesthesiaType', t)}
          />

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Operation Description"
            placeholderTextColor={COLORS.textMuted}
            multiline
            numberOfLines={4}
            value={formData.operationDescription}
            onChangeText={(t) => updateField('operationDescription', t)}
          />
        </Animated.View>

        {/* Schedule */}
        <Animated.View entering={FadeInDown.delay(120)}>
          <Text style={styles.sectionTitle}>Schedule</Text>

          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.input, styles.halfInput, styles.pickerRow]}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.pickerText}>{scheduledDate.toLocaleDateString()}</Text>
              <MaterialCommunityIcons name="calendar-outline" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.input, styles.halfInput, styles.pickerRow]}
              onPress={() => setShowTimePicker(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.pickerText}>
                {scheduledDate.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
              <MaterialCommunityIcons name="clock-outline" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={scheduledDate}
              mode="date"
              display="default"
              onChange={onDateChange}
            />
          )}
          {showTimePicker && (
            <DateTimePicker
              value={scheduledDate}
              mode="time"
              display="default"
              onChange={onTimeChange}
            />
          )}
        </Animated.View>

        {/* Family Contact */}
        <Animated.View entering={FadeInDown.delay(160)}>
          <Text style={styles.sectionTitle}>Family Contact</Text>

          <TextInput
            style={[styles.input, errors.familyPhone && styles.inputError]}
            placeholder="Family Phone Number"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="phone-pad"
            value={formData.familyPhone}
            onChangeText={(t) => updateField('familyPhone', t)}
          />
          {errors.familyPhone && <Text style={styles.errorText}>{errors.familyPhone}</Text>}
        </Animated.View>

        {/* Actions */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.9}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Creating...' : 'Create Surgery & Generate QR'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Department Picker Modal */}
      <Modal
        visible={showDeptPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDeptPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDeptPicker(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Department</Text>
            <FlatList
              data={DEPARTMENTS}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    Haptics.selectionAsync();
                    updateField('department', item);
                    setShowDeptPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      formData.department === item && {
                        color: COLORS.primary,
                        fontFamily: FONTS.semiBold,
                      },
                    ]}
                  >
                    {item}
                  </Text>
                  {formData.department === item && (
                    <MaterialCommunityIcons name="check" size={18} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },

  backButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  headerTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },

  headerActionPlaceholder: {
    width: 34,
    height: 34,
  },

  headerActionButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  // Progress
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginBottom: 16,
  },

  progressStep: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },

  progressStepActive: {
    backgroundColor: COLORS.primary,
  },

  progressStepText: {
    fontSize: 13,
    fontFamily: FONTS.bold,
    color: COLORS.surface,
  },

  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: COLORS.border,
    marginHorizontal: 8,
  },

  // Form
  form: {
    paddingHorizontal: 16,
  },

  sectionTitle: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: COLORS.primary,
    marginTop: 16,
    marginBottom: 10,
  },

  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },

  inputError: {
    borderColor: COLORS.error,
  },

  errorText: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    color: COLORS.error,
    marginTop: -6,
    marginBottom: 8,
    marginLeft: 4,
  },

  row: {
    flexDirection: 'row',
    gap: 10,
  },

  halfInput: {
    flex: 1,
  },

  genderContainer: {
    flexDirection: 'row',
    flex: 2,
    gap: 8,
    height: 46,
  },

  genderBtn: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  genderBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  genderText: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
  },

  genderTextActive: {
    color: COLORS.surface,
  },

  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  pickerText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.text,
  },

  textArea: {
    height: 90,
    textAlignVertical: 'top',
  },

  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 20,
  },

  buttonDisabled: {
    opacity: 0.7,
  },

  buttonText: {
    color: COLORS.surface,
    fontSize: 15,
    fontFamily: FONTS.bold,
  },

  // Success
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },

  successTitle: {
    fontSize: 22,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginTop: 16,
  },

  successText: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: 8,
    marginBottom: 24,
  },

  qrContainer: {
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  qrActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },

  qrActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },

  qrActionText: {
    fontSize: 12,
    fontFamily: FONTS.semiBold,
    color: COLORS.primary,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },

  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '60%',
  },

  modalTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginBottom: 8,
  },

  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },

  modalItemText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.text,
  },
});