import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
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

  const handleBarcodeScanned = useCallback(
    async ({ data }: { data: string }) => {
      if (isProcessing.current) return;
      isProcessing.current = true;
      setScanned(true);
      setLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

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
    },
    [navigation]
  );

  const handleRescan = () => {
    Haptics.selectionAsync();
    successScale.value = 0;
    isProcessing.current = false;
    setScanned(false);
  };

  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <Animated.View entering={FadeIn} style={styles.permissionWrap}>
          <View style={styles.permissionIconCircle}>
            <MaterialCommunityIcons name="camera-off-outline" size={48} color={COLORS.primary} />
          </View>
          <Text style={styles.title}>Camera Access Needed</Text>
          <Text style={styles.message}>We need camera permission to scan surgery QR codes.</Text>
          <TouchableOpacity onPress={requestPermission}>
            <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.button}>
              <Text style={styles.buttonText}>Grant Permission</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Scan QR Code</Text>
        <Text style={styles.subtitle}>Point camera at the surgery QR code</Text>
      </View>

      <View style={styles.scannerContainer}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: 24, alignItems: 'center' },
  title: { fontSize: 24, fontFamily: FONTS.bold, color: COLORS.primary },
  subtitle: { fontSize: 14, fontFamily: FONTS.regular, color: COLORS.textSecondary, marginTop: 4 },
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
});