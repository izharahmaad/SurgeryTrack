import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Dimensions,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import {
  useNavigation,
} from '@react-navigation/native';

import {
  MaterialCommunityIcons,
} from '@expo/vector-icons';

import {
  CameraView,
  useCameraPermissions,
} from 'expo-camera';

import {
  LinearGradient,
} from 'expo-linear-gradient';

import * as Haptics from 'expo-haptics';

import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeOutDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import Toast from 'react-native-toast-message';

import {
  COLORS,
  FONTS,
} from '../../constants';

import {
  getSurgeryByQrData,
} from '../../services/surgery';

const { width } = Dimensions.get('window');
const SCAN_SIZE = Math.min(width * 0.7, 310);

type RecentScan = {
  id: string;
  patientName?: string;
  surgeryId: string;
  timestamp: number;
};

export default function ScanScreen() {
  const navigation = useNavigation<any>();

  const [permission, requestPermission] = useCameraPermissions();

  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [manualModalVisible, setManualModalVisible] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [helpVisible, setHelpVisible] = useState(false);
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);

  const isProcessing = useRef(false);

  const scanLineY = useSharedValue(0);
  const successScale = useSharedValue(0);

  useEffect(() => {
    scanLineY.value = withRepeat(
      withTiming(SCAN_SIZE - 4, {
        duration: 2000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );

    return () => {
      scanLineY.value = 0;
    };
  }, [scanLineY]);

  const scanLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanLineY.value }],
  }));

  const successStyle = useAnimatedStyle(() => ({
    transform: [{ scale: successScale.value }],
  }));

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.navigate('DashboardTab');
  }, [navigation]);

  const resetScanner = useCallback(() => {
    isProcessing.current = false;
    setScanned(false);
    setLoading(false);
    successScale.value = 0;
  }, [successScale]);

  const addRecentScan = useCallback((surgery: {
    id: string;
    patientName?: string;
  }) => {
    setRecentScans((prev) => {
      const filtered = prev.filter((s) => s.surgeryId !== surgery.id);
      const next: RecentScan = {
        id: `${surgery.id}-${Date.now()}`,
        patientName: surgery.patientName,
        surgeryId: surgery.id,
        timestamp: Date.now(),
      };
      const list = [next, ...filtered].slice(0, 5);
      return list;
    });
  }, []);

  const lookupSurgery = useCallback(
    async (data: string) => {
      const cleanData = data.trim();

      if (!cleanData) {
        Toast.show({
          type: 'error',
          text1: 'Empty QR code',
          text2: 'The QR code did not contain any data.',
        });
        resetScanner();
        return;
      }

      setLoading(true);

      try {
        const surgery = await getSurgeryByQrData(cleanData);

        if (!surgery) {
          Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Error
          );

          Toast.show({
            type: 'error',
            text1: 'Surgery not found',
            text2: 'This QR code is invalid or not assigned to you.',
          });

          resetScanner();
          return;
        }

        successScale.value = withSpring(1);
        Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        );

        Toast.show({
          type: 'success',
          text1: 'Surgery found',
          text2: surgery.patientName
            ? `Patient: ${surgery.patientName}`
            : 'Opening surgery details',
        });

        addRecentScan({
          id: surgery.id,
          patientName: surgery.patientName,
        });

        setTimeout(() => {
          navigation.navigate('SurgeryDetail', {
            surgeryId: surgery.id,
          });
        }, 800);
      } catch (error) {
        console.error('QR surgery lookup failed:', error);

        Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Error
        );

        Toast.show({
          type: 'error',
          text1: 'Unable to find surgery',
          text2: 'You may not have permission to view this surgery.',
        });

        resetScanner();
      } finally {
        setLoading(false);
      }
    },
    [navigation, resetScanner, successScale, addRecentScan]
  );

  const handleBarcodeScanned = useCallback(
    async ({ data }: { data: string; type?: string }) => {
      if (isProcessing.current || loading || manualModalVisible) {
        return;
      }

      isProcessing.current = true;
      setScanned(true);

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      await lookupSurgery(data);
    },
    [loading, lookupSurgery, manualModalVisible]
  );

  const handleRescan = useCallback(() => {
    Haptics.selectionAsync();
    resetScanner();
  }, [resetScanner]);

  const openManualEntry = useCallback(() => {
    if (loading) {
      return;
    }
    Haptics.selectionAsync();
    setManualModalVisible(true);
  }, [loading]);

  const closeManualEntry = useCallback(() => {
    if (loading) {
      return;
    }
    setManualModalVisible(false);
    setManualCode('');
  }, [loading]);

  const handleManualSubmit = useCallback(async () => {
    const cleanCode = manualCode.trim();

    if (!cleanCode) {
      Toast.show({
        type: 'error',
        text1: 'Enter a QR code value',
      });
      return;
    }

    Haptics.selectionAsync();

    setManualModalVisible(false);
    setScanned(true);
    isProcessing.current = true;

    await lookupSurgery(cleanCode);

    setManualCode('');
  }, [lookupSurgery, manualCode]);

  const openSettings = useCallback(() => {
    Haptics.selectionAsync();
    Linking.openSettings();
  }, []);

  const openRecentScan = useCallback(
    (surgeryId: string) => {
      if (loading) {
        return;
      }
      Haptics.selectionAsync();
      navigation.navigate('SurgeryDetail', { surgeryId });
    },
    [loading, navigation]
  );

  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerLoader}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    const permanentlyDenied = permission.canAskAgain === false;

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable
            onPress={handleBack}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={22}
              color={COLORS.text}
            />
          </Pressable>

          <Text style={styles.headerTitle}>Scan QR Code</Text>

          <View style={styles.headerSpacer} />
        </View>

        <Animated.View entering={FadeIn} style={styles.permissionWrap}>
          <View style={styles.permissionIconCircle}>
            <MaterialCommunityIcons
              name="camera-off-outline"
              size={48}
              color={COLORS.primary}
            />
          </View>

          <Text style={styles.permissionTitle}>Camera Access Needed</Text>

          <Text style={styles.message}>
            {permanentlyDenied
              ? 'Camera access was denied. Enable it in Settings to scan surgery QR codes.'
              : 'We need camera permission to scan surgery QR codes.'}
          </Text>

          <Pressable
            onPress={permanentlyDenied ? openSettings : requestPermission}
            style={styles.gradientButton}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.secondary]}
              style={styles.gradientButtonInner}
            >
              <MaterialCommunityIcons
                name={permanentlyDenied ? 'cog-outline' : 'camera-outline'}
                size={18}
                color={COLORS.surface}
              />
              <Text style={styles.buttonText}>
                {permanentlyDenied ? 'Open Settings' : 'Grant Permission'}
              </Text>
            </LinearGradient>
          </Pressable>

          <Pressable
            onPress={openManualEntry}
            style={styles.manualLink}
          >
            <MaterialCommunityIcons
              name="keyboard-outline"
              size={18}
              color={COLORS.primary}
            />
            <Text style={styles.manualLinkText}>
              Enter code manually instead
            </Text>
          </Pressable>
        </Animated.View>

        <ManualEntryModal
          visible={manualModalVisible}
          value={manualCode}
          loading={loading}
          onChangeText={setManualCode}
          onClose={closeManualEntry}
          onSubmit={handleManualSubmit}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={handleBack}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          accessibilityHint="Returns to the previous screen"
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={22}
            color={COLORS.text}
          />
        </Pressable>

        <View style={styles.headerTextWrap}>
          <Text style={styles.title}>Scan QR Code</Text>
          <Text style={styles.subtitle}>
            Point the camera at the surgery QR code
          </Text>
          <Text style={styles.helper}>
            Keep the QR inside the square frame
          </Text>
        </View>

        <Pressable
          onPress={() => {
            if (loading) {
              return;
            }
            Haptics.selectionAsync();
            setFacing((current) =>
              current === 'back' ? 'front' : 'back'
            );
          }}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="Switch camera"
          accessibilityHint="Switches between front and back camera"
        >
          <MaterialCommunityIcons
            name="camera-flip-outline"
            size={22}
            color={COLORS.text}
          />
        </Pressable>
      </View>

      <View style={styles.scannerContainer}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing={facing}
          enableTorch={torchOn}
          onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        />

        <View pointerEvents="none" style={styles.dimOverlay} />

        <View pointerEvents="none" style={styles.scanArea}>
          {!scanned && !loading && (
            <Animated.View
              style={[styles.scanLine, scanLineStyle]}
            />
          )}

          {scanned && !loading && (
            <Animated.View
              entering={FadeIn}
              style={[styles.successOverlay, successStyle]}
            >
              <MaterialCommunityIcons
                name="check-circle"
                size={56}
                color={COLORS.success}
              />
              <Text style={styles.successText}>Surgery found</Text>
              <Text style={styles.successSubtext}>Opening details…</Text>
            </Animated.View>
          )}
        </View>

        {/* Corners */}
        <View pointerEvents="none" style={[styles.corner, styles.cornerTopLeft]} />
        <View pointerEvents="none" style={[styles.corner, styles.cornerTopRight]} />
        <View pointerEvents="none" style={[styles.corner, styles.cornerBottomLeft]} />
        <View pointerEvents="none" style={[styles.corner, styles.cornerBottomRight]} />

        {/* Torch */}
        <Pressable
          style={styles.torchButton}
          onPress={() => {
            if (loading) {
              return;
            }
            Haptics.selectionAsync();
            setTorchOn((current) => !current);
          }}
          accessibilityRole="button"
          accessibilityLabel={torchOn ? 'Turn flashlight off' : 'Turn flashlight on'}
          accessibilityHint="Toggles the camera flashlight"
        >
          <MaterialCommunityIcons
            name={torchOn ? 'flashlight' : 'flashlight-off'}
            size={22}
            color={COLORS.surface}
          />
        </Pressable>

        {/* Help button */}
        <Pressable
          style={[styles.torchButton, { top: 16, right: 72 }]}
          onPress={() => {
            if (loading) return;
            Haptics.selectionAsync();
            setHelpVisible(true);
          }}
          accessibilityRole="button"
          accessibilityLabel="How to scan"
          accessibilityHint="Shows instructions for scanning QR codes"
        >
          <MaterialCommunityIcons
            name="help-circle-outline"
            size={22}
            color={COLORS.surface}
          />
        </Pressable>

        {loading && (
          <Animated.View entering={FadeIn} style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={COLORS.surface} />
            <Text style={styles.loadingText}>Finding surgery…</Text>
          </Animated.View>
        )}
      </View>

      <Pressable
        onPress={openManualEntry}
        style={styles.manualLinkCentered}
      >
        <MaterialCommunityIcons
          name="keyboard-outline"
          size={18}
          color={COLORS.primary}
        />
        <Text style={styles.manualLinkText}>Enter code manually</Text>
      </Pressable>

      {scanned && !loading && (
        <Animated.View entering={FadeInDown} exiting={FadeOutDown}>
          <Pressable
            onPress={handleRescan}
            style={styles.rescanButton}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.secondary]}
              style={styles.rescanButtonInner}
            >
              <MaterialCommunityIcons
                name="qrcode-scan"
                size={18}
                color={COLORS.surface}
              />
              <Text style={styles.rescanText}>Scan Again</Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      )}

      {/* Recent scans */}
      {recentScans.length > 0 && !loading && (
        <View style={styles.recentWrap}>
          <Text style={styles.recentTitle}>Recent scans</Text>
          <View style={styles.recentList}>
            {recentScans.map((s) => (
              <Pressable
                key={s.id}
                onPress={() => openRecentScan(s.surgeryId)}
                style={styles.recentItem}
                accessibilityRole="button"
                accessibilityLabel={`Open ${s.patientName ?? 'surgery'}`}
              >
                <MaterialCommunityIcons
                  name="file-document-outline"
                  size={18}
                  color={COLORS.primary}
                />
                <View style={styles.recentTextWrap}>
                  <Text style={styles.recentText}>
                    {s.patientName ?? 'Surgery'}
                  </Text>
                  <Text style={styles.recentSubtext}>
                    {new Date(s.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={20}
                  color={COLORS.textMuted}
                />
              </Pressable>
            ))}
          </View>
        </View>
      )}

      <ManualEntryModal
        visible={manualModalVisible}
        value={manualCode}
        loading={loading}
        onChangeText={setManualCode}
        onClose={closeManualEntry}
        onSubmit={handleManualSubmit}
      />

      {/* Help modal */}
      <Modal visible={helpVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.helpCard}>
            <View style={styles.helpHeader}>
              <Text style={styles.helpTitle}>How to scan</Text>
              <Pressable
                onPress={() => setHelpVisible(false)}
                style={styles.closeButton}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={20}
                  color={COLORS.textMuted}
                />
              </Pressable>
            </View>

            <View style={styles.helpStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.stepText}>
                Hold your phone steady and point the camera at the surgery QR code.
              </Text>
            </View>

            <View style={styles.helpStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepText}>
                Keep the QR code inside the square frame on the screen.
              </Text>
            </View>

            <View style={styles.helpStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.stepText}>
                Wait for the beep and checkmark. The app will open your surgery details.
              </Text>
            </View>

            <View style={styles.helpNote}>
              <MaterialCommunityIcons
                name="information-outline"
                size={18}
                color={COLORS.primary}
              />
              <Text style={styles.helpNoteText}>
                Only surgeries linked to your phone number can be opened.
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function ManualEntryModal({
  visible,
  value,
  loading,
  onChangeText,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  value: string;
  loading: boolean;
  onChangeText: (text: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <View style={styles.modalIcon}>
              <MaterialCommunityIcons
                name="qrcode-scan"
                size={22}
                color={COLORS.primary}
              />
            </View>

            <Pressable
              onPress={onClose}
              disabled={loading}
              style={styles.closeButton}
            >
              <MaterialCommunityIcons
                name="close"
                size={20}
                color={COLORS.textMuted}
              />
            </Pressable>
          </View>

          <Text style={styles.modalTitle}>Enter surgery QR code</Text>
          <Text style={styles.modalSubtitle}>
            Paste the full QR text you copied from your hospital.
          </Text>

          <TextInput
            style={styles.modalInput}
            placeholder="Paste QR code data..."
            placeholderTextColor={COLORS.textMuted}
            value={value}
            onChangeText={onChangeText}
            multiline
            autoFocus
            editable={!loading}
            textAlignVertical="top"
            maxLength={2000}
          />

          <Text style={styles.modalHint}>
            We'll only open surgeries linked to your phone number.
          </Text>

          <View style={styles.modalActions}>
            <Pressable
              onPress={onClose}
              disabled={loading}
              style={[styles.modalCancelButton, loading && styles.disabledButton]}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </Pressable>

            <Pressable
              onPress={onSubmit}
              disabled={loading}
              style={[styles.modalSubmitButton, loading && styles.disabledButton]}
            >
              {loading ? (
                <ActivityIndicator size="small" color={COLORS.surface} />
              ) : (
                <Text style={styles.modalSubmitText}>Look up surgery</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  centerLoader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },

  headerSpacer: {
    width: 48,
  },

  backButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  headerTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },

  headerTextWrap: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },

  title: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
    textAlign: 'center',
  },

  subtitle: {
    marginTop: 2,
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },

  helper: {
    marginTop: 2,
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    textAlign: 'center',
  },

  scannerContainer: {
    position: 'relative',
    flex: 1,
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 12,
    overflow: 'hidden',
    borderRadius: 24,
    backgroundColor: '#000',
  },

  dimOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },

  scanArea: {
    position: 'absolute',
    top: '50%',
    alignSelf: 'center',
    width: SCAN_SIZE,
    height: SCAN_SIZE,
    marginTop: -SCAN_SIZE / 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.primary,
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

  successOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 16,
    padding: 16,
  },

  successText: {
    marginTop: 8,
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.surface,
  },

  successSubtext: {
    marginTop: 2,
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.surface,
  },

  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: COLORS.primary,
  },

  cornerTopLeft: {
    top: 40,
    left: 40,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },

  cornerTopRight: {
    top: 40,
    right: 40,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },

  cornerBottomLeft: {
    bottom: 40,
    left: 40,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },

  cornerBottomRight: {
    right: 40,
    bottom: 40,
    borderRightWidth: 4,
    borderBottomWidth: 4,
  },

  torchButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: 'rgba(0,0,0,0.72)',
  },

  loadingText: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.surface,
  },

  manualLinkCentered: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    gap: 6,
  },

  manualLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    gap: 6,
  },

  manualLinkText: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: COLORS.primary,
  },

  rescanButton: {
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 32,
  },

  rescanButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
    borderRadius: 32,
  },

  rescanText: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.surface,
  },

  permissionWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },

  permissionIconCircle: {
    width: 96,
    height: 96,
    marginBottom: 8,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryLight,
  },

  permissionTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    textAlign: 'center',
  },

  message: {
    marginBottom: 16,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },

  gradientButton: {
    borderRadius: 32,
  },

  gradientButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    gap: 8,
    borderRadius: 32,
  },

  buttonText: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.surface,
  },

  recentWrap: {
    marginHorizontal: 24,
    marginBottom: 16,
  },

  recentTitle: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: COLORS.textMuted,
    marginBottom: 8,
  },

  recentList: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },

  recentTextWrap: {
    flex: 1,
  },

  recentText: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
  },

  recentSubtext: {
    marginTop: 2,
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
  },

  modalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },

  modalCard: {
    width: '100%',
    padding: 24,
    borderRadius: 24,
    backgroundColor: COLORS.surface,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  modalIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryLight,
  },

  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },

  modalTitle: {
    fontSize: 17,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },

  modalSubtitle: {
    marginTop: 4,
    marginBottom: 16,
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
  },

  modalInput: {
    minHeight: 120,
    padding: 14,
    borderRadius: 14,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.text,
  },

  modalHint: {
    marginTop: 8,
    marginBottom: 10,
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
  },

  modalActions: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 10,
  },

  modalCancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  modalCancelText: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: COLORS.textSecondary,
  },

  modalSubmitButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
  },

  modalSubmitText: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: COLORS.surface,
  },

  disabledButton: {
    opacity: 0.55,
  },

  helpCard: {
    width: '100%',
    padding: 24,
    borderRadius: 24,
    backgroundColor: COLORS.surface,
  },

  helpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },

  helpTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },

  helpStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },

  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryLight,
  },

  stepNumberText: {
    fontSize: 13,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
  },

  stepText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: FONTS.regular,
    color: COLORS.text,
  },

  helpNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
  },

  helpNoteText: {
    flex: 1,
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.text,
  },
});