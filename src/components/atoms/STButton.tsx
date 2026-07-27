import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import { COLORS } from '../../constants';

type Variant = 'primary' | 'secondary' | 'outline';

interface STButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle | ViewStyle[];
}

export default function STButton({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
}: STButtonProps) {
  const isOutline = variant === 'outline';

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        isOutline && styles.outline,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isOutline ? COLORS.primary : COLORS.surface} />
      ) : (
        <Text
          style={[
            styles.text,
            isOutline ? styles.outlineText : styles.filledText,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: COLORS.primary,
  },
  secondary: {
    backgroundColor: COLORS.secondary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  text: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
  },
  filledText: {
    color: COLORS.surface,
  },
  outlineText: {
    color: COLORS.primary,
  },
  disabled: {
    opacity: 0.6,
  },
});