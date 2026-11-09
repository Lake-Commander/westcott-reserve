-- Create profiles table linked to Supabase auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT DEFAULT 'Account Holder',
  username TEXT UNIQUE,
  account_number TEXT UNIQUE DEFAULT ('80' || floor(random() * (90000000) + 10000000)::text),
  balance NUMERIC(12, 2) DEFAULT 250000.00,
  savings_balance NUMERIC(12, 2) DEFAULT 0.00,
  currency TEXT DEFAULT 'USD',
  mpin TEXT DEFAULT '0000',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('CREDIT', 'DEBIT')) NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  counterparty TEXT DEFAULT 'Direct Transfer',
  receiver_name TEXT,
  account_number TEXT,
  category TEXT DEFAULT 'Transfer',
  note TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Transactions Policies
CREATE POLICY "Users can view own transactions" 
  ON public.transactions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" 
  ON public.transactions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Realtime publication for balance & transaction updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;

-- Admin access is granted manually to existing auth users by a database
-- administrator. Never add a public sign-up path for admin_users.
CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_users FROM anon, authenticated;
GRANT SELECT ON public.admin_users TO service_role;
GRANT SELECT ON public.profiles TO service_role;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()
  );
$$;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

CREATE TABLE IF NOT EXISTS public.account_suspensions (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  suspended_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  suspended_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.account_suspensions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.account_suspensions FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.is_account_active()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT auth.uid() IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.account_suspensions WHERE user_id = auth.uid()
  );
$$;
REVOKE ALL ON FUNCTION public.is_account_active() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_account_active() TO authenticated;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id AND public.is_account_active());
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id AND public.is_account_active())
  WITH CHECK (auth.uid() = id AND public.is_account_active());
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id AND public.is_account_active());
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
CREATE POLICY "Users can view own transactions"
  ON public.transactions FOR SELECT TO authenticated
  USING (auth.uid() = user_id AND public.is_account_active());
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;
CREATE POLICY "Users can insert own transactions"
  ON public.transactions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.is_account_active());

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

DROP FUNCTION IF EXISTS public.admin_list_profiles();
CREATE OR REPLACE FUNCTION public.admin_list_profiles()
RETURNS TABLE (
  id UUID,
  email TEXT,
  name TEXT,
  username TEXT,
  balance NUMERIC,
  created_at TIMESTAMPTZ,
  is_active BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  RETURN QUERY
    SELECT p.id, p.email, p.name, p.username, p.balance, p.created_at,
      NOT EXISTS (
        SELECT 1 FROM public.account_suspensions AS s WHERE s.user_id = p.id
      ) AS is_active
    FROM public.profiles AS p
    ORDER BY p.created_at DESC
    LIMIT 500;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_list_profiles() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_profiles() TO authenticated;

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS review_status TEXT NOT NULL DEFAULT 'normal'
    CHECK (review_status IN ('normal', 'flagged', 'paused'));

DROP POLICY IF EXISTS "Admins can view all transactions" ON public.transactions;
CREATE POLICY "Admins can view all transactions"
  ON public.transactions FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_audit_log FROM anon, authenticated;
GRANT SELECT ON public.admin_audit_log TO authenticated;
GRANT INSERT ON public.admin_audit_log TO service_role;
DROP POLICY IF EXISTS "Admins can view audit log" ON public.admin_audit_log;
CREATE POLICY "Admins can view audit log"
  ON public.admin_audit_log FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE TABLE IF NOT EXISTS public.customer_care_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  subject TEXT NOT NULL CHECK (char_length(subject) BETWEEN 1 AND 160),
  message TEXT NOT NULL CHECK (char_length(message) BETWEEN 1 AND 5000),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  admin_reply TEXT,
  responded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.customer_care_messages ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON public.customer_care_messages TO authenticated;
DROP POLICY IF EXISTS "Users can create own customer care messages" ON public.customer_care_messages;
CREATE POLICY "Users can create own customer care messages"
  ON public.customer_care_messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.is_account_active());
DROP POLICY IF EXISTS "Admins can view customer care messages" ON public.customer_care_messages;
CREATE POLICY "Admins can view customer care messages"
  ON public.customer_care_messages FOR SELECT TO authenticated
  USING (public.is_admin());
