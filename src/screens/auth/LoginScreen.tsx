import React, { useEffect, useState } from 'react';

import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';

import { COLORS, FONTS } from '../../constants';
import { useAuthStore } from '../../hooks/useAuthStore';
import type { UserRole } from '../../types';

type AuthMode = 'signin' | 'signup' | 'forgot';

const TERMS_URL = 'https://surgerytrack.app/terms';
const PRIVACY_URL = 'https://surgerytrack.app/privacy';

function getAuthErrorMessage(error: any): string {
  switch (error?.code) {
    case 'auth/invalid-credential':
      return 'Invalid email or password.';
    case 'auth/user-not-found':
      return 'No account found with this email.';
    case 'auth/wrong-password':
      return 'Incorrect password.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/email-already-in-use':
      return 'This email is already registered.';
    case 'auth/weak-password':
      return 'Password must contain at least 6 characters.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Check your internet connection.';
    default:
      return error?.message || 'Something went wrong. Please try again.';
  }
}

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const { login, register, forgotPassword } = useAuthStore();

  const initialMode: AuthMode = route.params?.mode || 'signin';
  const initialRole: UserRole = route.params?.role || 'family';

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [role] = useState<UserRole>(initialRole);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setErrors({});
  }, [mode]);

  const setFieldError = (field: string, message: string) => {
    setErrors((previous) => ({
      ...previous,
      [field]: message,
    }));
  };

  const clearFieldError = (field: string) => {
    if (!errors[field]) return;

    setErrors((previous) => {
      const next = { ...previous };
      delete next[field];
      return next;
    });
  };

  const isValidEmail = (value: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (mode === 'signup' && !name.trim()) {
      nextErrors.name = 'Full name is required.';
    }

    if (!email.trim()) {
      nextErrors.email = 'Email is required.';
    } else if (!isValidEmail(email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (mode === 'signup' && !phone.trim()) {
      nextErrors.phone = 'Phone number is required.';
    }

    if (mode !== 'forgot' && !password) {
      nextErrors.password = 'Password is required.';
    }

    if (mode !== 'forgot' && password.length < 6) {
      nextErrors.password = 'Password must contain at least 6 characters.';
    }

    if (mode === 'signup' && password !== confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }

    if (mode === 'signup' && !agreed) {
      nextErrors.agreed = 'Please accept the terms and privacy policy.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submit = async () => {
    if (loading || !validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      if (mode === 'signin') {
        await login(email.trim(), password);

        Toast.show({
          type: 'success',
          text1: 'Welcome back to SurgeryTrack',
        });
      }

      if (mode === 'signup') {
        await register(email.trim(), password, name.trim(), role, phone.trim());

        Toast.show({
          type: 'success',
          text1: 'Account created successfully',
        });
      }

      if (mode === 'forgot') {
        await forgotPassword(email.trim());

        Toast.show({
          type: 'success',
          text1: 'Reset email sent',
          text2: 'Check your inbox and spam folder.',
        });

        setMode('signin');
        setPassword('');
        return;
      }
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      Toast.show({
        type: 'error',
        text1: 'Authentication failed',
        text2: getAuthErrorMessage(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    Haptics.selectionAsync();

    if (mode === 'forgot') {
      setMode('signin');
      return;
    }

    navigation.goBack();
  };

  const title =
    mode === 'signin'
      ? 'Welcome Back'
      : mode === 'signup'
      ? 'Create Account'
      : 'Reset Password';

  const subtitle =
    mode === 'signin'
      ? 'Sign in to continue to SurgeryTrack'
      : mode === 'signup'
      ? `Create your ${role.replace('_', ' ')} account`
      : 'Enter your email and we will send you a reset link';

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top Row */}
          <View style={styles.topRow}>
            <Pressable
              onPress={handleBack}
              style={styles.backButton}
              disabled={loading}
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={20}
                color={COLORS.text}
              />
            </Pressable>

            <View style={styles.secureBadge}>
              <MaterialCommunityIcons
                name="shield-check-outline"
                size={14}
                color={COLORS.success}
              />
              <Text style={styles.secureText}>Secure access</Text>
            </View>
          </View>

          {/* Brand */}
          <View style={styles.brandWrap}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.secondary]}
              style={styles.logo}
            >
              <MaterialCommunityIcons
                name="hospital-box-outline"
                size={32}
                color={COLORS.surface}
              />
            </LinearGradient>

            <Text style={styles.brandName}>SurgeryTrack</Text>
          </View>

          {/* Heading */}
          <View style={styles.headingWrap}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {mode === 'signup' && (
              <Field
                icon="account-outline"
                placeholder="Full name"
                value={name}
                onChangeText={(value) => {
                  setName(value);
                  clearFieldError('name');
                }}
                error={errors.name}
                autoCapitalize="words"
                editable={!loading}
              />
            )}

            <Field
              icon="email-outline"
              placeholder="Email address"
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                clearFieldError('email');
              }}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />

            {mode === 'signup' && (
              <Field
                icon="phone-outline"
                placeholder="Phone number"
                value={phone}
                onChangeText={(value) => {
                  setPhone(value);
                  clearFieldError('phone');
                }}
                error={errors.phone}
                keyboardType="phone-pad"
                editable={!loading}
              />
            )}

            {mode !== 'forgot' && (
              <>
                <View>
                  <Field
                    icon="lock-outline"
                    placeholder="Password"
                    value={password}
                    onChangeText={(value) => {
                      setPassword(value);
                      clearFieldError('password');
                    }}
                    error={errors.password}
                    secureTextEntry={!showPassword}
                    editable={!loading}
                    rightIcon={
                      showPassword ? 'eye-off-outline' : 'eye-outline'
                    }
                    onRightIconPress={() =>
                      setShowPassword((value) => !value)
                    }
                  />
                </View>

                {mode === 'signup' && (
                  <Field
                    icon="lock-check-outline"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChangeText={(value) => {
                      setConfirmPassword(value);
                      clearFieldError('confirmPassword');
                    }}
                    error={errors.confirmPassword}
                    secureTextEntry={!showPassword}
                    editable={!loading}
                  />
                )}
              </>
            )}

            {mode === 'signin' && (
              <Pressable
                style={styles.forgotButton}
                onPress={() => setMode('forgot')}
                disabled={loading}
              >
                <Text style={styles.forgotText}>Forgot password?</Text>
              </Pressable>
            )}

            {mode === 'signup' && (
              <Pressable
                style={styles.termsRow}
                onPress={() => {
                  setAgreed((value) => !value);
                  clearFieldError('agreed');
                }}
                disabled={loading}
              >
                <View
                  style={[
                    styles.checkbox,
                    agreed && styles.checkboxActive,
                  ]}
                >
                  {agreed && (
                    <MaterialCommunityIcons
                      name="check"
                      size={14}
                      color={COLORS.surface}
                    />
                  )}
                </View>

                <Text style={styles.termsText}>
                  I agree to the{' '}
                  <Text
                    style={styles.link}
                    onPress={() => Linking.openURL(TERMS_URL)}
                  >
                    Terms of Service
                  </Text>{' '}
                  and{' '}
                  <Text
                    style={styles.link}
                    onPress={() => Linking.openURL(PRIVACY_URL)}
                  >
                    Privacy Policy
                  </Text>
                </Text>
              </Pressable>
            )}

            {!!errors.agreed && (
              <Text style={styles.formError}>{errors.agreed}</Text>
            )}

            <Pressable
              style={({ pressed }) => [
                styles.submitButton,
                pressed && styles.submitPressed,
                loading && styles.submitDisabled,
              ]}
              onPress={submit}
              disabled={loading}
            >
              <LinearGradient
                colors={
                  loading
                    ? [COLORS.textMuted, COLORS.textMuted]
                    : [COLORS.primary, COLORS.secondary]
                }
                style={styles.submitGradient}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.surface} />
                ) : (
                  <>
                    <Text style={styles.submitText}>
                      {mode === 'signin'
                        ? 'Sign In'
                        : mode === 'signup'
                        ? 'Create Account'
                        : 'Send Reset Link'}
                    </Text>
                    <MaterialCommunityIcons
                      name="arrow-right"
                      size={20}
                      color={COLORS.surface}
                    />
                  </>
                )}
              </LinearGradient>
            </Pressable>

            <View style={styles.switchRow}>
              <Text style={styles.switchText}>
                {mode === 'signin'
                  ? "Don't have an account?"
                  : mode === 'signup'
                  ? 'Already have an account?'
                  : 'Remember your password?'}
              </Text>

              <Pressable
                onPress={() => {
                  setMode(mode === 'signup' ? 'signin' : 'signup');
                  setErrors({});
                }}
                disabled={loading}
              >
                <Text style={styles.switchLink}>
                  {mode === 'signin' ? 'Sign Up' : 'Sign In'}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <MaterialCommunityIcons
              name="lock-check-outline"
              size={14}
              color={COLORS.textMuted}
            />
            <Text style={styles.footerText}>
              Your account is protected by Firebase Authentication
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type FieldProps = {
  icon: string;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words';
  editable?: boolean;
};

