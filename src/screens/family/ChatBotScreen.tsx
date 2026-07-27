import React, { useState, useRef } from 'react';
import { View, StyleSheet, Text, TextInput, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants';
import { ChatMessage } from '../../types';
import { askMedicalAI } from '../../services/ai';
import Toast from 'react-native-toast-message';

export default function ChatBotScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'model', text: 'Hello! I am SurgeryTrack AI. I can help explain medical procedures, surgeries, and recovery information in simple terms.\n\nPlease note: I am not a doctor. Always consult your healthcare provider for medical advice.', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage: ChatMessage = { id: Date.now().toString(), role: 'user', text: input.trim(), timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    try {
      const history = messages.map(m => ({ role: m.role, text: m.text }));
      const response = await askMedicalAI(userMessage.text, history);
      const botMessage: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text: response, timestamp: new Date() };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Failed to get response. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="robot" size={32} color={COLORS.primary} />
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Medical AI Assistant</Text>
          <Text style={styles.headerSubtitle}>Powered by Gemini</Text>
        </View>
      </View>
      <ScrollView ref={scrollViewRef} style={styles.messagesContainer} contentContainerStyle={styles.messagesContent} onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}>
        {messages.map((msg) => (
          <View key={msg.id} style={[styles.messageBubble, msg.role === 'user' ? styles.userBubble : styles.botBubble]}>
            <Text style={[styles.messageText, msg.role === 'user' ? styles.userText : styles.botText]}>{msg.text}</Text>
          </View>
        ))}
        {loading && (
          <View style={styles.typingIndicator}>
            <Text style={styles.typingText}>AI is thinking...</Text>
          </View>
        )}
      </ScrollView>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.inputContainer}>
          <TextInput style={styles.input} placeholder="Ask about surgery, recovery..." value={input} onChangeText={setInput} multiline maxLength={500} />
          <TouchableOpacity style={styles.sendButton} onPress={sendMessage} disabled={loading || !input.trim()}>
            <MaterialCommunityIcons name="send" size={24} color={input.trim() ? COLORS.surface : COLORS.textMuted} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerText: { marginLeft: 16 },
  headerTitle: { fontSize: 18, fontFamily: 'Poppins-Bold', color: COLORS.text },
  headerSubtitle: { fontSize: 12, fontFamily: 'Poppins-Regular', color: COLORS.textMuted },
  messagesContainer: { flex: 1 },
  messagesContent: { padding: 16, gap: 12 },
  messageBubble: { maxWidth: '85%', padding: 14, borderRadius: 20 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: COLORS.primary },
  botBubble: { alignSelf: 'flex-start', backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  messageText: { fontSize: 14, fontFamily: 'Poppins-Regular', lineHeight: 22 },
  userText: { color: COLORS.surface },
  botText: { color: COLORS.text },
  typingIndicator: { alignSelf: 'flex-start', backgroundColor: COLORS.surface, padding: 12, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border },
  typingText: { fontSize: 13, fontFamily: 'Poppins-Regular', color: COLORS.textMuted, fontStyle: 'italic' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border },
  input: { flex: 1, backgroundColor: COLORS.background, borderRadius: 24, paddingHorizontal: 20, paddingVertical: 12, fontSize: 15, fontFamily: 'Poppins-Regular', color: COLORS.text, maxHeight: 100 },
  sendButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginLeft: 12 },
});