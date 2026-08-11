import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Modal,
  TextInput,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSpring,
  Easing,
  FadeIn,
  FadeInDown,
  FadeOutDown,
} from 'react-native-reanimated';
import { COLORS, FONTS } from '../../constants';
import { getSurgeryByQrData } from '../../services/surgery';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');
const SCAN_SIZE = width * 0.7;

export default function ScanScreen() {
  const navigation = useNavigation<any>();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [manualModalVisible, setManualModalVisible] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const isProcessing = useRef(false);

  const scanLineY = useSharedValue(0);
  const successScale = useSharedValue(0);

  useEffect(() => {
    scanLineY.value = withRepeat(
      withTiming(SCAN_SIZE - 4, { duration: 1800, easing: Easing.linear }),
      -1,
      true
    );
  }, []);

  const scanLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanLineY.value }],
  }));

  const successStyle = useAnimatedStyle(() => ({
    transform: [{ scale: successScale.value }],
  }));

  const lookupSurgery = async (data: string) => {
    setLoading(true);
    try {
      const surgery = await getSurgeryByQrData(data);
      if (surgery) {
        successScale.value = withSpring(1);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Toast.show({ type: 'success', text1: `Found: ${surgery.patientName}` });
        setTimeout(() => {
          navigation.navigate('SurgeryDetail', { surgeryId: surgery.id });
        }, 600);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Toast.show({ type: 'error', text1: 'Invalid QR code or surgery not found' });
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({ type: 'error', text1: 'Error scanning QR code' });
    } finally {
      setLoading(false);
    }
  };

  const handleBarcodeScanned = useCallback(
    async ({ data }: { data: string }) => {
      if (isProcessing.current) return;
      isProcessing.current = true;
      setScanned(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await lookupSurgery(data);
    },
    [navigation]
  );

  const handleRescan = () => {
    Haptics.selectionAsync();
    successScale.value = 0;
    isProcessing.current = false;
    setScanned(false);
  };

  const handleManualSubmit = async () => {
    if (!manualCode.trim()) {
      Toast.show({ type: 'error', text1: 'Enter a QR code value' });
      return;
    }
    Haptics.selectionAsync();
    setManualModalVisible(false);
    setScanned(true);
    await lookupSurgery(manualCode.trim());
    setManualCode('');
  };

  const openSettings = () => {
    Haptics.selectionAsync();
    Linking.openSettings();
  };

  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    const permanentlyDenied = !permission.canAskAgain;
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.85}>
            <MaterialCommunityIcons name="arrow-left" size={20} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan QR Code</Text>
          <View style={{ width: 40 }} />
        </View>

        <Animated.View entering={FadeIn} style={styles.permissionWrap}>
          <View style={styles.permissionIconCircle}>
            <MaterialCommunityIcons name="camera-off-outline" size={48} color={COLORS.primary} />
          </View>
          <Text style={styles.title}>Camera Access Needed</Text>
          <Text style={styles.message}>
            {permanentlyDenied
              ? 'Camera access was denied. Please enable it in Settings to scan surgery QR codes.'
              : 'We need camera permission to scan surgery QR codes.'}
          </Text>
          <TouchableOpacity onPress={permanentlyDenied ? openSettings : requestPermission} activeOpacity={0.9}>
            <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.button}>
              <Text style={styles.buttonText}>{permanentlyDenied ? 'Open Settings' : 'Grant Permission'}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setManualModalVisible(true)} style={styles.manualLink} activeOpacity={0.8}>
            <MaterialCommunityIcons name="keyboard-outline" size={16} color={COLORS.primary} />
            <Text style={styles.manualLinkText}>Enter code manually instead</Text>
          </TouchableOpacity>
        </Animated.View>

        <ManualEntryModal
          visible={manualModalVisible}
          value={manualCode}
          onChangeText={setManualCode}
          onClose={() => setManualModalVisible(false)}
          onSubmit={handleManualSubmit}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.85}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.title}>Scan QR Code</Text>
          <Text style={styles.subtitle}>Point camera at the surgery QR code</Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            Haptics.selectionAsync();
            setFacing((f) => (f === 'back' ? 'front' : 'back'));
          }}
          style={styles.backBtn}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="camera-flip-outline" size={20} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.scannerContainer}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing={facing}
          enableTorch={torchOn}
          onBarcodeScanned={handleBarcodeScanned}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        />

        <View style={styles.dimOverlay} />

        <View style={styles.scanArea}>
          {!scanned && <Animated.View style={[styles.scanLine, scanLineStyle]} />}
          {scanned && !loading && (
            <Animated.View style={[styles.successCheck, successStyle]}>
              <MaterialCommunityIcons name="check-circle" size={56} color={COLORS.success} />
            </Animated.View>
          )}
        </View>

        <View style={[styles.corner, styles.cornerTopLeft]} />
        <View style={[styles.corner, styles.cornerTopRight]} />
        <View style={[styles.corner, styles.cornerBottomLeft]} />
        <View style={[styles.corner, styles.cornerBottomRight]} />

        <TouchableOpacity
          style={styles.torchButton}
          onPress={() => {
            Haptics.selectionAsync();
            setTorchOn((t) => !t);
          }}
        >
          <MaterialCommunityIcons
            name={torchOn ? 'flashlight' : 'flashlight-off'}
            size={22}
            color={COLORS.surface}
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => setManualModalVisible(true)} style={styles.manualLinkCentered} activeOpacity={0.8}>
        <MaterialCommunityIcons name="keyboard-outline" size={16} color={COLORS.primary} />
        <Text style={styles.manualLinkText}>Enter code manually</Text>
      </TouchableOpacity>

      {scanned && !loading && (
        <Animated.View entering={FadeInDown} exiting={FadeOutDown}>
          <TouchableOpacity onPress={handleRescan}>
            <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.rescanButton}>
              <MaterialCommunityIcons name="qrcode-scan" size={18} color={COLORS.surface} />
              <Text style={styles.rescanText}>Tap to Scan Again</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      )}

      {loading && (
        <Animated.View entering={FadeIn} style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.surface} />
          <Text style={styles.loadingText}>Finding surgery...</Text>
        </Animated.View>
      )}

      <ManualEntryModal
        visible={manualModalVisible}
        value={manualCode}
        onChangeText={setManualCode}
        onClose={() => setManualModalVisible(false)}
        onSubmit={handleManualSubmit}
      />
    </SafeAreaView>
  );
}

