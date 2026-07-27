import React from 'react';
import { View, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants';

interface STInputProps extends TextInputProps {
  icon?: string;
}

export default function STInput({ icon, style, ...props }: STInputProps) {
  return (
    <View style={styles.container}>
      {icon ? (
        <MaterialCommunityIcons
          name={icon as any}
          size={20}
          color={COLORS.textMuted}
          style={styles.icon}
        />
      ) : null}

      <TextInput
        {...props}
        style={[styles.input, style]}
        placeholderTextColor={COLORS.textMuted}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Poppins-Regular',
    color: COLORS.text,
  },
});