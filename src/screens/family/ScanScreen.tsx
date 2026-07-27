import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { COLORS } from '../../constants';
import { getSurgeryByQrData } from '../../services/surgery';
import Toast from 'react-native-toast-message';

export default function ScanScreen() {
  const navigation = useNavigation();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.message}>Loading camera permissions...</Text>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <MaterialCommunityIcons name="camera-off" size={64} color={COLORS.error} />
        <Text style={styles.message}>Camera permission is required to scan QR codes.</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // FIX: Always keep the callback attached, just guard with scanned flag
  const handleBarcodeScanned = useCallback(
    async ({ data }: { data: string }) => {
      if (scanned || loading) return;

      setScanned(true);
      setLoading(true);
      try {
        const surgery = await getSurgeryByQrData(data);
        if (surgery) {
          Toast.show({ type: 'success', text1: `Found: ${surgery.patientName}` });
          // Optional: navigate to surgery detail
          // navigation.navigate('SurgeryDetail', { surgeryId: surgery.id });
        } else {
          Toast.show({ type: 'error', text1: 'Invalid QR code or surgery not found' });
        }
      } catch (error) {
        Toast.show({ type: 'error', text1: 'Error scanning QR code' });
      } finally {
        setLoading(false);
      }
    },
    [scanned, loading, navigation]
  );

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
          // FIX: Always pass the callback, never undefined
          onBarcodeScanned={handleBarcodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
        />
        <View style={styles.overlay}>
          <View style={styles.scanArea} />
        </View>
        <View style={[styles.corner, styles.cornerTopLeft]} />
        <View style={[styles.corner, styles.cornerTopRight]} />
        <View style={[styles.corner, styles.cornerBottomLeft]} />
        <View style={[styles.corner, styles.cornerBottomRight]} />
      </View>

      {scanned && (
        <TouchableOpacity style={styles.rescanButton} onPress={() => setScanned(false)}>
          <Text style={styles.rescanText}>Tap to Scan Again</Text>
        </TouchableOpacity>
      )}

      {loading && (
        <View style={styles.loadingOverlay}>
          <MaterialCommunityIcons name="loading" size={32} color={COLORS.surface} />
          <Text style={styles.loadingText}>Finding surgery...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: 24, alignItems: 'center' },
  title: { fontSize: 24, fontFamily: 'Poppins-Bold', color: COLORS.primary },
  subtitle: { fontSize: 14, fontFamily: 'Poppins-Regular', color: COLORS.textSecondary, marginTop: 4 },
  scannerContainer: { flex: 1, margin: 24, borderRadius: 24, overflow: 'hidden', position: 'relative' },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  scanArea: { width: 250, height: 250, borderRadius: 16, borderWidth: 2, borderColor: COLORS.primary, backgroundColor: 'transparent' },
  corner: { position: 'absolute', width: 40, height: 40, borderColor: COLORS.primary },
  cornerTopLeft: { top: 40, left: 40, borderTopWidth: 4, borderLeftWidth: 4 },
  cornerTopRight: { top: 40, right: 40, borderTopWidth: 4, borderRightWidth: 4 },
  cornerBottomLeft: { bottom: 40, left: 40, borderBottomWidth: 4, borderLeftWidth: 4 },
  cornerBottomRight: { bottom: 40, right: 40, borderBottomWidth: 4, borderRightWidth: 4 },
  rescanButton: { backgroundColor: COLORS.primary, margin: 24, padding: 16, borderRadius: 16, alignItems: 'center' },
  rescanText: { color: COLORS.surface, fontSize: 16, fontFamily: 'Poppins-Bold' },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: COLORS.surface, fontSize: 18, fontFamily: 'Poppins-Bold' },
  message: { fontSize: 16, fontFamily: 'Poppins-Regular', color: COLORS.textSecondary, textAlign: 'center', margin: 24 },
  button: { backgroundColor: COLORS.primary, margin: 24, padding: 16, borderRadius: 16, alignItems: 'center' },
  buttonText: { color: COLORS.surface, fontSize: 16, fontFamily: 'Poppins-Bold' },
});