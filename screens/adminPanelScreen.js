import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabaseClient';
import { useAppUIConfig } from '../components/AppUIConfigProvider';
import {
  cloneUIConfig,
  DEFAULT_UI_CONFIG,
  UI_ACTIONS,
  UI_ACTION_BY_ID,
} from '../services/appUiConfig';

const COLORS = {
  background: '#F4F6FA',
  card: '#FFFFFF',
  border: '#E2E7EF',
  ink: '#172033',
  muted: '#64748B',
  primary: '#5141C7',
  danger: '#B42318',
  green: '#147D55',
};

const SECTIONS = [
  { title: 'Overview', icon: 'grid-outline' },
  { title: 'Accounts', icon: 'people-outline' },
  { title: 'Transactions', icon: 'swap-horizontal-outline' },
  { title: 'Customer care', icon: 'chatbubbles-outline' },
  { title: 'Controls', icon: 'options-outline' },
  { title: 'App appearance', icon: 'color-palette-outline' },
  { title: 'Notifications', icon: 'notifications-outline' },
];
const REVIEW_STATES = ['normal', 'flagged', 'paused'];

async function callAdminEmailApi(payload) {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  const token = data.session?.access_token;
  if (!token) throw new Error('Your admin session has expired. Sign in again.');

  const response = await fetch('/api/admin/send-email', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.error || `Email service returned HTTP ${response.status}.`);
  }
  return result;
}

function Button({ title, onPress, disabled, secondary, danger }) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.button,
        secondary && styles.secondaryButton,
        danger && styles.dangerButton,
        disabled && styles.disabledButton,
      ]}
    >
      <Text style={[styles.buttonText, secondary && styles.secondaryButtonText]}>
        {title}
      </Text>
    </Pressable>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  secureTextEntry,
  maxLength,
  autoCapitalize = 'none',
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
        maxLength={maxLength}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        secureTextEntry={secureTextEntry}
        style={[styles.input, multiline && styles.multilineInput]}
        value={value}
      />
    </View>
  );
}