function ManualEntryModal({
  visible,
  value,
  onChangeText,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  value: string;
  onChangeText: (text: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Enter QR Code Manually</Text>
          <Text style={styles.modalSubtitle}>Paste or type the surgery QR data</Text>
          <TextInput
            style={styles.modalInput}
            placeholder="Paste QR code data..."
            placeholderTextColor={COLORS.textMuted}
            value={value}
            onChangeText={onChangeText}
            multiline
            autoFocus
          />
          <View style={styles.modalActions}>
            <TouchableOpacity onPress={onClose} style={styles.modalCancelBtn} activeOpacity={0.85}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onSubmit} style={styles.modalSubmitBtn} activeOpacity={0.9}>
              <Text style={styles.modalSubmitText}>Look Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerTextWrap: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontFamily: FONTS.bold, color: COLORS.text },
  title: { fontSize: 20, fontFamily: FONTS.bold, color: COLORS.primary, textAlign: 'center' },
  subtitle: { fontSize: 12.5, fontFamily: FONTS.regular, color: COLORS.textSecondary, marginTop: 2, textAlign: 'center' },

  scannerContainer: {
    flex: 1,
    margin: 24,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#000',
  },
  dimOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.25)' },
  scanArea: {
    position: 'absolute',
    alignSelf: 'center',
    top: '50%',
    marginTop: -SCAN_SIZE / 2,
    width: SCAN_SIZE,
    height: SCAN_SIZE,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.primary,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanLine: {
    position: 'absolute',
    top: 0,
    width: '100%',
    height: 3,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.9,
    shadowRadius: 8,
  },
  successCheck: { alignItems: 'center', justifyContent: 'center' },
  corner: { position: 'absolute', width: 40, height: 40, borderColor: COLORS.primary },
  cornerTopLeft: { top: 40, left: 40, borderTopWidth: 4, borderLeftWidth: 4 },
  cornerTopRight: { top: 40, right: 40, borderTopWidth: 4, borderRightWidth: 4 },
  cornerBottomLeft: { bottom: 40, left: 40, borderBottomWidth: 4, borderLeftWidth: 4 },
  cornerBottomRight: { bottom: 40, right: 40, borderBottomWidth: 4, borderRightWidth: 4 },
  torchButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  manualLinkCentered: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 12,
  },
  manualLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 20,
  },
  manualLinkText: { fontSize: 13, fontFamily: FONTS.semiBold, color: COLORS.primary },

  rescanButton: {
    flexDirection: 'row',
    gap: 8,
    margin: 24,
    padding: 16,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rescanText: { color: COLORS.surface, fontSize: 16, fontFamily: FONTS.bold },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: { color: COLORS.surface, fontSize: 18, fontFamily: FONTS.bold },
  permissionWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 12 },
  permissionIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  message: { fontSize: 15, fontFamily: FONTS.regular, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 16 },
  button: { paddingHorizontal: 32, paddingVertical: 16, borderRadius: 32, alignItems: 'center' },
  buttonText: { color: COLORS.surface, fontSize: 16, fontFamily: FONTS.bold },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 24,
    width: '100%',
  },
  modalTitle: { fontSize: 17, fontFamily: FONTS.bold, color: COLORS.text },
  modalSubtitle: { fontSize: 13, fontFamily: FONTS.regular, color: COLORS.textMuted, marginTop: 4, marginBottom: 16 },
  modalInput: {
    backgroundColor: COLORS.background,
    borderRadius: 14,
    padding: 14,
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 90,
    textAlignVertical: 'top',
  },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalCancelText: { fontSize: 14, fontFamily: FONTS.semiBold, color: COLORS.textSecondary },
  modalSubmitBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: COLORS.primary,
  },
  modalSubmitText: { fontSize: 14, fontFamily: FONTS.semiBold, color: COLORS.surface },
});