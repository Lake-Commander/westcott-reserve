import React, { useEffect, useState, useRef, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Alert, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Animated,
  useWindowDimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../components/ScreenWrapper';
import { useAppTheme } from '../hooks/useAppTheme';
import { supabase } from '../services/supabaseClient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const LiveSupportChatScreen = ({ navigation }) => {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  
  // View State: 'history' | 'chat'
  const [view, setView] = useState('history');
  
  // Data State
  const [historyList, setHistoryList] = useState([]);
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [rootHeight, setRootHeight] = useState(0);
  const [fullRootHeight, setFullRootHeight] = useState(0);

  const scrollViewRef = useRef();
  const keyboardAnimation = useRef(new Animated.Value(0)).current;
  const keyboardInset = Math.max(
    0,
    keyboardHeight + insets.bottom - Math.max(0, fullRootHeight - rootHeight)
  );

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillChangeFrame' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates?.height || 0);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 50);
    });
    const hideSubscription = Keyboard.addListener(hideEvent, (event) => {
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [keyboardAnimation, windowHeight]);

  useEffect(() => {
    Animated.timing(keyboardAnimation, {
      toValue: -keyboardInset,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [keyboardAnimation, keyboardInset]);

  const statusLabel = useMemo(() => {
    if (!session) return 'Connecting...';
    if (session.status === 'closed') return 'Closed by support';
    return 'Live Support';
  }, [session]);

  // 1. Load History (Runs when view is 'history')
  useEffect(() => {
    if (view === 'history') {
      const loadHistory = async () => {
        setLoading(true);
        try {
          const { data: authData } = await supabase.auth.getUser();
          const userId = authData.user?.id;
          if (!userId) return;

          // Fetch all sessions for this user
          const { data: sessions, error: sessionError } = await supabase
            .from('support_chat_sessions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

          if (sessionError) throw sessionError;

          if (sessions && sessions.length > 0) {
            const sessionIds = sessions.map(s => s.id);
            
            // Fetch all messages for these sessions to find the first message (title)
            const { data: allMessages, error: msgError } = await supabase
              .from('support_chat_messages')
              .select('session_id, message, created_at')
              .in('session_id', sessionIds)
              .order('created_at', { ascending: true }); // Earliest first
              
            if (msgError) throw msgError;

            // Map the first message to each session
            const historyWithTitles = sessions.map(s => {
              const sMsgs = allMessages?.filter(m => m.session_id === s.id) || [];
              const firstMsg = sMsgs.length > 0 ? sMsgs[0].message : 'New conversation';
              return { ...s, firstMessage: firstMsg };
            });

            setHistoryList(historyWithTitles);
          } else {
            setHistoryList([]);
          }
        } catch (error) {
          Alert.alert('Error', 'Unable to load chat history.');
        } finally {
          setLoading(false);
        }
      };

      loadHistory();
    }
  }, [view]);

  // 2. Realtime Chat Subscription (Runs when a session is active)
  useEffect(() => {
    let channel;
    
    if (view === 'chat' && session) {
      channel = supabase.channel(`chat_${session.id}`)
        .on(
          'postgres_changes',
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'support_chat_messages', 
            filter: `session_id=eq.${session.id}` 
          },
          (payload) => {
            setMessages((current) => [...current, payload.new]);
            setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'support_chat_sessions',
            filter: `id=eq.${session.id}`,
          },
          (payload) => {
            setSession((current) => (current ? { ...current, ...payload.new } : current));
          }
        )
        .subscribe();
    }

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [view, session]);

  // 3. Actions
  const openChat = async (selectedSession) => {
    setSession(selectedSession);
    setView('chat');
    setLoading(true);
    setDraft('');
    
    try {
      const { data: chatHistory, error } = await supabase
        .from('support_chat_messages')
        .select('*')
        .eq('session_id', selectedSession.id)
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      setMessages(chatHistory || []);
    } catch (error) {
      Alert.alert('Error', 'Unable to load messages.');
    } finally {
      setLoading(false);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: false }), 100);
    }
  };

  const startNewChat = async () => {
    setLoading(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const { data: newSession, error } = await supabase
        .from('support_chat_sessions')
        .insert({ user_id: authData.user.id, status: 'open' })
        .select()
        .single();
        
      if (error) throw error;
      if (newSession) openChat(newSession);
    } catch (error) {
      Alert.alert('Error', 'Unable to start a new chat.');
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    const value = draft.trim();
    if (!value || !session || session.status === 'closed') return;
    
    setDraft(''); // Clear instantly for snappy UX
    
    try {
      const { data: authData } = await supabase.auth.getUser();
      const { error } = await supabase.from('support_chat_messages').insert({
        session_id: session.id,
        sender_id: authData.user.id,
        sender_role: 'user',
        message: value,
      });
      
      if (error) throw error;
    } catch (error) {
      Alert.alert('Error', 'Message failed to send. Please try again.');
      setDraft(value); // Restore draft if it fails
    }
  };

  const closeChat = async () => {
    if (!session) return;
    try {
      const { error } = await supabase.from('support_chat_sessions').update({ status: 'closed' }).eq('id', session.id);
      if (error) throw error;
      setSession({ ...session, status: 'closed' });
      Alert.alert('Support status', 'This chat has been closed.');
    } catch (error) {
      Alert.alert('Error', 'Unable to close chat.');
    }
  };

  // --- RENDER HISTORY LIST ---
  if (view === 'history') {
    return (
      <ScreenWrapper edges={['top', 'left', 'right']}>
        <View style={styles.topBar}>
          <TouchableOpacity style={[styles.backCircle, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color={theme.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerMeta}>
            <Text style={[styles.title, { color: theme.textPrimary }]}>Support History</Text>
          </View>
          <TouchableOpacity style={[styles.newChatBtn, { backgroundColor: theme.accent }]} onPress={startNewChat}>
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.newChatBtnText}>New Chat</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.centerContainer}><ActivityIndicator size="large" color={theme.accent} /></View>
        ) : (
          <ScrollView style={styles.historyList} contentContainerStyle={styles.historyContent}>
            {historyList.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="chatbubbles-outline" size={48} color={theme.textMuted} />
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No support chats yet.</Text>
              </View>
            ) : (
              historyList.map((item) => (
                <TouchableOpacity 
                  key={item.id} 
                  style={[styles.historyCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}
                  onPress={() => openChat(item)}
                >
                  <View style={styles.historyCardHeader}>
                    <Text 
                      style={[styles.historyStatus, { color: item.status === 'closed' ? '#EF4444' : '#10B981' }]}
                    >
                      {item.status.toUpperCase()}
                    </Text>
                    <Text style={[styles.historyDate, { color: theme.textMuted }]}>
                      {new Date(item.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={[styles.historyTitle, { color: theme.textPrimary }]} numberOfLines={2}>
                    {item.firstMessage}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        )}
      </ScreenWrapper>
    );
  }

  // --- RENDER ACTIVE CHAT ---
  return (
    <ScreenWrapper edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        onLayout={(event) => {
          const height = event.nativeEvent.layout.height;
          setRootHeight(height);
          setFullRootHeight((current) => Math.max(current, height));
        }}
      >
        <View style={styles.topBar}>
          <TouchableOpacity style={[styles.backCircle, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]} onPress={() => setView('history')}>
            <Ionicons name="arrow-back" size={20} color={theme.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerMeta}>
            <Text style={[styles.title, { color: theme.textPrimary }]}>Support chat</Text>
            <Text style={[styles.meta, { color: theme.textSecondary }]}>{statusLabel}</Text>
          </View>
        </View>

        <View style={[styles.statusBar, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}> 
          <TouchableOpacity style={styles.statusItem} onPress={() => closeChat()} disabled={session?.status === 'closed' || loading}>
            <Text style={[styles.statusText, { color: session?.status === 'closed' ? '#EF4444' : theme.textSecondary }]}>
              {session?.status === 'closed' ? 'Closed' : 'Close Chat'}
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.centerContainer}><ActivityIndicator size="large" color={theme.accent} /></View>
        ) : (
          <ScrollView
            style={[styles.chat, { paddingBottom: keyboardInset ? 8 : 0 }]}
            contentContainerStyle={[styles.chatContent, { paddingBottom: keyboardInset ? 92 : 24 }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            ref={scrollViewRef}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.map((msg) => (
              <View key={msg.id} style={[styles.messageRow, msg.sender_role === 'user' && styles.userRow]}>
                <View style={[styles.bubble, { backgroundColor: msg.sender_role === 'user' ? theme.accent : theme.cardBg, borderColor: theme.cardBorder }]}>
                  <Text style={[styles.messageText, { color: msg.sender_role === 'user' ? '#FFFFFF' : theme.textPrimary }]}>{msg.message}</Text>
                  <Text style={[styles.timeText, { color: msg.sender_role === 'user' ? 'rgba(255,255,255,0.82)' : theme.textMuted }]}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
            ))}
            {messages.length === 0 && (
               <Text style={[styles.emptyChatText, { color: theme.textMuted }]}>Send a message to start chatting.</Text>
            )}
          </ScrollView>
        )}

        <Animated.View
          style={[
            styles.inputBar,
            {
              backgroundColor: theme.cardBg,
              borderColor: theme.cardBorder,
              transform: [{ translateY: keyboardAnimation }],
            },
          ]}
        >
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder={session?.status === 'closed' ? "Chat is closed" : "Type your message..."}
            placeholderTextColor={theme.textMuted}
            style={[styles.input, { color: theme.textPrimary }]}
            multiline
            editable={session?.status !== 'closed' && !loading}
            onFocus={() => setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100)}
          />
          <TouchableOpacity 
            style={[styles.sendBtn, { backgroundColor: (!draft.trim() || session?.status === 'closed') ? theme.cardBorder : theme.accent }]} 
            onPress={sendMessage}
            disabled={!draft.trim() || session?.status === 'closed' || loading}
          >
            <Ionicons name="send" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

export default LiveSupportChatScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  // Header
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10 },
  backCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  headerMeta: { flex: 1 },
  title: { fontSize: 20, fontWeight: '800' },
  meta: { fontSize: 12, marginTop: 2 },
  
  // History View Styles
  newChatBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, gap: 4 },
  newChatBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  historyList: { flex: 1 },
  historyContent: { padding: 16, gap: 12 },
  historyCard: { padding: 16, borderRadius: 14, borderWidth: 1 },
  historyCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  historyStatus: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  historyDate: { fontSize: 11 },
  historyTitle: { fontSize: 15, fontWeight: '600', lineHeight: 22 },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 80, gap: 12 },
  emptyText: { fontSize: 15, fontWeight: '500' },
  emptyChatText: { textAlign: 'center', marginTop: 20, fontSize: 13 },

  // Chat View Styles
  statusBar: { marginHorizontal: 16, borderRadius: 14, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, paddingHorizontal: 10, marginBottom: 8 },
  statusItem: { flex: 1, alignItems: 'center' },
  statusText: { fontSize: 12, fontWeight: '700' },
  chat: { flex: 1, minHeight: 0 },
  chatContent: { padding: 16, gap: 12 },
  messageRow: { flexDirection: 'row', justifyContent: 'flex-start' },
  userRow: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '80%', borderRadius: 18, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  messageText: { fontSize: 14, lineHeight: 20 },
  timeText: { fontSize: 10, marginTop: 6, alignSelf: 'flex-end' },
  
  // Input
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', borderTopWidth: 1, paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  input: { flex: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, maxHeight: 120, borderWidth: 1 },
  sendBtn: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center', marginBottom: 2 },
});