export default function AdminPanelScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 980;
  const { configError, replaceConfig } = useAppUIConfig();
  const [session, setSession] = useState(null);
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [section, setSection] = useState('Overview');
  const [profiles, setProfiles] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [supportMessages, setSupportMessages] = useState([]);
  const [features, setFeatures] = useState([]);
  const [uiDraft, setUiDraft] = useState(() => cloneUIConfig(DEFAULT_UI_CONFIG));
  const [newBankName, setNewBankName] = useState('');
  const [newBankCountry, setNewBankCountry] = useState('');
  const [auditEvents, setAuditEvents] = useState([]);
  const [pendingAccountChange, setPendingAccountChange] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [reply, setReply] = useState('');
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeMessage, setNoticeMessage] = useState('');
  const [noticeUserId, setNoticeUserId] = useState('');
  const [emailNotification, setEmailNotification] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [feedbackError, setFeedbackError] = useState(false);
  const [loadError, setLoadError] = useState('');

  const checkSession = useCallback(async () => {
    setChecking(true);
    setFeedback('');
    setFeedbackError(false);
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      const activeSession = data.session;
      setSession(activeSession);
      if (!activeSession) {
        setAuthorized(false);
        return;
      }
      const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin');
      if (adminError) throw adminError;
      setAuthorized(isAdmin === true);
    } catch (error) {
      setAuthorized(false);
      setFeedback(error.message || 'Unable to verify admin access.');
      setFeedbackError(true);
    } finally {
      setChecking(false);
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoadError('');
    const [profileResult, transactionResult, supportResult, featureResult, auditResult, uiConfigResult] =
      await Promise.all([
        supabase.rpc('admin_list_profiles'),
        supabase
          .from('transactions')
          .select('id,user_id,type,amount,counterparty,created_at,review_status')
          .order('created_at', { ascending: false })
          .limit(150),
        supabase
          .from('customer_care_messages')
          .select('id,user_id,email,subject,message,status,admin_reply,created_at')
          .order('created_at', { ascending: false })
          .limit(100),
        supabase.from('app_feature_flags').select('feature_key,label,enabled').order('label'),
        supabase
          .from('admin_audit_log')
          .select('actor_id,action,entity_type,entity_id,created_at')
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('app_ui_config')
          .select('config')
          .eq('id', 'default')
          .maybeSingle(),
      ]);

    const failed = [
      profileResult,
      transactionResult,
      supportResult,
      featureResult,
      auditResult,
      uiConfigResult,
    ].find(
      (result) => result.error
    );
    if (failed) throw failed.error;
    setProfiles(profileResult.data || []);
    setTransactions(transactionResult.data || []);
    setSupportMessages(supportResult.data || []);
    setFeatures(featureResult.data || []);
    setAuditEvents(auditResult.data || []);
    const loadedConfig = uiConfigResult.data?.config || DEFAULT_UI_CONFIG;
    setUiDraft(cloneUIConfig(loadedConfig));
    replaceConfig(loadedConfig);
  }, [replaceConfig]);

  useEffect(() => {
    checkSession();
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) setAuthorized(false);
    });
    return () => data.subscription.unsubscribe();
  }, [checkSession]);

  useEffect(() => {
    if (!authorized) return;
    loadData().catch((error) => {
      setLoadError(error.message || 'Unable to load admin data.');
    });
  }, [authorized, loadData]);

  const signIn = async () => {
    setBusy(true);
    setFeedback('');
    setFeedbackError(false);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      setPassword('');
      await checkSession();
    } catch (error) {
      setFeedback(error.message || 'Sign-in failed.');
      setFeedbackError(true);
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    setBusy(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setSession(null);
      setAuthorized(false);
    } catch (error) {
      setFeedback(error.message || 'Unable to sign out.');
      setFeedbackError(true);
    } finally {
      setBusy(false);
    }
  };

  const runAction = async (action, successMessage) => {
    setBusy(true);
    setFeedback('');
    setFeedbackError(false);
    try {
      await action();
      await loadData();
      setFeedback(successMessage);
    } catch (error) {
      setFeedback(error.message || 'The action could not be completed.');
      setFeedbackError(true);
    } finally {
      setBusy(false);
    }
  };

  const saveReviewState = (transactionId, status) =>
    runAction(
      async () => {
        const { error } = await supabase.rpc('admin_set_transaction_review', {
          p_transaction_id: transactionId,
          p_status: status,
        });
        if (error) throw error;
      },
      'Transaction review status updated and recorded.'
    );

  const saveReply = async () => {
    if (!selectedMessage || !reply.trim()) return;
    setBusy(true);
    setFeedback('');
    setFeedbackError(false);
    try {
      const { error } = await supabase.rpc('admin_reply_to_customer_care', {
        p_message_id: selectedMessage.id,
        p_reply: reply.trim(),
      });
      if (error) throw error;

      let emailStatus = 'Reply saved.';
      try {
        await callAdminEmailApi({
          type: 'support_reply',
          messageId: selectedMessage.id,
          message: reply.trim(),
        });
        emailStatus = 'Reply saved and emailed to the customer.';
      } catch (emailError) {
        emailStatus = `Reply saved, but email could not be sent: ${emailError.message}`;
        setFeedbackError(true);
      }
      setReply('');
      setSelectedMessage(null);
      await loadData();
      setFeedback(emailStatus);
    } catch (error) {
      setFeedback(error.message || 'Unable to save the reply.');
      setFeedbackError(true);
    } finally {
      setBusy(false);
    }
  };

  const saveNotification = async () => {
    setBusy(true);
    setFeedback('');
    setFeedbackError(false);
    try {
      const audienceUserId = noticeUserId.trim() || null;
      const { error } = await supabase.rpc('admin_create_notification', {
        p_title: noticeTitle.trim(),
        p_message: noticeMessage.trim(),
        p_audience_user_id: audienceUserId,
      });
      if (error) throw error;

      let status = audienceUserId
        ? 'Account notification published.'
        : 'Broadcast notification published.';
      let emailFailed = false;
      if (emailNotification) {
        try {
          await callAdminEmailApi({
            type: 'notification',
            title: noticeTitle.trim(),
            message: noticeMessage.trim(),
            audienceUserId: audienceUserId || 'all',
          });
          status += ' Email delivery accepted.';
        } catch (emailError) {
          status += ` Email delivery failed: ${emailError.message}`;
          emailFailed = true;
        }
      }
      setNoticeTitle('');
      setNoticeMessage('');
      setNoticeUserId('');
      setEmailNotification(false);
      setFeedback(status);
      setFeedbackError(emailFailed);
    } catch (error) {
      setFeedback(error.message || 'Unable to publish the notification.');
      setFeedbackError(true);
    } finally {
      setBusy(false);
    }
  };

  const updateFeature = (featureKey, enabled) =>
    runAction(
      async () => {
        const { error } = await supabase.rpc('admin_set_feature_flag', {
          p_feature_key: featureKey,
          p_enabled: enabled,
        });
        if (error) throw error;
      },
      'Feature setting updated.'
    );

  const updateAccountAccess = (accountId, active) =>
    runAction(
      async () => {
        const { error } = await supabase.rpc('admin_set_account_access', {
          p_user_id: accountId,
          p_active: active,
        });
        if (error) throw error;
        setPendingAccountChange(null);
      },
      active ? 'Account access restored.' : 'Account suspended.'
    );

  const updateUiTheme = (key, value) => {
    setUiDraft((current) => ({
      ...current,
      theme: { ...current.theme, [key]: value },
    }));
  };

  const updateUiHome = (key, value) => {
    setUiDraft((current) => ({
      ...current,
      home: { ...current.home, [key]: value },
    }));
  };

  const updateQuickAction = (actionId, changes) => {
    setUiDraft((current) => ({
      ...current,
      home: {
        ...current.home,
        quickActions: current.home.quickActions.map((action) =>
          action.id === actionId ? { ...action, ...changes } : action
        ),
      },
    }));
  };

  const addQuickAction = (actionId) => {
    const action = UI_ACTION_BY_ID[actionId];
    if (!action || uiDraft.home.quickActions.some((item) => item.id === actionId)) return;
    if (uiDraft.home.quickActions.length >= 7) {
      setFeedback('The app supports up to 7 home quick actions.');
      setFeedbackError(true);
      return;
    }
    updateUiHome('quickActions', [
      ...uiDraft.home.quickActions,
      { id: action.id, label: action.label, enabled: true },
    ]);
  };

  const updateBank = (bankId, changes) => {
    setUiDraft((current) => ({
      ...current,
      banks: current.banks.map((bank) =>
        bank.id === bankId ? { ...bank, ...changes } : bank
      ),
    }));
  };

  const removeBank = (bankId) => {
    if (bankId === 'westcott') return;
    setUiDraft((current) => ({
      ...current,
      banks: current.banks.filter((bank) => bank.id !== bankId),
    }));
  };

  const addBank = () => {
    const name = newBankName.trim();
    const country = newBankCountry.trim();
    if (!name || !country) {
      setFeedback('Enter both a bank name and country.');
      setFeedbackError(true);
      return;
    }
    if (uiDraft.banks.length >= 100) {
      setFeedback('The bank list can contain up to 100 entries.');
      setFeedbackError(true);
      return;
    }
    let id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
    if (!id) {
      setFeedback('Bank name must contain at least one letter or number.');
      setFeedbackError(true);
      return;
    }
    const baseId = id;
    let suffix = 2;
    while (uiDraft.banks.some((bank) => bank.id === id)) {
      const ending = `-${suffix++}`;
      id = `${baseId.slice(0, 60 - ending.length)}${ending}`;
    }
    setUiDraft((current) => ({
      ...current,
      banks: [...current.banks, { id, name, country, internal: false }],
    }));
    setNewBankName('');
    setNewBankCountry('');
    setFeedbackError(false);
    setFeedback('');
  };

  const saveUiConfig = async () => {
    setBusy(true);
    setFeedback('');
    setFeedbackError(false);
    try {
      const colorValues = Object.values(uiDraft.theme);
      if (colorValues.some((value) => !/^#[0-9a-f]{6}$/i.test(value))) {
        throw new Error('Colors must be six-digit hex values, for example #7052FF.');
      }
      if (!uiDraft.banks.some((bank) => bank.id === 'westcott' && bank.internal === true)) {
        throw new Error('The Westcott Reserve internal option must remain available.');
      }

      const { data: savedConfig, error } = await supabase.rpc(
        'admin_update_app_ui_config',
        { p_config: uiDraft }
      );
      if (error) throw error;
      const normalizedConfig = cloneUIConfig(savedConfig);
      replaceConfig(normalizedConfig);
      setUiDraft(normalizedConfig);
      setFeedback('App appearance and bank settings published to customers.');
    } catch (error) {
      setFeedback(error.message || 'Unable to save app appearance settings.');
      setFeedbackError(true);
    } finally {
      setBusy(false);
    }
  };

  if (checking) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={COLORS.primary} />
        <Text style={styles.mutedText}>Checking admin access…</Text>
      </View>
    );
  }

  if (!session || !authorized) {
    return (
      <View style={styles.authPage}>
        <View style={styles.authCard}>
          <Text style={styles.eyebrow}>WESTCOTT RESERVE</Text>
          <Text style={styles.title}>Admin console</Text>
          <Text style={styles.mutedText}>
            Sign in with an account that has been explicitly granted admin access.
          </Text>
          {session ? (
            <>
              <Text style={feedbackError ? styles.error : styles.feedback}>
                {feedbackError
                  ? 'Admin access could not be verified.'
                  : 'This account is not authorized to use the admin console.'}
              </Text>
              <Button title="Sign out" onPress={signOut} disabled={busy} secondary />
            </>
          ) : (
            <>
              <Field label="Email" value={email} onChangeText={setEmail} placeholder="admin@example.com" />
              <Field
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                secureTextEntry
              />
              <Button title={busy ? 'Signing in…' : 'Sign in'} onPress={signIn} disabled={busy} />
            </>
          )}
          {!!feedback && <Text style={feedbackError ? styles.error : styles.feedback}>{feedback}</Text>}
        </View>
      </View>
    );
  }

  const openMessages = supportMessages.filter((message) => message.status === 'open').length;
  const pausedTransactions = transactions.filter(
    (transaction) => transaction.review_status === 'paused'
  ).length;

  return (
    <View style={styles.page}>
      <View style={styles.appShell}>
        {isWide && (
          <View style={styles.sidebar}>
            <View style={styles.brand}>
              <View style={styles.brandMark}>
                <Text style={styles.brandMarkText}>W</Text>
              </View>
              <View>
                <Text style={styles.brandName}>WESTCOTT</Text>
                <Text style={styles.brandCaption}>RESERVE · ADMIN</Text>
              </View>
            </View>
            <Text style={styles.sidebarLabel}>WORKSPACE</Text>
            <View style={styles.sidebarNav}>
              {SECTIONS.map((item) => (
                <SidebarItem
                  key={item.title}
                  item={item}
                  active={section === item.title}
                  count={item.title === 'Customer care' ? openMessages : 0}
                  onPress={() => setSection(item.title)}
                />
              ))}
            </View>
            <View style={styles.sidebarBottom}>
              <View style={styles.adminIdentity}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {(session.user.email || 'A').slice(0, 1).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.identityCopy}>
                  <Text numberOfLines={1} style={styles.identityName}>
                    {session.user.email}
                  </Text>
                  <Text style={styles.identityRole}>Administrator</Text>
                </View>
              </View>
              <Button title="Sign out" onPress={signOut} disabled={busy} secondary />
            </View>
          </View>
        )}

        <View style={styles.workspace}>
          <View style={[styles.topBar, isWide && styles.desktopTopBar]}>
            {!isWide && (
              <View style={styles.mobileBrand}>
                <View style={styles.brandMark}>
                  <Text style={styles.brandMarkText}>W</Text>
                </View>
                <View>
                  <Text style={styles.brandName}>WESTCOTT RESERVE</Text>
                  <Text style={styles.brandCaption}>ADMIN CONSOLE</Text>
                </View>
              </View>
            )}
            <View style={styles.pageHeading}>
              {isWide && <Text style={styles.eyebrow}>ADMINISTRATION / WORKSPACE</Text>}
              <Text style={styles.title}>{section}</Text>
            </View>
            {!isWide && (
              <Button title="Sign out" onPress={signOut} disabled={busy} secondary />
            )}
          </View>

          {!isWide && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.mobileNav}
            >
              {SECTIONS.map((item) => (
                <Pressable
                  accessibilityRole="tab"
                  accessibilityState={{ selected: section === item.title }}
                  key={item.title}
                  onPress={() => setSection(item.title)}
                  style={[styles.mobileNavItem, section === item.title && styles.mobileNavItemActive]}
                >
                  <Ionicons
                    name={item.icon}
                    size={17}
                    color={section === item.title ? COLORS.primary : COLORS.muted}
                  />
                  <Text style={[styles.mobileNavText, section === item.title && styles.navTextActive]}>
                    {item.title === 'Customer care' && openMessages > 0
                      ? `${item.title} (${openMessages})`
                      : item.title}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          )}

          <ScrollView
            style={styles.mainScroll}
            contentContainerStyle={[styles.content, isWide && styles.desktopContent]}
          >
        {!!feedback && (
          <Text accessibilityLiveRegion="polite" style={feedbackError ? styles.error : styles.feedback}>
            {feedback}
          </Text>
        )}
        {!!loadError && <Text style={styles.error}>{loadError}</Text>}
        {section === 'Overview' && (
          <>
            <Text style={styles.sectionTitle}>Operations overview</Text>
            <View style={styles.stats}>
              <Stat label="Accounts" value={profiles.length} />
              <Stat label="Recent transactions" value={transactions.length} />
              <Stat label="Open support requests" value={openMessages} />
              <Stat label="Paused transactions" value={pausedTransactions} />
            </View>
            <Card title="Administrator">
              <Text style={styles.bodyText}>{session.user.email}</Text>
              <Text style={styles.mutedText}>User ID: {session.user.id}</Text>
              <Text style={styles.mutedText}>
                Administrative changes are restricted to database functions and recorded in the audit log.
              </Text>
            </Card>
            <Card title="Recent admin activity">
              {auditEvents.length === 0 ? (
                <Text style={styles.mutedText}>No administrative actions recorded yet.</Text>
              ) : (
                auditEvents.map((event, index) => (
                  <Text key={`${event.created_at}-${index}`} style={styles.mutedText}>
                    {formatDate(event.created_at)} · {event.action} · {event.entity_type}
                    {event.entity_id ? ` · ${event.entity_id}` : ''}
                  </Text>
                ))
              )}
            </Card>
          </>
        )}
        {section === 'Transactions' && (
          <>
            <Text style={styles.sectionTitle}>Transaction review</Text>
            <Text style={styles.mutedText}>
              Flagged and paused are review labels; they do not reverse or pause a completed transaction.
            </Text>
            {transactions.map((transaction) => (
              <Card key={transaction.id} title={`${transaction.type} · ${transaction.amount}`}>
                <Text style={styles.mutedText}>Transaction: {transaction.id}</Text>
                <Text style={styles.mutedText}>Account: {transaction.user_id}</Text>
                <Text style={styles.mutedText}>
                  {transaction.counterparty || 'Account activity'} · {formatDate(transaction.created_at)}
                </Text>
                <View style={styles.stateButtons}>
                  {REVIEW_STATES.map((state) => (
                    <Button
                      key={state}
                      title={state === 'normal' ? 'Clear' : state[0].toUpperCase() + state.slice(1)}
                      onPress={() => saveReviewState(transaction.id, state)}
                      disabled={busy || transaction.review_status === state}
                      secondary={transaction.review_status !== state}
                    />
                  ))}
                </View>
                <Text style={styles.mutedText}>
                  Current review status: {transaction.review_status || 'normal'}
                </Text>
              </Card>
            ))}
            {transactions.length === 0 && <Text style={styles.mutedText}>No transactions found.</Text>}
          </>
        )}
        {section === 'Accounts' && (
          <>
            <Text style={styles.sectionTitle}>Customer accounts</Text>
            <Text style={styles.mutedText}>
              Suspending an account blocks sign-in and the app's gated features. The change is audited.
            </Text>
            {profiles.map((profile) => (
              <Card key={profile.id} title={profile.name || profile.email}>
                <Text style={styles.mutedText}>{profile.email}</Text>
                <Text style={styles.mutedText}>Account ID: {profile.id}</Text>
                <Text style={styles.mutedText}>
                  Status: {profile.is_active ? 'Active' : 'Suspended'}
                </Text>
                {pendingAccountChange?.id === profile.id ? (
                  <View style={styles.stateButtons}>
                    <Button
                      title={`Confirm ${pendingAccountChange.active ? 'reactivation' : 'suspension'}`}
                      onPress={() => updateAccountAccess(profile.id, pendingAccountChange.active)}
                      disabled={busy}
                      danger={!pendingAccountChange.active}
                    />
                    <Button
                      title="Cancel"
                      onPress={() => setPendingAccountChange(null)}
                      disabled={busy}
                      secondary
                    />
                  </View>
                ) : (
                  <Button
                    title={profile.is_active ? 'Suspend account' : 'Reactivate account'}
                    onPress={() =>
                      setPendingAccountChange({ id: profile.id, active: !profile.is_active })
                    }
                    secondary={profile.is_active}
                    danger={profile.is_active}
                  />
                )}
              </Card>
            ))}
            {profiles.length === 0 && <Text style={styles.mutedText}>No customer accounts found.</Text>}
          </>
        )}
        {section === 'Customer care' && (
          <>
            <Text style={styles.sectionTitle}>Customer care inbox</Text>
            {supportMessages.map((message) => (
              <Card key={message.id} title={message.subject}>
                <Text style={styles.mutedText}>
                  {message.email} · {formatDate(message.created_at)} · {message.status}
                </Text>
                <Text style={styles.bodyText}>{message.message}</Text>
                {message.admin_reply ? (
                  <Text style={styles.mutedText}>Previous reply: {message.admin_reply}</Text>
                ) : null}
                {selectedMessage?.id === message.id ? (
                  <>
                    <Field
                      label="Reply"
                      value={reply}
                      onChangeText={setReply}
                      placeholder="Write a response"
                      multiline
                    />
                    <View style={styles.stateButtons}>
                      <Button title="Save and email reply" onPress={saveReply} disabled={busy || !reply.trim()} />
                      <Button title="Cancel" onPress={() => setSelectedMessage(null)} secondary />
                    </View>
                  </>
                ) : (
                  <Button
                    title={message.status === 'open' ? 'Respond' : 'Send another reply'}
                    onPress={() => {
                      setSelectedMessage(message);
                      setReply('');
                    }}
                    secondary
                  />
                )}
              </Card>
            ))}
            {supportMessages.length === 0 && <Text style={styles.mutedText}>The inbox is empty.</Text>}
          </>
        )}
        {section === 'Controls' && (
          <>
            <Text style={styles.sectionTitle}>Feature controls</Text>
            <Text style={styles.mutedText}>
              Turning off a feature blocks its corresponding app flow; access changes are audited.
            </Text>
            {features.map((feature) => (
              <Card key={feature.feature_key} title={feature.label}>
                <Text style={styles.mutedText}>Key: {feature.feature_key}</Text>
                <View style={styles.switchRow}>
                  <Text style={styles.bodyText}>{feature.enabled ? 'Enabled' : 'Disabled'}</Text>
                  <Switch
                    accessibilityLabel={`Enable ${feature.label}`}
                    onValueChange={(enabled) => updateFeature(feature.feature_key, enabled)}
                    value={feature.enabled}
                    disabled={busy}
                    trackColor={{ true: COLORS.primary }}
                  />
                </View>
              </Card>
            ))}
            <Text style={styles.mutedText}>
              These controls are product-level switches for this demo, not a substitute for server-side financial controls.
            </Text>
          </>
        )}
        {section === 'App appearance' && (
          <>
            <Text style={styles.sectionTitle}>App appearance</Text>
            <Text style={styles.mutedText}>
              Changes publish to signed-in app users. Only prebuilt cards, colors, and safe navigation actions can be configured.
            </Text>
            {!!configError && (
              <Text style={styles.error}>
                The currently published UI settings could not be loaded: {configError}
              </Text>
            )}
            <Card title="Color grading">
              <Text style={styles.mutedText}>
                Enter six-digit HEX colors. Background, card, and accent colors update the app theme.
              </Text>
              <View style={styles.palettePreview}>
                <View
                  style={[
                    styles.palettePreviewScreen,
                    { backgroundColor: uiDraft.theme.lightBackground },
                  ]}
                >
                  <View
                    style={[
                      styles.palettePreviewCard,
                      { backgroundColor: uiDraft.theme.lightCard },
                    ]}
                  >
                    <Text style={[styles.previewTitle, { color: uiDraft.theme.accent }]}>
                      Westcott Reserve
                    </Text>
                    <Text style={styles.previewCopy}>Your app theme preview</Text>
                    <View
                      style={[
                        styles.previewButton,
                        { backgroundColor: uiDraft.theme.accent },
                      ]}
                    >
                      <Text style={styles.previewButtonText}>Continue</Text>
                    </View>
                  </View>
                </View>
              </View>
              <View style={styles.formGrid}>
                {[
                  ['accent', 'Brand accent'],
                  ['lightBackground', 'Light background'],
                  ['lightCard', 'Light card'],
                  ['darkBackground', 'Dark background'],
                  ['darkCard', 'Dark card'],
                ].map(([key, label]) => (
                  <View key={key} style={styles.formColumn}>
                    <Field
                      label={label}
                      value={uiDraft.theme[key]}
                      onChangeText={(value) => updateUiTheme(key, value)}
                      placeholder="#7052FF"
                      maxLength={7}
                    />
                    <View
                      style={[
                        styles.colorSwatch,
                        { backgroundColor: /^#[0-9a-f]{6}$/i.test(uiDraft.theme[key]) ? uiDraft.theme[key] : '#FFFFFF' },
                      ]}
                    />
                  </View>
                ))}
              </View>
            </Card>

            <Card title="Home banners">
              <View style={styles.switchRow}>
                <Text style={styles.bodyText}>Show welcome banner</Text>
                <Switch
                  accessibilityLabel="Show welcome banner"
                  value={uiDraft.home.heroEnabled}
                  onValueChange={(value) => updateUiHome('heroEnabled', value)}
                  trackColor={{ true: COLORS.primary }}
                />
              </View>
              <Field
                label="Welcome banner title"
                value={uiDraft.home.heroTitle}
                onChangeText={(value) => updateUiHome('heroTitle', value)}
                maxLength={100}
              />
              <Field
                label="Welcome banner message"
                value={uiDraft.home.heroSubtitle}
                onChangeText={(value) => updateUiHome('heroSubtitle', value)}
                multiline
                maxLength={240}
              />
              <Field
                label="Welcome banner button"
                value={uiDraft.home.heroButtonLabel}
                onChangeText={(value) => updateUiHome('heroButtonLabel', value)}
                maxLength={32}
              />
              <ActionChoices
                label="Welcome banner action"
                value={uiDraft.home.heroAction}
                onChange={(value) => updateUiHome('heroAction', value)}
              />
              <View style={styles.sectionDivider} />
              <View style={styles.switchRow}>
                <Text style={styles.bodyText}>Show promotion card</Text>
                <Switch
                  accessibilityLabel="Show promotion card"
                  value={uiDraft.home.promoEnabled}
                  onValueChange={(value) => updateUiHome('promoEnabled', value)}
                  trackColor={{ true: COLORS.primary }}
                />
              </View>
              <Field
                label="Promotion title"
                value={uiDraft.home.promoTitle}
                onChangeText={(value) => updateUiHome('promoTitle', value)}
                maxLength={100}
              />
              <Field
                label="Promotion message"
                value={uiDraft.home.promoDescription}
                onChangeText={(value) => updateUiHome('promoDescription', value)}
                multiline
                maxLength={240}
              />
              <Field
                label="Promotion button"
                value={uiDraft.home.promoButtonLabel}
                onChangeText={(value) => updateUiHome('promoButtonLabel', value)}
                maxLength={32}
              />
              <ActionChoices
                label="Promotion action"
                value={uiDraft.home.promoAction}
                onChange={(value) => updateUiHome('promoAction', value)}
              />
            </Card>

            <Card title="Home quick actions">
              <Text style={styles.mutedText}>
                Rename, hide, or add shortcuts to screens already included in the app.
              </Text>
              {uiDraft.home.quickActions.map((action) => {
                const definition = UI_ACTION_BY_ID[action.id];
                return (
                  <View key={action.id} style={styles.configRow}>
                    <View style={styles.configActionIcon}>
                      <Ionicons
                        name={definition?.icon || 'apps-outline'}
                        size={18}
                        color={COLORS.primary}
                      />
                    </View>
                    <View style={styles.configActionMain}>
                      <Field
                        label={definition?.label || action.id}
                        value={action.label}
                        onChangeText={(value) => updateQuickAction(action.id, { label: value })}
                        maxLength={24}
                      />
                    </View>
                    <Switch
                      accessibilityLabel={`Show ${action.label} shortcut`}
                      value={action.enabled}
                      onValueChange={(value) =>
                        updateQuickAction(action.id, { enabled: value })
                      }
                      trackColor={{ true: COLORS.primary }}
                    />
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${action.label} shortcut`}
                      onPress={() =>
                        updateUiHome(
                          'quickActions',
                          uiDraft.home.quickActions.filter((item) => item.id !== action.id)
                        )
                      }
                      style={styles.removeButton}
                    >
                      <Ionicons name="close" size={18} color={COLORS.danger} />
                    </Pressable>
                  </View>
                );
              })}
              <Text style={styles.fieldLabel}>Add shortcut</Text>
              <View style={styles.chipRow}>
                {UI_ACTIONS.filter(
                  (action) =>
                    !uiDraft.home.quickActions.some((item) => item.id === action.id)
                ).map((action) => (
                  <Button
                    key={action.id}
                    title={`+ ${action.label}`}
                    onPress={() => addQuickAction(action.id)}
                    secondary
                    disabled={uiDraft.home.quickActions.length >= 7}
                  />
                ))}
              </View>
            </Card>

            <Card title={`Transfer bank directory (${uiDraft.banks.length})`}>
              <Text style={styles.mutedText}>
                These choices appear in the bank picker. They are demo directory entries, not verified or connected payment destinations. Westcott Reserve is required for internal transfers.
              </Text>
              {uiDraft.banks.map((bank) => (
                <View key={bank.id} style={styles.bankEditorRow}>
                  <View style={styles.bankEditorFields}>
                    <Field
                      label="Bank name"
                      value={bank.name}
                      onChangeText={(value) => updateBank(bank.id, { name: value })}
                      maxLength={100}
                      autoCapitalize="words"
                    />
                    <Field
                      label="Country"
                      value={bank.country}
                      onChangeText={(value) => updateBank(bank.id, { country: value })}
                      maxLength={60}
                      autoCapitalize="words"
                    />
                  </View>
                  {bank.internal ? (
                    <Text style={styles.requiredTag}>Required</Text>
                  ) : (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${bank.name}`}
                      onPress={() => removeBank(bank.id)}
                      style={styles.removeButton}
                    >
                      <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
                    </Pressable>
                  )}
                </View>
              ))}
              <View style={styles.bankEditorFields}>
                <Field
                  label="New bank name"
                  value={newBankName}
                  onChangeText={setNewBankName}
                  placeholder="Bank name"
                  maxLength={100}
                  autoCapitalize="words"
                />
                <Field
                  label="Country"
                  value={newBankCountry}
                  onChangeText={setNewBankCountry}
                  placeholder="Country"
                  maxLength={60}
                  autoCapitalize="words"
                />
              </View>
              <Button
                title="Add bank to directory"
                onPress={addBank}
                secondary
                disabled={uiDraft.banks.length >= 100}
              />
            </Card>

            <Button
              title={busy ? 'Publishing…' : 'Publish app changes'}
              onPress={saveUiConfig}
              disabled={busy}
            />
          </>
        )}
        {section === 'Notifications' && (
          <>
            <Text style={styles.sectionTitle}>Send a notification</Text>
            <Card title="In-app notification">
              <Field
                label="Title"
                value={noticeTitle}
                onChangeText={setNoticeTitle}
                placeholder="Service update"
              />
              <Field
                label="Message"
                value={noticeMessage}
                onChangeText={setNoticeMessage}
                placeholder="Write the notification"
                multiline
              />
              <Field
                label="Recipient account ID (optional)"
                value={noticeUserId}
                onChangeText={setNoticeUserId}
                placeholder="Leave blank to notify all accounts"
              />
              <View style={styles.switchRow}>
                <Text style={styles.bodyText}>Also email recipients via Brevo</Text>
                <Switch
                  accessibilityLabel="Also email notification recipients"
                  onValueChange={setEmailNotification}
                  value={emailNotification}
                  trackColor={{ true: COLORS.primary }}
                />
              </View>
              <Text style={styles.mutedText}>
                Broadcast emails are limited to 500 recipients per send. Email content does not change account or transaction records.
              </Text>
              <Button
                title="Publish notification"
                onPress={saveNotification}
                disabled={busy || !noticeTitle.trim() || !noticeMessage.trim()}
              />
            </Card>
          </>
        )}
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

function SidebarItem({ item, active, count, onPress }) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.sidebarItem, active && styles.sidebarItemActive]}
    >
      <Ionicons name={item.icon} size={19} color={active ? '#FFFFFF' : '#A7B2C5'} />
      <Text style={[styles.sidebarItemText, active && styles.sidebarItemTextActive]}>
        {item.title}
      </Text>
      {count > 0 && (
        <View style={[styles.navBadge, active && styles.navBadgeActive]}>
          <Text style={[styles.navBadgeText, active && styles.navBadgeTextActive]}>{count}</Text>
        </View>
      )}
    </Pressable>
  );
}

