import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../components/ScreenWrapper';
import { useAppTheme } from '../hooks/useAppTheme';

const seedMessages = [
  { id: 'admin-1', sender: 'admin', text: 'Hi, I can help with card requests, account updates, and transfers.', time: '09:30' },
  { id: 'user-1', sender: 'user', text: 'I need help with my physical card delivery timeline.', time: '09:32' },
  { id: 'admin-2', sender: 'admin', text: 'I have noted it. We will review and update you within 4 hours.', time: '09:33' },
];

const LiveSupportChatScreen = ({ navigation }) => {
  const { theme } = useAppTheme();
  const [messages, setMessages] = useState(seedMessages);
  const [draft, setDraft] = useState('');
  const [status, setStatus] = useState('open');

  const statusLabel = useMemo(() => {
    if (status === 'closed') return 'Closed by support';
    if (status === 'expired') return 'Expired';
    return 'Open chat';
  }, [status]);

  const sendMessage = () => {
    const value = draft.trim();
    if (!value) return;
    setMessages((current) => [
      ...current,
      { id: Date.now().toString(), sender: 'user', text: value, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
    ]);
    setDraft('');
  };

  const markStatus = (nextStatus) => {
    setStatus(nextStatus);
    const label = nextStatus === 'closed' ? 'This chat has been closed.' : 'This chat has expired.';
    Alert.alert('Support status', label);
  };

  return (
    <ScreenWrapper>
      <View style={styles.topBar}>
        <TouchableOpacity
          style={[styles.backCircle, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={theme.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerMeta}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Support chat</Text>
          <Text style={[styles.meta, { color: theme.textSecondary }]}>{statusLabel}</Text>
        </View>
      </View>

      <View style={[styles.statusBar, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}> 
        <TouchableOpacity style={styles.statusItem} onPress={() => markStatus('open')}>
          <Text style={[styles.statusText, { color: status === 'open' ? theme.accent : theme.textSecondary }]}>Open</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.statusItem} onPress={() => markStatus('expired')}>
          <Text style={[styles.statusText, { color: status === 'expired' ? '#F59E0B' : theme.textSecondary }]}>Expired</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.statusItem} onPress={() => markStatus('closed')}>
          <Text style={[styles.statusText, { color: status === 'closed' ? '#EF4444' : theme.textSecondary }]}>Closed</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.chat} contentContainerStyle={styles.chatContent} showsVerticalScrollIndicator={false}>
        {messages.map((message) => (
          <View key={message.id} style={[styles.messageRow, message.sender === 'user' && styles.userRow]}>
            <View style={[styles.bubble, { backgroundColor: message.sender === 'user' ? theme.accent : theme.cardBg, borderColor: theme.cardBorder }]}>
              <Text style={[styles.messageText, { color: message.sender === 'user' ? '#FFFFFF' : theme.textPrimary }]}>{message.text}</Text>
              <Text style={[styles.timeText, { color: message.sender === 'user' ? 'rgba(255,255,255,0.82)' : theme.textMuted }]}>{message.time}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.inputBar, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}> 
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Type your message..."
          placeholderTextColor={theme.textMuted}
          style={[styles.input, { color: theme.textPrimary }]}
          multiline
        />
        <TouchableOpacity style={[styles.sendBtn, { backgroundColor: theme.accent }]} onPress={sendMessage}>
          <Ionicons name="send" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </ScreenWrapper>
  );
};

export default LiveSupportChatScreen;

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10 },
  backCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  headerMeta: { flex: 1 },
  title: { fontSize: 22, fontWeight: '800' },
  meta: { fontSize: 12, marginTop: 2 },
  statusBar: { marginHorizontal: 16, borderRadius: 14, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, paddingHorizontal: 10 },
  statusItem: { flex: 1, alignItems: 'center' },
  statusText: { fontSize: 12, fontWeight: '700' },
  chat: { flex: 1 },
  chatContent: { padding: 16, gap: 12 },
  messageRow: { flexDirection: 'row', justifyContent: 'flex-start' },
  userRow: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '80%', borderRadius: 18, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  messageText: { fontSize: 14, lineHeight: 20 },
  timeText: { fontSize: 10, marginTop: 6 },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', borderTopWidth: 1, paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  input: { flex: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, maxHeight: 120, borderWidth: 1 },
  sendBtn: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
});
