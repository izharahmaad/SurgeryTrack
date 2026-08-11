import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  FadeInUp,
  FadeIn,
} from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { COLORS, FONTS } from '../../constants';
import { ChatMessage } from '../../types';
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

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.typingDot, style]} />;
}

function formatTime(date: Date) {
  return new Date(date).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

const WELCOME_MESSAGE: ChatMessage = {
  id: '1',
  role: 'model',
  text: 'Hello! I am SurgeryTrack AI. I can help explain surgeries, procedures, and recovery information in simple language.\n\nPlease note: I am not a doctor. Always consult your healthcare provider for medical advice.',
  timestamp: new Date(),
};

export default function ChatBotScreen() {
  const navigation = useNavigation<any>();
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [failedMessage, setFailedMessage] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const sendToAI = async (trimmed: string, historySource: ChatMessage[]) => {
    setLoading(true);
    setFailedMessage(null);
    try {
      const history = historySource
        .slice(-MAX_HISTORY_MESSAGES)
        .map((m) => ({ role: m.role, text: m.text }));

      const response = await askMedicalAI(trimmed, history);

      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      scrollToBottom();
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setFailedMessage(trimmed);
      Toast.show({
        type: 'error',
        text1: 'AI Error',
        text2: error?.message || 'Failed to get response. Tap retry below.',
      });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const trimmed = input.trim();
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: trimmed,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    scrollToBottom();

    await sendToAI(trimmed, messages);
  };

  const retryLastMessage = async () => {
    if (!failedMessage) return;
    Haptics.selectionAsync();
    await sendToAI(failedMessage, messages);
  };

  const copyMessage = async (text: string) => {
    await Clipboard.setStringAsync(text);
    Haptics.selectionAsync();
    Toast.show({ type: 'success', text1: 'Message copied' });
  };

  const startNewChat = () => {
    Alert.alert('Start New Chat', 'This will clear the current conversation.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          Haptics.selectionAsync();
          setMessages([{ ...WELCOME_MESSAGE, id: Date.now().toString(), timestamp: new Date() }]);
          setFailedMessage(null);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flexOne}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.85}>
            <MaterialCommunityIcons name="arrow-left" size={20} color={COLORS.text} />
          </TouchableOpacity>

          <View style={styles.headerIconCircle}>
            <MaterialCommunityIcons name="robot-outline" size={22} color={COLORS.primary} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Medical AI Assistant</Text>
            <Text style={styles.headerSubtitle}>Powered by Gemini</Text>
          </View>

          <TouchableOpacity onPress={startNewChat} style={styles.backBtn} activeOpacity={0.85}>
            <MaterialCommunityIcons name="refresh" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={scrollToBottom}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {messages.map((msg, idx) => (
            <Animated.View
              key={msg.id}
              entering={idx === messages.length - 1 ? FadeInUp.duration(280) : undefined}
              style={styles.messageWrap}
            >
              <TouchableOpacity
                onLongPress={() => copyMessage(msg.text)}
                activeOpacity={0.9}
                style={[
                  styles.messageBubble,
                  msg.role === 'user' ? styles.userBubble : styles.botBubble,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    msg.role === 'user' ? styles.userText : styles.botText,
                  ]}
                >
                  {msg.text}
                </Text>
                <Text
                  style={[
                    styles.timestamp,
                    msg.role === 'user' ? styles.userTimestamp : styles.botTimestamp,
                  ]}
                >
                  {formatTime(msg.timestamp)}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          ))}

          {loading && (
            <Animated.View entering={FadeIn.duration(200)} style={styles.typingIndicator}>
              <TypingDot />
              <TypingDot />
              <TypingDot />
            </Animated.View>
          )}

          {failedMessage && !loading && (
            <Animated.View entering={FadeIn.duration(200)} style={styles.retryBox}>
              <MaterialCommunityIcons name="alert-circle-outline" size={16} color={COLORS.error} />
              <Text style={styles.retryText}>Message failed to send</Text>
              <TouchableOpacity onPress={retryLastMessage} style={styles.retryBtn} activeOpacity={0.85}>
                <MaterialCommunityIcons name="refresh" size={14} color={COLORS.primary} />
                <Text style={styles.retryBtnText}>Retry</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </ScrollView>

        <View style={styles.disclaimerBox}>
          <MaterialCommunityIcons name="information-outline" size={16} color={COLORS.warning} />
          <Text style={styles.disclaimerText}>
            AI can explain general medical information, but it cannot replace a doctor.
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
          />

          <TouchableOpacity
            style={[styles.sendButton, (!input.trim() || loading) && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={loading || !input.trim()}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator size="small" color={COLORS.surface} />
            ) : (
              <MaterialCommunityIcons name="send" size={20} color={COLORS.surface} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  flexOne: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: { flex: 1 },
  headerTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 11.5,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginTop: 2,
  },

  messagesContainer: { flex: 1 },
  messagesContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 20,
  },

  messageWrap: { width: '100%' },
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
    fontFamily: FONTS.regular,
    lineHeight: 22,
  },
  userText: { color: COLORS.surface },
  botText: { color: COLORS.text },

  timestamp: {
    fontSize: 10,
    fontFamily: FONTS.regular,
    marginTop: 6,
    alignSelf: 'flex-end',
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
    backgroundColor: COLORS.surface,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
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
    backgroundColor: COLORS.errorLight,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.error,
    gap: 8,
  },
  retryText: { fontSize: 12, fontFamily: FONTS.regular, color: COLORS.error },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  retryBtnText: { fontSize: 11.5, fontFamily: FONTS.semiBold, color: COLORS.primary },

  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: COLORS.warningLight,
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
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: FONTS.regular,
    color: COLORS.text,
    maxHeight: 110,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sendButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.textMuted,
  },
});