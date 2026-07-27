import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';
import { COLORS, FONTS } from '@/constants';
import { useAuthStore } from '@/hooks/useAuthStore';
import { UserRole } from '@/types';

type AuthMode = 'signin' | 'signup' | 'forgot';

const PRIVACY_POLICY_URL = 'https://surgerytrack.app/privacy';
const TERMS_URL = 'https://surgerytrack.app/terms';

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { login, register, forgotPassword } = useAuthStore();

  const initialMode: AuthMode = route.params?.mode || 'signin';
  const initialRole: UserRole = route.params?.role || 'family';

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [role] = useState<UserRole>(initialRole);

  useEffect(() => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setName('');
    setPhone('');
    setShowPassword(false);
    setAgreedToTerms(false);
  }, [mode]);

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      Toast.show({ type: 'error', text1: 'Please enter email and password' });
      return;
    }
    if (!validateEmail(email)) {
      Toast.show({ type: 'error', text1: 'Please enter a valid email' });
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({ type: 'success', text1: 'Welcome back to SurgeryTrack!' });
      navigation.navigate('Dashboard');
    } catch (error: any) {
      console.error('Sign in error:', error.code, error.message);
      const msg = error?.code === 'auth/user-not-found'
        ? 'No account found with this email'
        : error?.code === 'auth/wrong-password'
        ? 'Incorrect password'
        : error?.code === 'auth/invalid-credential'
        ? 'Invalid email or password'
        : error?.code === 'auth/invalid-email'
        ? 'Invalid email format'
        : error?.code === 'auth/user-disabled'
        ? 'This account has been disabled'
        : error?.code === 'auth/too-many-requests'
        ? 'Too many attempts. Try again later.'
        : error?.message || 'Login failed. Please try again.';
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({ type: 'error', text1: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!name.trim()) {
      Toast.show({ type: 'error', text1: 'Please enter your full name' });
      return;
    }
    if (!email.trim()) {
      Toast.show({ type: 'error', text1: 'Please enter your email' });
      return;
    }
    if (!validateEmail(email)) {
      Toast.show({ type: 'error', text1: 'Please enter a valid email' });
      return;
    }
    if (!phone.trim()) {
      Toast.show({ type: 'error', text1: 'Please enter your phone number' });
      return;
    }
    if (!password.trim()) {
      Toast.show({ type: 'error', text1: 'Please enter a password' });
      return;
    }
    if (password.length < 6) {
      Toast.show({ type: 'error', text1: 'Password must be at least 6 characters' });
      return;
    }
    if (password !== confirmPassword) {
      Toast.show({ type: 'error', text1: 'Passwords do not match' });
      return;
    }
    if (!agreedToTerms) {
      Toast.show({ type: 'error', text1: 'Please agree to the Terms and Privacy Policy' });
      return;
    }

    setLoading(true);
    try {
      await register(email.trim(), password, name.trim(), role, phone.trim());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({ type: 'success', text1: 'Account created successfully!' });
      navigation.navigate('Dashboard');
    } catch (error: any) {
      console.error('Sign up error:', error.code, error.message);
      const errorCode = error?.code || '';
      const errorMessage = error?.message || '';
      let msg: string;

      if (errorCode === 'auth/email-already-in-use') {
        msg = 'An account already exists with this email. Please sign in instead.';
      } else if (errorCode === 'auth/invalid-email') {
        msg = 'Invalid email address format.';
      } else if (errorCode === 'auth/weak-password') {
        msg = 'Password is too weak. Use at least 6 characters.';
      } else if (errorCode === 'auth/operation-not-allowed') {
        msg = 'Email/password accounts are not enabled. Contact support.';
      } else if (errorCode === 'auth/network-request-failed') {
        msg = 'Network error. Check your internet connection.';
      } else if (errorCode === 'auth/timeout') {
        msg = 'Request timed out. Please try again.';
      } else if (errorCode === 'permission-denied') {
        msg = 'Permission denied. Check Firebase rules.';
      } else if (errorMessage.includes('Firebase: Error (auth/email-already-in-use)')) {
        msg = 'This email is already registered. Please sign in.';
      } else {
        msg = errorMessage || 'Registration failed. Please try again.';
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({ type: 'error', text1: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Toast.show({ type: 'error', text1: 'Please enter your email' });
      return;
    }
    if (!validateEmail(email)) {
      Toast.show({ type: 'error', text1: 'Please enter a valid email' });
      return;
    }

    setLoading(true);
    try {
      await forgotPassword(email.trim());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({
        type: 'success',
        text1: 'Password reset email sent!',
        text2: 'Check your inbox and spam folder',
      });
      setMode('signin');
    } catch (error: any) {
      console.error('Forgot password error:', error.code, error.message);
      const msg = error?.code === 'auth/user-not-found'
        ? 'No account found with this email'
        : error?.code === 'auth/invalid-email'
        ? 'Invalid email address'
        : error?.message || 'Failed to send reset email';
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({ type: 'error', text1: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (mode === 'signin') handleSignIn();
    else if (mode === 'signup') handleSignUp();
    else handleForgotPassword();
  };

  const handleBack = () => {
    Haptics.selectionAsync();
    if (mode === 'signup') {
      navigation.navigate('RoleSelection');
    } else {
      navigation.goBack();
    }
  };

  const getTitle = () => {
    if (mode === 'signin') return 'Welcome Back';
    if (mode === 'signup') return 'Create Account';
    return 'Reset Password';
  };

  const getSubtitle = () => {
    if (mode === 'signin') return 'Sign in to your account';
    if (mode === 'signup') return `Register as ${role.replace('_', ' ')}`;
    return 'Enter your email to reset password';
  };

  const getButtonText = () => {
    if (mode === 'signin') return 'Sign In';
    if (mode === 'signup') return 'Create Account';
    return 'Send Reset Link';
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable
            style={({ pressed }) => [styles.backCircle, pressed && { opacity: 0.6 }]}
            onPress={handleBack}
          >
            <MaterialCommunityIcons name="arrow-left" size={20} color={COLORS.text} />
          </Pressable>

          <View style={styles.centerContent}>
            <View style={styles.header}>
              <View style={styles.logoRing}>
                <LinearGradient
                  colors={[COLORS.primary, COLORS.secondary]}
                  style={styles.logoGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <MaterialCommunityIcons name="shield-plus" size={34} color={COLORS.surface} />
                </LinearGradient>
              </View>
              <Text style={styles.title}>{getTitle()}</Text>
              <Text style={styles.subtitle}>{getSubtitle()}</Text>
            </View>

            <View style={styles.form}>
              {mode === 'signup' && (
                <View style={styles.inputContainer}>
                  <View style={styles.inputIconCircle}>
                    <MaterialCommunityIcons name="account-outline" size={18} color={COLORS.primary} />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Full Name"
                    placeholderTextColor={COLORS.textMuted}
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    editable={!loading}
                  />
                </View>
              )}

              <View style={styles.inputContainer}>
                <View style={styles.inputIconCircle}>
                  <MaterialCommunityIcons name="email-outline" size={18} color={COLORS.primary} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Email Address"
                  placeholderTextColor={COLORS.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  editable={!loading}
                />
              </View>

              {mode === 'signup' && (
                <View style={styles.inputContainer}>
                  <View style={styles.inputIconCircle}>
                    <MaterialCommunityIcons name="phone-outline" size={18} color={COLORS.primary} />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Phone Number"
                    placeholderTextColor={COLORS.textMuted}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    editable={!loading}
                  />
                </View>
              )}

              {mode !== 'forgot' && (
                <View style={styles.inputContainer}>
                  <View style={styles.inputIconCircle}>
                    <MaterialCommunityIcons name="lock-outline" size={18} color={COLORS.primary} />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor={COLORS.textMuted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoComplete={mode === 'signup' ? 'new-password' : 'password'}
                    editable={!loading}
                  />
                  <Pressable onPress={() => setShowPassword(!showPassword)} disabled={loading}>
                    <MaterialCommunityIcons
                      name={showPassword ? 'eye-off' : 'eye'}
                      size={20}
                      color={COLORS.textMuted}
                    />
                  </Pressable>
                </View>
              )}

              {mode === 'signup' && (
                <View style={styles.inputContainer}>
                  <View style={styles.inputIconCircle}>
                    <MaterialCommunityIcons name="lock-check-outline" size={18} color={COLORS.primary} />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm Password"
                    placeholderTextColor={COLORS.textMuted}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showPassword}
                    editable={!loading}
                  />
                </View>
              )}

              {mode === 'signin' && (
                <Pressable onPress={() => setMode('forgot')} style={styles.forgotLink} disabled={loading}>
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </Pressable>
              )}

              {mode === 'signup' && (
                <Pressable
                  style={styles.consentRow}
                  onPress={() => setAgreedToTerms(!agreedToTerms)}
                  disabled={loading}
                >
                  <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
                    {agreedToTerms && (
                      <MaterialCommunityIcons name="check" size={14} color={COLORS.surface} />
                    )}
                  </View>
                  <Text style={styles.consentText}>
                    I agree to the{' '}
                    <Text style={styles.consentLink} onPress={() => Linking.openURL(TERMS_URL)}>
                      Terms of Service
                    </Text>{' '}
                    and{' '}
                    <Text style={styles.consentLink} onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}>
                      Privacy Policy
                    </Text>
                  </Text>
                </Pressable>
              )}

              <Pressable
                onPress={handleSubmit}
                disabled={loading}
                style={({ pressed }) => [pressed && !loading && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
              >
                <LinearGradient
                  colors={loading ? [COLORS.border, COLORS.border] : [COLORS.primary, COLORS.secondary]}
                  style={styles.button}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {loading ? (
                    <ActivityIndicator color={COLORS.surface} />
                  ) : (
                    <>
                      <Text style={styles.buttonText}>{getButtonText()}</Text>
                      <View style={styles.arrowCircle}>
                        <MaterialCommunityIcons name="arrow-right" size={16} color={COLORS.primary} />
                      </View>
                    </>
                  )}
                </LinearGradient>
              </Pressable>

              <View style={styles.switchContainer}>
                {mode === 'signin' ? (
                  <>
                    <Text style={styles.switchText}>Don't have an account? </Text>
                    <Pressable onPress={() => navigation.navigate('RoleSelection')} disabled={loading}>
                      <Text style={styles.switchLink}>Sign Up</Text>
                    </Pressable>
                  </>
                ) : mode === 'signup' ? (
                  <>
                    <Text style={styles.switchText}>Already have an account? </Text>
                    <Pressable onPress={() => setMode('signin')} disabled={loading}>
                      <Text style={styles.switchLink}>Sign In</Text>
                    </Pressable>
                  </>
                ) : (
                  <>
                    <Text style={styles.switchText}>Remember your password? </Text>
                    <Pressable onPress={() => setMode('signin')} disabled={loading}>
                      <Text style={styles.switchLink}>Sign In</Text>
                    </Pressable>
                  </>
                )}
              </View>

              <View style={styles.legalFooter}>
                <MaterialCommunityIcons name="lock-check-outline" size={13} color={COLORS.textMuted} />
                <Text style={styles.legalFooterText}>
                  Your data is encrypted and HIPAA-compliant
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  backCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  centerContent: { flex: 1, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 32 },
  logoRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 6,
  },
  logoGradient: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 26, fontFamily: FONTS.bold, color: COLORS.text, marginBottom: 6, letterSpacing: -0.3 },
  subtitle: { fontSize: 14, fontFamily: FONTS.regular, color: COLORS.textMuted },
  form: { gap: 4 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  inputIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: { flex: 1, paddingVertical: 14, fontSize: 15, fontFamily: FONTS.regular, color: COLORS.text },
  forgotLink: { alignSelf: 'flex-end', marginBottom: 16, marginTop: 4 },
  forgotText: { fontSize: 14, fontFamily: FONTS.medium, color: COLORS.primary },
  consentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 20, marginTop: 4 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  checkboxChecked: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  consentText: { flex: 1, fontSize: 13, fontFamily: FONTS.regular, color: COLORS.textSecondary, lineHeight: 19 },
  consentLink: { fontFamily: FONTS.semiBold, color: COLORS.primary },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 32,
    paddingVertical: 18,
    marginTop: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 6,
  },
  buttonText: { color: COLORS.surface, fontSize: 16, fontFamily: FONTS.bold, marginRight: 10 },
  arrowCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24, alignItems: 'center' },
  switchText: { fontSize: 14, fontFamily: FONTS.regular, color: COLORS.textSecondary },
  switchLink: { fontSize: 14, fontFamily: FONTS.semiBold, color: COLORS.primary },
  legalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 24,
  },
  legalFooterText: { fontSize: 11.5, fontFamily: FONTS.regular, color: COLORS.textMuted },
});