DROP POLICY IF EXISTS "Users can view own customer care messages" ON public.customer_care_messages;
CREATE POLICY "Users can view own customer care messages"
  ON public.customer_care_messages FOR SELECT TO authenticated
  USING (auth.uid() = user_id AND public.is_account_active());
REVOKE UPDATE, DELETE ON public.customer_care_messages FROM anon, authenticated;
GRANT SELECT ON public.customer_care_messages TO service_role;

CREATE OR REPLACE FUNCTION public.set_customer_care_sender_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  SELECT u.email INTO NEW.email FROM auth.users AS u WHERE u.id = auth.uid();
  IF NEW.email IS NULL THEN
    RAISE EXCEPTION 'A signed-in email address is required';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS customer_care_sender_email ON public.customer_care_messages;
CREATE TRIGGER customer_care_sender_email
  BEFORE INSERT ON public.customer_care_messages
  FOR EACH ROW EXECUTE FUNCTION public.set_customer_care_sender_email();

CREATE TABLE IF NOT EXISTS public.app_feature_flags (
  feature_key TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.app_feature_flags ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.app_feature_flags TO authenticated;
INSERT INTO public.app_feature_flags (feature_key, label, enabled) VALUES
  ('transfers', 'Transfers', TRUE),
  ('cards', 'Cards', TRUE),
  ('savings', 'Savings', TRUE),
  ('bill_payments', 'Bill payments', TRUE)
ON CONFLICT (feature_key) DO NOTHING;
DROP POLICY IF EXISTS "Authenticated users can read feature flags" ON public.app_feature_flags;
CREATE POLICY "Authenticated users can read feature flags"
  ON public.app_feature_flags FOR SELECT TO authenticated
  USING (true);
REVOKE INSERT, UPDATE, DELETE ON public.app_feature_flags FROM anon, authenticated;

CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audience_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 160),
  message TEXT NOT NULL CHECK (char_length(message) BETWEEN 1 AND 5000),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.admin_notifications TO authenticated;
DROP POLICY IF EXISTS "Users can read notifications for their account" ON public.admin_notifications;
CREATE POLICY "Users can read notifications for their account"
  ON public.admin_notifications FOR SELECT TO authenticated
  USING (
    public.is_account_active() AND
    (audience_user_id IS NULL OR audience_user_id = auth.uid())
  );
