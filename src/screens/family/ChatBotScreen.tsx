import React, {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import Animated, {
  FadeIn,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import Toast from 'react-native-toast-message';

import { COLORS, FONTS } from '../../constants';
import type { ChatMessage } from '../../types';
import { askMedicalAI } from '../../services/ai';

const MAX_HISTORY_MESSAGES = 12;

function TypingDot() {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 400 }),
        withTiming(0.3, { duration: 400 })
      ),
      -1,
      false
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.typingDot,
        animatedStyle,
      ]}
    />
  );
}

function toSafeDate(value: unknown): Date {
  if (value instanceof Date) {
    return value;
  }

  if (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof (
      value as { toDate?: unknown }
    ).toDate === 'function'
  ) {
    return (
      value as { toDate: () => Date }
    ).toDate();
  }

  const date = new Date(value as string | number);

  return Number.isNaN(date.getTime())
    ? new Date()
    : date;
}

function formatTime(value: unknown): string {
  return toSafeDate(value).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

const createWelcomeMessage = (): ChatMessage => ({
  id: `welcome-${Date.now()}`,
  role: 'model',
  text:
    'Hello! I am SurgeryTrack AI. I can help explain surgeries, procedures, and recovery information in simple language.\n\nPlease note: I am not a doctor. Always consult your healthcare provider for medical advice.',
  timestamp: new Date(),
});

export default function ChatBotScreen() {
  const navigation = useNavigation<any>();
  const scrollViewRef = useRef<ScrollView>(null);

  const [messages, setMessages] = useState<
    ChatMessage[]
  >([createWelcomeMessage()]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [failedMessage, setFailedMessage] =
    useState<string | null>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({
        animated: true,
      });
    }, 100);
  };

  const sendToAI = async (
    trimmedMessage: string,
    historySource: ChatMessage[]
  ) => {
    setLoading(true);
    setFailedMessage(null);

    try {
      const history = historySource
        .slice(-MAX_HISTORY_MESSAGES)
        .map((message) => ({
          role: message.role,
          text: message.text,
        }));

      const response = await askMedicalAI(
        trimmedMessage,
        history
      );

      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'model',
        text: response,
        timestamp: new Date(),
      };

      setMessages((current) => [
        ...current,
        botMessage,
      ]);

      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      );

      scrollToBottom();
    } catch (error: unknown) {
      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Error
      );

      setFailedMessage(trimmedMessage);

      const message =
        error instanceof Error
          ? error.message
          : 'Failed to get response.';

      Toast.show({
        type: 'error',
        text1: 'AI Error',
        text2: message,
      });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    const trimmedMessage = input.trim();

    if (!trimmedMessage || loading) {
      return;
    }

    Haptics.impactAsync(
      Haptics.ImpactFeedbackStyle.Light
    );

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: trimmedMessage,
      timestamp: new Date(),
    };

    const historyForAI = [...messages, userMessage];

    setMessages(historyForAI);
    setInput('');
    scrollToBottom();

    await sendToAI(
      trimmedMessage,
      historyForAI
    );
  };

  const retryLastMessage = async () => {
    if (!failedMessage || loading) {
      return;
    }

    Haptics.selectionAsync();

    await sendToAI(
      failedMessage,
      messages
    );
  };

  const copyMessage = async (text: string) => {
    await Clipboard.setStringAsync(text);

    Haptics.selectionAsync();

    Toast.show({
      type: 'success',
      text1: 'Message copied',
    });
  };

  const startNewChat = () => {
    Alert.alert(
      'Start New Chat',
      'This will clear the current conversation.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            Haptics.selectionAsync();

            setMessages([
              createWelcomeMessage(),
            ]);

            setFailedMessage(null);
            setInput('');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flexOne}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : 'height'
        }
        keyboardVerticalOffset={
          Platform.OS === 'ios' ? 90 : 0
        }
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.headerButton}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={20}
              color={COLORS.text}
            />
          </TouchableOpacity>

          <View style={styles.headerIconCircle}>
            <MaterialCommunityIcons
              name="robot-outline"
              size={22}
              color={COLORS.primary}
            />
          </View>

          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>
              Medical AI Assistant
            </Text>

            <Text style={styles.headerSubtitle}>
              Powered by Gemini
            </Text>
          </View>

          <TouchableOpacity
            onPress={startNewChat}
            style={styles.headerButton}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons
              name="refresh"
              size={20}
              color={COLORS.primary}
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={
            styles.messagesContent
          }
          onContentSizeChange={scrollToBottom}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message, index) => {
            const isUser =
              message.role === 'user';

            return (
              <Animated.View
                key={message.id}
                entering={
                  index === messages.length - 1
                    ? FadeInUp.duration(280)
                    : undefined
                }
                style={styles.messageWrap}
              >
                <Pressable
                  onLongPress={() =>
                    copyMessage(message.text)
                  }
                  style={[
                    styles.messageBubble,
                    isUser
                      ? styles.userBubble
                      : styles.botBubble,
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      isUser
                        ? styles.userText
                        : styles.botText,
                    ]}
                  >
                    {message.text}
                  </Text>

                  <Text
                    style={[
                      styles.timestamp,
                      isUser
                        ? styles.userTimestamp
                        : styles.botTimestamp,
                    ]}
                  >
                    {formatTime(message.timestamp)}
                  </Text>
                </Pressable>
              </Animated.View>
            );
          })}

          {loading && (
            <Animated.View
              entering={FadeIn.duration(200)}
              style={styles.typingIndicator}
            >
              <TypingDot />
              <TypingDot />
              <TypingDot />
            </Animated.View>
          )}

          {failedMessage && !loading && (
            <Animated.View
              entering={FadeIn.duration(200)}
              style={styles.retryBox}
            >
              <MaterialCommunityIcons
                name="alert-circle-outline"
                size={16}
                color={COLORS.error}
              />

              <Text style={styles.retryText}>
                Message failed to send
              </Text>

              <TouchableOpacity
                onPress={retryLastMessage}
                style={styles.retryButton}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons
                  name="refresh"
                  size={14}
                  color={COLORS.primary}
                />

                <Text style={styles.retryButtonText}>
                  Retry
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </ScrollView>

        <View style={styles.disclaimerBox}>
          <MaterialCommunityIcons
            name="information-outline"
            size={16}
            color={COLORS.warning}
          />

          <Text style={styles.disclaimerText}>
            AI can explain general medical information,
            but it cannot replace a doctor.
          </Text>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Ask about surgery, recovery..."
            placeholderTextColor={COLORS.textMuted}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
            editable={!loading}
            returnKeyType="send"
            blurOnSubmit={false}
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              (!input.trim() || loading) &&
                styles.sendButtonDisabled,
            ]}
            onPress={sendMessage}
            disabled={
              loading || !input.trim()
            }
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator
                size="small"
                color={COLORS.surface}
              />
            ) : (
              <MaterialCommunityIcons
                name="send"
                size={20}
                color={COLORS.surface}
              />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  flexOne: {
    flex: 1,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  headerIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
  },

  headerText: {
    flex: 1,
  },

  headerTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },

  headerSubtitle: {
    marginTop: 2,
    fontSize: 11.5,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
  },

  messagesContainer: {
    flex: 1,
  },

  messagesContent: {
    padding: 16,
    paddingBottom: 20,
    gap: 12,
  },

  messageWrap: {
    width: '100%',
  },

  messageBubble: {
    maxWidth: '86%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },

  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 6,
  },

  botBubble: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderBottomLeftRadius: 6,
  },

  messageText: {
    fontSize: 14,
    lineHeight: 22,
    fontFamily: FONTS.regular,
  },

  userText: {
    color: COLORS.surface,
  },

  botText: {
    color: COLORS.text,
  },

  timestamp: {
    alignSelf: 'flex-end',
    marginTop: 6,
    fontSize: 10,
    fontFamily: FONTS.regular,
  },

  userTimestamp: {
    color: 'rgba(255,255,255,0.75)',
  },

  botTimestamp: {
    color: COLORS.textMuted,
  },

  typingIndicator: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 6,
    borderRadius: 18,
    borderBottomLeftRadius: 6,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },

  retryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    borderRadius: 14,
    backgroundColor: `${COLORS.error}12`,
    borderWidth: 1,
    borderColor: COLORS.error,
  },

  retryText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.error,
  },

  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 4,
    borderRadius: 999,
    backgroundColor: COLORS.surface,
  },

  retryButtonText: {
    fontSize: 11.5,
    fontFamily: FONTS.semiBold,
    color: COLORS.primary,
  },

  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 12,
    gap: 8,
    borderRadius: 14,
    backgroundColor: `${COLORS.warning}12`,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  disclaimerText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 10,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  input: {
    flex: 1,
    maxHeight: 110,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 22,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: 15,
    fontFamily: FONTS.regular,
    color: COLORS.text,
  },

  sendButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
  },

  sendButtonDisabled: {
    backgroundColor: COLORS.textMuted,
  },
});