function Field({
  icon,
  placeholder,
  value,
  onChangeText,
  error,
  rightIcon,
  onRightIconPress,
  secureTextEntry,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  editable = true,
}: FieldProps) {
  return (
    <View style={styles.fieldGroup}>
      <View style={[styles.field, error && styles.fieldError]}>
        <MaterialCommunityIcons
          name={icon as any}
          size={20}
          color={error ? COLORS.error : COLORS.primary}
        />

        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          editable={editable}
        />

        {rightIcon && onRightIconPress && (
          <Pressable onPress={onRightIconPress} hitSlop={10}>
            <MaterialCommunityIcons
              name={rightIcon as any}
              size={20}
              color={COLORS.textMuted}
            />
          </Pressable>
        )}
      </View>

      {!!error && <Text style={styles.formError}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  flex: {
    flex: 1,
  },

  content: {
    flexGrow: 1,
    padding: 20,
  },

  // Top Row
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },

  secureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: `${COLORS.success}18`,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: `${COLORS.success}25`,
  },

  secureText: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    color: COLORS.success,
  },

  // Brand
  brandWrap: {
    alignItems: 'center',
    marginTop: 24,
  },

  logo: {
    width: 64,
    height: 64,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },

  brandName: {
    fontSize: 17,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
    marginTop: 10,
  },

  // Heading
  headingWrap: {
    alignItems: 'center',
    marginTop: 22,
    marginBottom: 22,
  },

  title: {
    fontSize: 26,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },

  subtitle: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: 6,
    textAlign: 'center',
  },

  // Form
  form: {
    gap: 2,
  },

  fieldGroup: {
    marginBottom: 10,
  },

  field: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  fieldError: {
    borderColor: COLORS.error,
  },

  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.text,
    paddingVertical: 14,
  },

  formError: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    color: COLORS.error,
    marginTop: 5,
    marginLeft: 5,
  },

  forgotButton: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
  },

  forgotText: {
    fontSize: 13,
    fontFamily: FONTS.semiBold,
    color: COLORS.primary,
  },

  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 8,
    marginBottom: 4,
  },

  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },

  checkboxActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  termsText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },

  link: {
    fontFamily: FONTS.semiBold,
    color: COLORS.primary,
  },

  submitButton: {
    marginTop: 18,
    borderRadius: 16,
    overflow: 'hidden',
  },

  submitGradient: {
    minHeight: 54,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },

  submitPressed: {
    transform: [{ scale: 0.98 }],
  },

  submitDisabled: {
    opacity: 0.75,
  },

  submitText: {
    color: COLORS.surface,
    fontSize: 15,
    fontFamily: FONTS.bold,
  },

  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    marginTop: 20,
  },

  switchText: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },

  switchLink: {
    fontSize: 13,
    fontFamily: FONTS.semiBold,
    color: COLORS.primary,
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 24,
  },

  footerText: {
    fontSize: 10,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
  },
});