function ActionChoices({ label, value, onChange }) {
  const choices = [
    { id: 'none', label: 'No action' },
    ...UI_ACTIONS.map((action) => ({ id: action.id, label: action.label })),
  ];
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.chipRow}>
        {choices.map((choice) => (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: value === choice.id }}
            key={choice.id}
            onPress={() => onChange(choice.id)}
            style={[styles.choiceChip, value === choice.id && styles.choiceChipActive]}
          >
            <Text style={[styles.choiceChipText, value === choice.id && styles.choiceChipTextActive]}>
              {choice.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function Stat({ label, value }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.mutedText}>{label}</Text>
    </View>
  );
}

function Card({ title, children }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : 'Date unavailable';
}

const styles = StyleSheet.create({
  page: { flex: 1, minHeight: '100vh', backgroundColor: COLORS.background },
  appShell: { flex: 1, minHeight: '100vh', flexDirection: 'row' },
  sidebar: {
    width: 252,
    flexShrink: 0,
    backgroundColor: '#111827',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
    justifyContent: 'space-between',
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 8, marginBottom: 36 },
  brandMark: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandMarkText: { color: '#FFFFFF', fontSize: 20, fontWeight: '800' },
  brandName: { color: '#FFFFFF', fontSize: 12, fontWeight: '800', letterSpacing: 0.8 },
  brandCaption: { color: '#8995A8', fontSize: 9, fontWeight: '700', letterSpacing: 1, marginTop: 3 },
  sidebarLabel: {
    color: '#748096',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    paddingHorizontal: 11,
    marginBottom: 10,
  },
  sidebarNav: { gap: 5 },
  sidebarItem: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 11,
    borderRadius: 9,
  },
  sidebarItemActive: { backgroundColor: COLORS.primary },
  sidebarItemText: { color: '#A7B2C5', fontSize: 13, fontWeight: '600', flex: 1 },
  sidebarItemTextActive: { color: '#FFFFFF', fontWeight: '700' },
  navBadge: { minWidth: 22, height: 22, borderRadius: 11, backgroundColor: '#263247', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  navBadgeActive: { backgroundColor: 'rgba(255,255,255,0.2)' },
  navBadgeText: { color: '#CBD5E1', fontSize: 11, fontWeight: '700' },
  navBadgeTextActive: { color: '#FFFFFF' },
  sidebarBottom: { gap: 14, borderTopWidth: 1, borderTopColor: '#273244', paddingTop: 16 },
  adminIdentity: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#344054', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  identityCopy: { flex: 1, minWidth: 0 },
  identityName: { color: '#F8FAFC', fontSize: 11, fontWeight: '700' },
  identityRole: { color: '#8995A8', fontSize: 11, marginTop: 3 },
  workspace: { flex: 1, minWidth: 0, minHeight: '100vh' },
  authPage: {
    flex: 1,
    minHeight: '100vh',
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  authCard: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: COLORS.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 28,
    gap: 12,
  },
  centered: { flex: 1, minHeight: '100vh', alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: COLORS.background },
  topBar: {
    minHeight: 80,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  desktopTopBar: {
    minHeight: 106,
    paddingHorizontal: 36,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  mobileBrand: { flexDirection: 'row', alignItems: 'center', gap: 9, flex: 1, minWidth: 0 },
  pageHeading: { flex: 1 },
  eyebrow: { color: COLORS.primary, fontSize: 10, fontWeight: '800', letterSpacing: 1.2, marginBottom: 5 },
  title: { color: COLORS.ink, fontSize: 23, fontWeight: '800' },
  mobileNav: { paddingHorizontal: 12, backgroundColor: COLORS.card, gap: 5, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  mobileNavItem: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  mobileNavItemActive: { borderBottomColor: COLORS.primary },
  mobileNavText: { color: COLORS.muted, fontSize: 12, fontWeight: '600' },
  mainScroll: { flex: 1 },
  content: { width: '100%', maxWidth: 1120, alignSelf: 'center', padding: 18, gap: 14 },
  desktopContent: { paddingHorizontal: 36, paddingVertical: 30, gap: 18 },
  sectionTitle: { color: COLORS.ink, fontSize: 21, fontWeight: '800' },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  stat: { flexGrow: 1, flexBasis: 180, backgroundColor: COLORS.card, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, padding: 18, gap: 4 },
  statValue: { color: COLORS.ink, fontSize: 25, fontWeight: '800' },
  card: { backgroundColor: COLORS.card, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, padding: 18, gap: 12, shadowColor: '#1C2740', shadowOpacity: 0.035, shadowRadius: 10, shadowOffset: { width: 0, height: 3 } },
  cardTitle: { color: COLORS.ink, fontSize: 16, fontWeight: '700' },
  bodyText: { color: COLORS.ink, fontSize: 14, lineHeight: 21 },
  mutedText: { color: COLORS.muted, fontSize: 13, lineHeight: 19 },
  field: { gap: 6 },
  fieldLabel: { color: COLORS.ink, fontSize: 13, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, color: COLORS.ink, backgroundColor: '#FFFFFF', fontSize: 14 },
  multilineInput: { minHeight: 96, textAlignVertical: 'top' },
  formGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  formColumn: { flexGrow: 1, flexBasis: 185, flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  colorSwatch: { width: 36, height: 40, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border },
  palettePreview: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, overflow: 'hidden' },
  palettePreviewScreen: { padding: 14 },
  palettePreviewCard: { borderRadius: 10, padding: 14, gap: 8, maxWidth: 320, borderWidth: 1, borderColor: COLORS.border },
  previewTitle: { fontSize: 15, fontWeight: '800' },
  previewCopy: { color: COLORS.muted, fontSize: 12 },
  previewButton: { alignSelf: 'flex-start', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12 },
  previewButtonText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  sectionDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: 4 },
  configRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderTopWidth: 1, borderTopColor: COLORS.border, paddingVertical: 10 },
  configActionIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1EEFF', alignItems: 'center', justifyContent: 'center' },
  configActionMain: { flex: 1, minWidth: 100 },
  removeButton: { width: 36, height: 36, borderRadius: 9, backgroundColor: '#FEF3F2', alignItems: 'center', justifyContent: 'center' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choiceChip: { borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, backgroundColor: '#FFFFFF', paddingVertical: 8, paddingHorizontal: 11 },
  choiceChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  choiceChipText: { color: COLORS.ink, fontSize: 11, fontWeight: '600' },
  choiceChipTextActive: { color: '#FFFFFF' },
  bankEditorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderTopWidth: 1, borderTopColor: COLORS.border, paddingVertical: 12 },
  bankEditorFields: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  requiredTag: { color: COLORS.muted, backgroundColor: '#F1F3F8', overflow: 'hidden', borderRadius: 12, paddingVertical: 6, paddingHorizontal: 9, fontSize: 10, fontWeight: '700' },
  button: { minHeight: 38, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 9, alignSelf: 'flex-start' },
  buttonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  secondaryButton: { backgroundColor: '#F1F3F8', borderWidth: 1, borderColor: COLORS.border },
  secondaryButtonText: { color: COLORS.ink },
  dangerButton: { backgroundColor: COLORS.danger },
  disabledButton: { opacity: 0.55 },
  stateButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  switchRow: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  feedback: { color: COLORS.green, fontSize: 13, lineHeight: 19 },
  error: { color: COLORS.danger, fontSize: 13 },
});
