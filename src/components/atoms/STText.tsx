import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { COLORS } from '../../constants';

type Variant = 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'label';

interface STTextProps {
  children: React.ReactNode;
  variant?: Variant;
  style?: TextStyle | TextStyle[];
  color?: string;
  center?: boolean;
}

export default function STText({
  children,
  variant = 'body',
  style,
  color,
  center = false,
}: STTextProps) {
  return (
    <Text
      style={[
        styles.base,
        styles[variant],
        color ? { color } : null,
        center ? { textAlign: 'center' } : null,
        style,
      ]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    color: COLORS.text,
  },
  h1: {
    fontSize: 32,
    fontFamily: 'Poppins-Bold',
  },
  h2: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
  },
  h3: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
  },
  body: {
    fontSize: 15,
    fontFamily: 'Poppins-Regular',
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  caption: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: COLORS.textMuted,
  },
  label: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: COLORS.textSecondary,
  },
});