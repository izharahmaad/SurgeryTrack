import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Text, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS } from '@/constants';

const { width, height } = Dimensions.get('window');

interface Props {
  onFinish?: () => void;
}

export default function AnimatedSplash({ onFinish = () => {} }: Props) {
  const iconScale = useRef(new Animated.Value(0.6)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const glowScale = useRef(new Animated.Value(0.8)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslate = useRef(new Animated.Value(12)).current;
  const exitOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(iconScale, { toValue: 1, friction: 6, tension: 60, useNativeDriver: true }),
        Animated.timing(iconOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(glowOpacity, { toValue: 0.6, duration: 700, useNativeDriver: true }),
        Animated.timing(glowScale, { toValue: 1.3, duration: 900, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(textOpacity, { toValue: 1, duration: 450, useNativeDriver: true }),
        Animated.spring(textTranslate, { toValue: 0, friction: 7, tension: 50, useNativeDriver: true }),
      ]),
      Animated.delay(500),
      Animated.timing(exitOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start(() => {
      if (typeof onFinish === 'function') {
        onFinish();
      }
    });
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: exitOpacity }]}>
      <LinearGradient
        colors={[COLORS.primaryLight, COLORS.background]}
        style={styles.gradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      <View style={styles.center}>
        <Animated.View
          style={[
            styles.glow,
            { opacity: glowOpacity, transform: [{ scale: glowScale }] },
          ]}
        />

        <Animated.View
          style={[
            styles.iconRing,
            { opacity: iconOpacity, transform: [{ scale: iconScale }] },
          ]}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.secondary]}
            style={styles.iconGradientBg}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <MaterialCommunityIcons name="heart-pulse" size={52} color={COLORS.surface} />
          </LinearGradient>
        </Animated.View>

        <Animated.View style={{ opacity: textOpacity, transform: [{ translateY: textTranslate }] }}>
          <Text style={styles.title}>SurgeryTrack</Text>
          <Text style={styles.tagline}>Every second, together</Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width,
    height,
    zIndex: 999,
    backgroundColor: COLORS.background,
  },
  gradient: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  glow: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: COLORS.primary,
  },
  iconRing: {
    width: 108,
    height: 108,
    borderRadius: 54,
    marginBottom: 24,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  iconGradientBg: {
    width: 108,
    height: 108,
    borderRadius: 54,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  tagline: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 6,
    letterSpacing: 0.3,
  },
});