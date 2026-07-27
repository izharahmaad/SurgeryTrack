import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants';
import STText from '../atoms/STText';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onBackPress?: () => void;
  onRightPress?: () => void;
  rightIcon?: string;
}

export default function Header({
  title,
  subtitle,
  onBackPress,
  onRightPress,
  rightIcon = 'bell-outline',
}: HeaderProps) {
  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.side}>
          {onBackPress ? (
            <TouchableOpacity onPress={onBackPress} style={styles.iconBtn}>
              <MaterialCommunityIcons
                name="arrow-left"
                size={24}
                color={COLORS.text}
              />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.center}>
          <STText variant="h2" style={styles.title}>
            {title}
          </STText>
          {subtitle ? <STText variant="caption">{subtitle}</STText> : null}
        </View>

        <View style={[styles.side, styles.rightWrap]}>
          {onRightPress ? (
            <TouchableOpacity onPress={onRightPress} style={styles.iconBtn}>
              <MaterialCommunityIcons
                name={rightIcon as any}
                size={22}
                color={COLORS.primary}
              />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: COLORS.background,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
    paddingTop: 8,
  },
  side: {
    width: 48,
  },
  center: {
    flex: 1,
  },
  rightWrap: {
    alignItems: 'flex-end',
  },
  title: {
    color: COLORS.primary,
    fontSize: 24,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});