REVOKE INSERT, UPDATE, DELETE ON public.admin_notifications FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.is_feature_enabled(p_feature_key TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT public.is_account_active() AND COALESCE(
    (SELECT enabled FROM public.app_feature_flags WHERE feature_key = p_feature_key),
    TRUE
  );
$$;
REVOKE ALL ON FUNCTION public.is_feature_enabled(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_feature_enabled(TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_set_transaction_review(
  p_transaction_id UUID,
  p_status TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  IF p_status NOT IN ('normal', 'flagged', 'paused') THEN
    RAISE EXCEPTION 'Invalid transaction review status';
  END IF;
  UPDATE public.transactions
  SET review_status = p_status
  WHERE id = p_transaction_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transaction not found';
  END IF;

  INSERT INTO public.admin_audit_log (actor_id, action, entity_type, entity_id, details)
  VALUES (
    auth.uid(), 'transaction_review_updated', 'transaction', p_transaction_id::TEXT,
    jsonb_build_object('status', p_status)
  );
END;
$$;
REVOKE ALL ON FUNCTION public.admin_set_transaction_review(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_transaction_review(UUID, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_set_account_access(
  p_user_id UUID,
  p_active BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  IF p_user_id IS NULL OR p_active IS NULL THEN
    RAISE EXCEPTION 'Account and access status are required';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'Account not found';
  END IF;

  IF p_active THEN
    DELETE FROM public.account_suspensions WHERE user_id = p_user_id;
  ELSE
    INSERT INTO public.account_suspensions (user_id, suspended_by)
    VALUES (p_user_id, auth.uid())
    ON CONFLICT (user_id) DO UPDATE
      SET suspended_by = EXCLUDED.suspended_by, suspended_at = now();
  END IF;

  INSERT INTO public.admin_audit_log (actor_id, action, entity_type, entity_id, details)
  VALUES (
    auth.uid(), 'account_access_updated', 'account', p_user_id::TEXT,
    jsonb_build_object('active', p_active)
  );
END;
$$;
REVOKE ALL ON FUNCTION public.admin_set_account_access(UUID, BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_account_access(UUID, BOOLEAN) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_reply_to_customer_care(
  p_message_id UUID,
  p_reply TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  IF p_reply IS NULL OR char_length(btrim(p_reply)) NOT BETWEEN 1 AND 5000 THEN
    RAISE EXCEPTION 'Reply must be between 1 and 5000 characters';
  END IF;

  UPDATE public.customer_care_messages
  SET admin_reply = btrim(p_reply), status = 'resolved',
      responded_by = auth.uid(), updated_at = now()
  WHERE id = p_message_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Customer care message not found';
  END IF;

  INSERT INTO public.admin_audit_log (actor_id, action, entity_type, entity_id)
  VALUES (auth.uid(), 'customer_care_replied', 'customer_care_message', p_message_id::TEXT);
END;
$$;
REVOKE ALL ON FUNCTION public.admin_reply_to_customer_care(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_reply_to_customer_care(UUID, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_set_feature_flag(
  p_feature_key TEXT,
  p_enabled BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  UPDATE public.app_feature_flags
  SET enabled = p_enabled, updated_by = auth.uid(), updated_at = now()
  WHERE feature_key = p_feature_key;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unknown feature flag';
  END IF;

  INSERT INTO public.admin_audit_log (actor_id, action, entity_type, entity_id, details)
  VALUES (
    auth.uid(), 'feature_flag_updated', 'feature_flag', p_feature_key,
    jsonb_build_object('enabled', p_enabled)
  );
END;
$$;
REVOKE ALL ON FUNCTION public.admin_set_feature_flag(TEXT, BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_feature_flag(TEXT, BOOLEAN) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_create_notification(
  p_title TEXT,
  p_message TEXT,
  p_audience_user_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  notification_id UUID;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  IF p_title IS NULL OR char_length(btrim(p_title)) NOT BETWEEN 1 AND 160
     OR p_message IS NULL OR char_length(btrim(p_message)) NOT BETWEEN 1 AND 5000 THEN
    RAISE EXCEPTION 'Notification title or message is invalid';
  END IF;
  IF p_audience_user_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = p_audience_user_id
  ) THEN
    RAISE EXCEPTION 'Notification recipient not found';
  END IF;

  INSERT INTO public.admin_notifications (audience_user_id, title, message, created_by)
  VALUES (p_audience_user_id, btrim(p_title), btrim(p_message), auth.uid())
  RETURNING id INTO notification_id;

  INSERT INTO public.admin_audit_log (actor_id, action, entity_type, entity_id, details)
  VALUES (
    auth.uid(), 'notification_created', 'notification', notification_id::TEXT,
    jsonb_build_object('audience_user_id', p_audience_user_id, 'title', btrim(p_title))
  );
  RETURN notification_id;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_create_notification(TEXT, TEXT, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_create_notification(TEXT, TEXT, UUID) TO authenticated;

-- Server-driven presentation settings. Only prebuilt app components/actions are
-- configurable; this table never contains executable code.
CREATE TABLE IF NOT EXISTS public.app_ui_config (
  id TEXT PRIMARY KEY CHECK (id = 'default'),
  config JSONB NOT NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.app_ui_config ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.app_ui_config TO authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.app_ui_config FROM anon, authenticated;
DROP POLICY IF EXISTS "Active users can read app UI config" ON public.app_ui_config;
CREATE POLICY "Active users can read app UI config"
  ON public.app_ui_config FOR SELECT TO authenticated
  USING (public.is_account_active());

INSERT INTO public.app_ui_config (id, config)
VALUES (
  'default',
  $ui$
  {
    "version": 1,
    "theme": {
      "accent": "#7052FF",
      "lightBackground": "#F1F5F9",
      "lightCard": "#FFFFFF",
      "darkBackground": "#0A0A0C",
      "darkCard": "#16161A"
    },
    "home": {
      "heroEnabled": true,
      "heroTitle": "A more personal banking experience",
      "heroSubtitle": "Manage your account with clarity and confidence.",
      "heroButtonLabel": "Explore transfers",
      "heroAction": "transfers",
      "promoEnabled": true,
      "promoTitle": "Make your money work harder",
      "promoDescription": "Explore savings options designed around your goals.",
      "promoButtonLabel": "Explore savings",
      "promoAction": "savings",
      "quickActions": [
        {"id": "pay_bills", "label": "Pay Bills", "enabled": true},
        {"id": "savings", "label": "Savings", "enabled": true},
        {"id": "global_accounts", "label": "Global", "enabled": true},
        {"id": "cards", "label": "Cards", "enabled": true}
      ]
    },
    "banks": [
      {"id":"westcott","name":"Westcott Reserve","country":"United States","internal":true},
      {"id":"chase","name":"JPMorgan Chase","country":"United States","internal":false},
      {"id":"bank-of-america","name":"Bank of America","country":"United States","internal":false},
      {"id":"wells-fargo","name":"Wells Fargo","country":"United States","internal":false},
      {"id":"citi-us","name":"Citi","country":"United States","internal":false},
      {"id":"us-bank","name":"U.S. Bank","country":"United States","internal":false},
      {"id":"capital-one","name":"Capital One","country":"United States","internal":false},
      {"id":"pnc","name":"PNC Bank","country":"United States","internal":false},
      {"id":"td-us","name":"TD Bank","country":"United States","internal":false},
      {"id":"barclays","name":"Barclays","country":"United Kingdom","internal":false},
      {"id":"hsbc-uk","name":"HSBC UK","country":"United Kingdom","internal":false},
      {"id":"lloyds","name":"Lloyds Bank","country":"United Kingdom","internal":false},
      {"id":"natwest","name":"NatWest","country":"United Kingdom","internal":false},
      {"id":"deutsche-bank","name":"Deutsche Bank","country":"Germany","internal":false},
      {"id":"commerzbank","name":"Commerzbank","country":"Germany","internal":false},
      {"id":"bnp-paribas","name":"BNP Paribas","country":"France","internal":false},
      {"id":"societe-generale","name":"Société Générale","country":"France","internal":false},
      {"id":"ubs","name":"UBS","country":"Switzerland","internal":false},
      {"id":"ing","name":"ING","country":"Netherlands","internal":false},
      {"id":"santander","name":"Santander","country":"Spain","internal":false},
      {"id":"unicredit","name":"UniCredit","country":"Italy","internal":false},
      {"id":"aib","name":"AIB","country":"Ireland","internal":false}
    ]
  }
  $ui$::jsonb
)
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.admin_update_app_ui_config(p_config JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  bank_item JSONB;
  action_item JSONB;
  saved_config JSONB;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  IF jsonb_typeof(p_config) <> 'object' OR p_config->>'version' <> '1' THEN
    RAISE EXCEPTION 'Unsupported UI configuration format';
  END IF;
  IF jsonb_typeof(p_config->'theme') <> 'object'
     OR COALESCE(p_config #>> '{theme,accent}', '') !~ '^#[0-9A-Fa-f]{6}$'
     OR COALESCE(p_config #>> '{theme,lightBackground}', '') !~ '^#[0-9A-Fa-f]{6}$'
     OR COALESCE(p_config #>> '{theme,lightCard}', '') !~ '^#[0-9A-Fa-f]{6}$'
     OR COALESCE(p_config #>> '{theme,darkBackground}', '') !~ '^#[0-9A-Fa-f]{6}$'
     OR COALESCE(p_config #>> '{theme,darkCard}', '') !~ '^#[0-9A-Fa-f]{6}$' THEN
    RAISE EXCEPTION 'Theme colors must be six-digit hexadecimal colors';
  END IF;
  IF jsonb_typeof(p_config->'home') <> 'object'
     OR jsonb_typeof(p_config #> '{home,heroEnabled}') <> 'boolean'
     OR jsonb_typeof(p_config #> '{home,promoEnabled}') <> 'boolean'
     OR COALESCE(char_length(p_config #>> '{home,heroTitle}'), 0) NOT BETWEEN 1 AND 100
     OR COALESCE(char_length(p_config #>> '{home,heroSubtitle}'), 0) NOT BETWEEN 1 AND 240
     OR COALESCE(char_length(p_config #>> '{home,heroButtonLabel}'), 0) NOT BETWEEN 1 AND 32
     OR COALESCE(p_config #>> '{home,heroAction}', '') NOT IN (
       'none', 'transfers', 'cards', 'pay_bills', 'savings',
       'global_accounts', 'history', 'customer_care'
     )
     OR jsonb_typeof(p_config #> '{home,quickActions}') <> 'array'
     OR jsonb_array_length(p_config #> '{home,quickActions}') > 7
     OR jsonb_typeof(p_config #> '{home,promoEnabled}') <> 'boolean'
     OR COALESCE(char_length(p_config #>> '{home,promoTitle}'), 0) NOT BETWEEN 1 AND 100
     OR COALESCE(char_length(p_config #>> '{home,promoDescription}'), 0) NOT BETWEEN 1 AND 240
     OR COALESCE(char_length(p_config #>> '{home,promoButtonLabel}'), 0) NOT BETWEEN 1 AND 32
     OR COALESCE(p_config #>> '{home,promoAction}', '') NOT IN (
       'none', 'transfers', 'cards', 'pay_bills', 'savings',
       'global_accounts', 'history', 'customer_care'
     ) THEN
    RAISE EXCEPTION 'Home UI settings are invalid';
  END IF;

  FOR action_item IN SELECT value FROM jsonb_array_elements(p_config #> '{home,quickActions}')
  LOOP
    IF jsonb_typeof(action_item) <> 'object'
       OR COALESCE(action_item->>'id', '') NOT IN (
         'transfers', 'cards', 'pay_bills', 'savings',
         'global_accounts', 'history', 'customer_care'
       )
       OR COALESCE(char_length(action_item->>'label'), 0) NOT BETWEEN 1 AND 24
       OR jsonb_typeof(action_item->'enabled') <> 'boolean' THEN
      RAISE EXCEPTION 'A home quick action is invalid';
    END IF;
  END LOOP;
  IF (
    SELECT count(*) <> count(DISTINCT value->>'id')
    FROM jsonb_array_elements(p_config #> '{home,quickActions}')
  ) THEN
    RAISE EXCEPTION 'Home quick actions must be unique';
  END IF;

  IF jsonb_typeof(p_config->'banks') <> 'array'
     OR jsonb_array_length(p_config->'banks') NOT BETWEEN 1 AND 100 THEN
    RAISE EXCEPTION 'Bank list must contain between 1 and 100 banks';
  END IF;
  FOR bank_item IN SELECT value FROM jsonb_array_elements(p_config->'banks')
  LOOP
    IF jsonb_typeof(bank_item) <> 'object'
       OR COALESCE(bank_item->>'id', '') !~ '^[a-z0-9][a-z0-9-]{0,59}$'
       OR COALESCE(char_length(bank_item->>'name'), 0) NOT BETWEEN 1 AND 100
       OR COALESCE(char_length(bank_item->>'country'), 0) NOT BETWEEN 1 AND 60
       OR jsonb_typeof(bank_item->'internal') <> 'boolean' THEN
      RAISE EXCEPTION 'A bank entry is invalid';
    END IF;
  END LOOP;
  IF (
    SELECT count(*) <> count(DISTINCT value->>'id')
    FROM jsonb_array_elements(p_config->'banks')
  ) OR NOT EXISTS (
    SELECT 1
    FROM jsonb_array_elements(p_config->'banks') AS bank
    WHERE bank->>'id' = 'westcott' AND bank->'internal' = 'true'::jsonb
  ) THEN
    RAISE EXCEPTION 'Bank IDs must be unique and the internal bank must remain available';
  END IF;

  INSERT INTO public.app_ui_config (id, config, updated_by, updated_at)
  VALUES ('default', p_config, auth.uid(), now())
  ON CONFLICT (id) DO UPDATE
    SET config = EXCLUDED.config, updated_by = EXCLUDED.updated_by,
        updated_at = EXCLUDED.updated_at
  RETURNING config INTO saved_config;

  INSERT INTO public.admin_audit_log (actor_id, action, entity_type, entity_id, details)
  VALUES (
    auth.uid(), 'app_ui_config_updated', 'app_ui_config', 'default',
    jsonb_build_object(
      'bank_count', jsonb_array_length(p_config->'banks'),
      'quick_action_count', jsonb_array_length(p_config #> '{home,quickActions}')
    )
  );
  RETURN saved_config;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_update_app_ui_config(JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_app_ui_config(JSONB) TO authenticated;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
     AND NOT EXISTS (
       SELECT 1 FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime'
         AND schemaname = 'public'
         AND tablename = 'app_ui_config'
     ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.app_ui_config;
  END IF;
END;
$$;