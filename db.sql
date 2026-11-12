-- Create profiles table linked to Supabase auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  name TEXT DEFAULT 'Account Holder',
  username TEXT UNIQUE,
  account_number TEXT UNIQUE DEFAULT ('80' || floor(random() * (90000000) + 10000000)::text),
  balance NUMERIC(12, 2) DEFAULT 0.00,
  savings_balance NUMERIC(12, 2) DEFAULT 0.00,
  currency TEXT DEFAULT 'USD',
  mpin TEXT DEFAULT '0000',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- Update existing installations without changing any stored account balances.
ALTER TABLE public.profiles
  ALTER COLUMN balance SET DEFAULT 0.00;

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
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS receiver_name TEXT,
  ADD COLUMN IF NOT EXISTS account_number TEXT,
  ADD COLUMN IF NOT EXISTS bank_name TEXT;

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Realtime publication for balance & transaction updates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
     AND NOT EXISTS (
       SELECT 1 FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime'
         AND schemaname = 'public'
         AND tablename = 'profiles'
     ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
     AND NOT EXISTS (
       SELECT 1 FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime'
         AND schemaname = 'public'
         AND tablename = 'transactions'
     ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
  END IF;
END;
$$;

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

CREATE TABLE IF NOT EXISTS public.user_mfa_requirements (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_mfa_requirements ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.user_mfa_requirements FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.is_mfa_access_allowed()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT auth.uid() IS NOT NULL AND (
    NOT EXISTS (
      SELECT 1 FROM public.user_mfa_requirements WHERE user_id = auth.uid()
    )
    OR COALESCE(auth.jwt() ->> 'aal' = 'aal2', FALSE)
  );
$$;
REVOKE ALL ON FUNCTION public.is_mfa_access_allowed() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_mfa_access_allowed() TO authenticated;

CREATE OR REPLACE FUNCTION public.set_user_mfa_requirement(p_enabled BOOLEAN)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.jwt() ->> 'aal' IS DISTINCT FROM 'aal2' THEN
    RAISE EXCEPTION 'Complete authenticator verification before changing MFA settings';
  END IF;
  IF p_enabled IS NULL THEN
    RAISE EXCEPTION 'MFA setting is required';
  END IF;

  IF p_enabled THEN
    INSERT INTO public.user_mfa_requirements (user_id)
    VALUES (auth.uid())
    ON CONFLICT (user_id) DO NOTHING;
  ELSE
    DELETE FROM public.user_mfa_requirements WHERE user_id = auth.uid();
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.set_user_mfa_requirement(BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_user_mfa_requirement(BOOLEAN) TO authenticated;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT public.is_mfa_access_allowed() AND EXISTS (
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

CREATE TABLE IF NOT EXISTS public.account_transfer_restrictions (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  restricted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.account_transfer_restrictions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.account_transfer_restrictions FROM anon, authenticated;
GRANT SELECT ON public.account_transfer_restrictions TO authenticated;
DROP POLICY IF EXISTS "Admins can view account transfer restrictions" ON public.account_transfer_restrictions;
CREATE POLICY "Admins can view account transfer restrictions"
  ON public.account_transfer_restrictions FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.is_account_transfer_blocked()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1
    FROM public.account_transfer_restrictions
    WHERE user_id = auth.uid()
  );
$$;
REVOKE ALL ON FUNCTION public.is_account_transfer_blocked() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_account_transfer_blocked() TO authenticated;

CREATE OR REPLACE FUNCTION public.reject_restricted_account_debits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.type = 'DEBIT' AND EXISTS (
    SELECT 1
    FROM public.account_transfer_restrictions
    WHERE user_id = NEW.user_id
  ) THEN
    RAISE EXCEPTION
      'We could not process this transfer. Please contact support@westcott.com for assistance.';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.reject_restricted_account_debits() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS reject_restricted_account_debits ON public.transactions;
CREATE TRIGGER reject_restricted_account_debits
  BEFORE INSERT ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.reject_restricted_account_debits();

CREATE OR REPLACE FUNCTION public.admin_set_account_transfer_restriction(
  p_user_id UUID,
  p_restricted BOOLEAN
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
  IF p_user_id IS NULL OR p_restricted IS NULL THEN
    RAISE EXCEPTION 'Account and transfer restriction status are required';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'Account not found';
  END IF;

  IF p_restricted THEN
    INSERT INTO public.account_transfer_restrictions (user_id, restricted_by)
    VALUES (p_user_id, auth.uid())
    ON CONFLICT (user_id) DO UPDATE
      SET restricted_by = EXCLUDED.restricted_by, created_at = now();
  ELSE
    DELETE FROM public.account_transfer_restrictions
    WHERE user_id = p_user_id;
  END IF;

  INSERT INTO public.admin_audit_log (actor_id, action, entity_type, entity_id, details)
  VALUES (
    auth.uid(),
    'account_transfer_restriction_updated',
    'account',
    p_user_id::TEXT,
    jsonb_build_object('restricted', p_restricted)
  );
END;
$$;
REVOKE ALL ON FUNCTION public.admin_set_account_transfer_restriction(UUID, BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_account_transfer_restriction(UUID, BOOLEAN) TO authenticated;

CREATE OR REPLACE FUNCTION public.is_account_active()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT public.is_mfa_access_allowed() AND auth.uid() IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.account_suspensions WHERE user_id = auth.uid()
  );
$$;
REVOKE ALL ON FUNCTION public.is_account_active() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_account_active() TO authenticated;

CREATE OR REPLACE FUNCTION public.resolve_transfer_recipient(p_query TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  username TEXT,
  account_number TEXT,
  is_self BOOLEAN
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  lookup_value TEXT;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_account_active() THEN
    RAISE EXCEPTION 'A signed-in active account is required';
  END IF;
  lookup_value := lower(regexp_replace(btrim(COALESCE(p_query, '')), '^@', ''));
  IF lookup_value = '' OR char_length(lookup_value) > 100 THEN
    RAISE EXCEPTION 'A valid username or account number is required';
  END IF;

  RETURN QUERY
    SELECT p.id, p.name, p.username, p.account_number, p.id = auth.uid()
    FROM public.profiles AS p
    WHERE lower(p.username) = lookup_value OR p.account_number = btrim(p_query)
    ORDER BY (p.account_number = btrim(p_query)) DESC
    LIMIT 1;
END;
$$;
REVOKE ALL ON FUNCTION public.resolve_transfer_recipient(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.resolve_transfer_recipient(TEXT) TO authenticated;

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

-- Remove permissive policies created by the original prototype schema. They
-- override the account-scoped policies above because PostgreSQL ORs policies.
DROP POLICY IF EXISTS "Allow public read/write profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable all for authenticated users on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view and update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow public read/write transactions" ON public.transactions;
DROP POLICY IF EXISTS "Enable all for authenticated users on transactions" ON public.transactions;

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

DROP FUNCTION IF EXISTS public.admin_list_profiles();
CREATE OR REPLACE FUNCTION public.admin_list_profiles()
RETURNS TABLE (
  id UUID,
  email TEXT,
  name TEXT,
  username TEXT,
  balance NUMERIC,
  currency TEXT,
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
    SELECT p.id, p.email, p.name, p.username, p.balance, p.currency, p.created_at,
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

-- Admin membership is managed only by a database administrator in the
-- Supabase SQL Editor. These functions are not callable from the app/API.
CREATE OR REPLACE FUNCTION public.admin_grant_access(p_email TEXT)
RETURNS VOID
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
DECLARE
  target_user_id UUID;
BEGIN
  IF current_user NOT IN ('postgres', 'supabase_admin') THEN
    RAISE EXCEPTION 'Database administrator access required';
  END IF;
  IF p_email IS NULL OR btrim(p_email) = '' THEN
    RAISE EXCEPTION 'A user email is required';
  END IF;

  SELECT u.id INTO target_user_id
  FROM auth.users AS u
  WHERE lower(u.email) = lower(btrim(p_email));
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'No authenticated user was found for that email';
  END IF;

  LOCK TABLE public.admin_users IN EXCLUSIVE MODE;
  INSERT INTO public.admin_users (user_id)
  VALUES (target_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  IF FOUND THEN
    INSERT INTO public.admin_audit_log (action, entity_type, entity_id, details)
    VALUES (
      'admin_access_granted',
      'admin_user',
      target_user_id::TEXT,
      jsonb_build_object('source', 'sql_editor')
    );
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_grant_access(TEXT)
  FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.admin_revoke_access(p_email TEXT)
RETURNS VOID
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
DECLARE
  target_user_id UUID;
  admin_count BIGINT;
BEGIN
  IF current_user NOT IN ('postgres', 'supabase_admin') THEN
    RAISE EXCEPTION 'Database administrator access required';
  END IF;
  IF p_email IS NULL OR btrim(p_email) = '' THEN
    RAISE EXCEPTION 'A user email is required';
  END IF;

  SELECT u.id INTO target_user_id
  FROM auth.users AS u
  WHERE lower(u.email) = lower(btrim(p_email));
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'No authenticated user was found for that email';
  END IF;

  LOCK TABLE public.admin_users IN EXCLUSIVE MODE;
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = target_user_id
  ) THEN
    RAISE EXCEPTION 'That user does not have admin access';
  END IF;
  SELECT count(*) INTO admin_count FROM public.admin_users;
  IF admin_count <= 1 THEN
    RAISE EXCEPTION 'Cannot revoke access from the last administrator';
  END IF;

  DELETE FROM public.admin_users WHERE user_id = target_user_id;
  INSERT INTO public.admin_audit_log (action, entity_type, entity_id, details)
  VALUES (
    'admin_access_revoked',
    'admin_user',
    target_user_id::TEXT,
    jsonb_build_object('source', 'sql_editor')
  );
END;
$$;
REVOKE ALL ON FUNCTION public.admin_revoke_access(TEXT)
  FROM PUBLIC, anon, authenticated, service_role;

-- In Supabase SQL Editor, run:
-- SELECT public.admin_grant_access('admin@example.com');
-- SELECT public.admin_revoke_access('admin@example.com');

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
  USING (public.is_account_active());
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

CREATE OR REPLACE FUNCTION public.notify_user_of_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  transaction_currency TEXT;
  notification_title TEXT;
BEGIN
  IF NEW.amount <= 0 THEN
    RETURN NEW;
  END IF;

  SELECT currency INTO transaction_currency
  FROM public.profiles
  WHERE id = NEW.user_id;

  IF NEW.type = 'CREDIT' THEN
    notification_title := 'Money received';
  ELSE
    notification_title := 'Transfer recorded';
  END IF;

  INSERT INTO public.admin_notifications (audience_user_id, title, message)
  VALUES (
    NEW.user_id,
    notification_title,
    format(
      'A transaction of %s %s was recorded. Open History to review the details.',
      COALESCE(transaction_currency, 'USD'),
      to_char(NEW.amount, 'FM999,999,999,990.00')
    )
  );

  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.notify_user_of_transaction() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS notify_user_of_transaction ON public.transactions;
CREATE TRIGGER notify_user_of_transaction
  AFTER INSERT ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_user_of_transaction();

CREATE OR REPLACE FUNCTION public.is_feature_enabled(p_feature_key TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT public.is_account_active()
    AND (
      p_feature_key <> 'transfers'
      OR NOT public.is_account_transfer_blocked()
    )
    AND COALESCE(
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

--ADMIN ADD BALANCE CONTROL
CREATE OR REPLACE FUNCTION admin_add_funds(p_user_id UUID, p_amount NUMERIC)
RETURNS void AS $$
BEGIN
  -- Verify the caller is an admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Add the funds to the user's balance
  UPDATE public.profiles
  SET balance = COALESCE(balance, 0) + p_amount
  WHERE id = p_user_id;

  -- Log it as a transaction so it appears in their app history
  INSERT INTO public.transactions (user_id, type, amount, counterparty, review_status)
  VALUES (p_user_id, 'credit', p_amount, 'System Admin Deposit', 'normal');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
     AND NOT EXISTS (
       SELECT 1 FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime'
         AND schemaname = 'public'
         AND tablename = 'admin_notifications'
     ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notifications;
  END IF;
END;
$$;

-- Per-account app preferences. Email and SMS preferences are intentionally
-- omitted until those delivery channels are configured.
CREATE TABLE IF NOT EXISTS public.app_user_settings (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  show_balance_on_launch BOOLEAN NOT NULL DEFAULT TRUE,
  push_notifications_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  in_app_notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.app_user_settings ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.app_user_settings TO authenticated;
REVOKE ALL ON public.app_user_settings FROM anon;
DROP POLICY IF EXISTS "Users can read own app settings" ON public.app_user_settings;
CREATE POLICY "Users can read own app settings"
  ON public.app_user_settings FOR SELECT TO authenticated
  USING (auth.uid() = user_id AND public.is_account_active());
DROP POLICY IF EXISTS "Users can create own app settings" ON public.app_user_settings;
CREATE POLICY "Users can create own app settings"
  ON public.app_user_settings FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.is_account_active());
DROP POLICY IF EXISTS "Users can update own app settings" ON public.app_user_settings;
CREATE POLICY "Users can update own app settings"
  ON public.app_user_settings FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND public.is_account_active())
  WITH CHECK (auth.uid() = user_id AND public.is_account_active());

-- Records the app/device and timestamps for account sign-ins. No location or
-- hardware identifier is collected.
CREATE TABLE IF NOT EXISTS public.device_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (char_length(platform) BETWEEN 1 AND 32),
  model_name TEXT NOT NULL CHECK (char_length(model_name) BETWEEN 1 AND 120),
  os_version TEXT NOT NULL CHECK (char_length(os_version) BETWEEN 1 AND 60),
  app_version TEXT NOT NULL CHECK (char_length(app_version) BETWEEN 1 AND 40),
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  signed_out_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS device_sessions_user_last_seen_idx
  ON public.device_sessions (user_id, last_seen_at DESC);
ALTER TABLE public.device_sessions ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.device_sessions TO authenticated;
REVOKE ALL ON public.device_sessions FROM anon;
DROP POLICY IF EXISTS "Users can read own device sessions" ON public.device_sessions;
CREATE POLICY "Users can read own device sessions"
  ON public.device_sessions FOR SELECT TO authenticated
  USING (auth.uid() = user_id AND public.is_account_active());
DROP POLICY IF EXISTS "Users can record own device sessions" ON public.device_sessions;
CREATE POLICY "Users can record own device sessions"
  ON public.device_sessions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.is_account_active());
DO $$
BEGIN
  IF to_regclass('public.device_sessions') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can update own device sessions" ON public.device_sessions';
    EXECUTE 'CREATE POLICY "Users can update own device sessions"
      ON public.device_sessions FOR UPDATE TO authenticated
      USING (auth.uid() = user_id AND public.is_account_active())
      WITH CHECK (auth.uid() = user_id AND public.is_account_active())';
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS public.push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  expo_push_token TEXT NOT NULL UNIQUE,
  platform TEXT NOT NULL CHECK (platform IN ('android', 'ios')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS push_tokens_user_id_idx ON public.push_tokens (user_id);
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_tokens TO authenticated;
REVOKE ALL ON public.push_tokens FROM anon;
DROP POLICY IF EXISTS "Users and admins can read push tokens" ON public.push_tokens;
CREATE POLICY "Users and admins can read push tokens"
  ON public.push_tokens FOR SELECT TO authenticated
  USING ((auth.uid() = user_id AND public.is_account_active()) OR public.is_admin());
DROP POLICY IF EXISTS "Users can register own push tokens" ON public.push_tokens;
CREATE POLICY "Users can register own push tokens"
  ON public.push_tokens FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.is_account_active());
DROP POLICY IF EXISTS "Users can update own push tokens" ON public.push_tokens;
CREATE POLICY "Users can update own push tokens"
  ON public.push_tokens FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND public.is_account_active())
  WITH CHECK (auth.uid() = user_id AND public.is_account_active());
DROP POLICY IF EXISTS "Users can remove own push tokens" ON public.push_tokens;
CREATE POLICY "Users can remove own push tokens"
  ON public.push_tokens FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Do not allow a customer to change the account denomination without the
-- administrator's audited conversion flow.
CREATE OR REPLACE FUNCTION public.prevent_customer_currency_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() = OLD.id AND NOT public.is_admin()
     AND NEW.currency IS DISTINCT FROM OLD.currency THEN
    RAISE EXCEPTION 'Only an administrator can change account currency';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS prevent_customer_currency_changes ON public.profiles;
CREATE TRIGGER prevent_customer_currency_changes
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_customer_currency_changes();
REVOKE ALL ON FUNCTION public.prevent_customer_currency_changes() FROM PUBLIC, anon, authenticated;

DROP FUNCTION IF EXISTS public.admin_convert_profile_currency(UUID, TEXT, NUMERIC, DATE);
CREATE OR REPLACE FUNCTION public.admin_convert_profile_currency(
  p_user_id UUID,
  p_expected_currency TEXT,
  p_target_currency TEXT,
  p_conversion_rate NUMERIC,
  p_rate_date DATE
)
RETURNS TABLE (balance NUMERIC, currency TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  old_balance NUMERIC;
  old_currency TEXT;
  new_balance NUMERIC;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'Customer account is required';
  END IF;
  IF p_expected_currency IS NULL OR p_expected_currency !~ '^[A-Z]{3}$' THEN
    RAISE EXCEPTION 'Current account currency is invalid';
  END IF;
  IF p_target_currency IS NULL OR p_target_currency !~ '^[A-Z]{3}$' THEN
    RAISE EXCEPTION 'Target currency must be a three-letter uppercase currency code';
  END IF;
  IF p_conversion_rate IS NULL OR p_conversion_rate <= 0 OR p_conversion_rate > 1000000 THEN
    RAISE EXCEPTION 'A valid positive conversion rate is required';
  END IF;
  IF p_rate_date IS NULL OR p_rate_date > current_date OR p_rate_date < current_date - 14 THEN
    RAISE EXCEPTION 'The reference rate must be dated within the last 14 days';
  END IF;

  SELECT p.balance, upper(coalesce(p.currency, 'USD'))
  INTO old_balance, old_currency
  FROM public.profiles AS p
  WHERE p.id = p_user_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Customer account not found';
  END IF;
  IF old_currency <> p_expected_currency THEN
    RAISE EXCEPTION 'Account currency changed. Refresh the estimate and try again.';
  END IF;
  IF old_currency = p_target_currency THEN
    RAISE EXCEPTION 'The account is already denominated in %', p_target_currency;
  END IF;

  new_balance := round(old_balance * p_conversion_rate, 2);
  UPDATE public.profiles
  SET balance = new_balance, currency = p_target_currency, updated_at = now()
  WHERE id = p_user_id;

  INSERT INTO public.admin_audit_log (actor_id, action, entity_type, entity_id, details)
  VALUES (
    auth.uid(),
    'account_balance_currency_converted',
    'account',
    p_user_id::TEXT,
    jsonb_build_object(
      'old_balance', old_balance,
      'old_currency', old_currency,
      'new_balance', new_balance,
      'new_currency', p_target_currency,
      'conversion_rate', p_conversion_rate,
      'rate_date', p_rate_date,
      'rate_source', 'Frankfurter API / European Central Bank reference rates'
    )
  );

  RETURN QUERY SELECT new_balance, p_target_currency;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_convert_profile_currency(UUID, TEXT, TEXT, NUMERIC, DATE)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_convert_profile_currency(UUID, TEXT, TEXT, NUMERIC, DATE)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_list_push_tokens(p_audience_user_id UUID DEFAULT NULL)
RETURNS TABLE (expo_push_token TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  RETURN QUERY
    SELECT t.expo_push_token
    FROM public.push_tokens AS t
    JOIN public.app_user_settings AS s ON s.user_id = t.user_id
    JOIN public.profiles AS p ON p.id = t.user_id
    WHERE s.push_notifications_enabled = TRUE
      AND (p_audience_user_id IS NULL OR t.user_id = p_audience_user_id)
      AND NOT EXISTS (
        SELECT 1
        FROM public.account_suspensions AS suspended
        WHERE suspended.user_id = t.user_id
      )
    ORDER BY t.expo_push_token;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_list_push_tokens(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_push_tokens(UUID) TO authenticated;

-- TOTP MFA migration for projects that have already applied the earlier schema.
CREATE TABLE IF NOT EXISTS public.user_mfa_requirements (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_mfa_requirements ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.user_mfa_requirements FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.is_mfa_access_allowed()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT auth.uid() IS NOT NULL AND (
    NOT EXISTS (
      SELECT 1 FROM public.user_mfa_requirements WHERE user_id = auth.uid()
    )
    OR COALESCE(auth.jwt() ->> 'aal' = 'aal2', FALSE)
  );
$$;
REVOKE ALL ON FUNCTION public.is_mfa_access_allowed() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_mfa_access_allowed() TO authenticated;

CREATE OR REPLACE FUNCTION public.set_user_mfa_requirement(p_enabled BOOLEAN)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.jwt() ->> 'aal' IS DISTINCT FROM 'aal2' THEN
    RAISE EXCEPTION 'Complete authenticator verification before changing MFA settings';
  END IF;
  IF p_enabled IS NULL THEN
    RAISE EXCEPTION 'MFA setting is required';
  END IF;

  IF p_enabled THEN
    INSERT INTO public.user_mfa_requirements (user_id)
    VALUES (auth.uid())
    ON CONFLICT (user_id) DO NOTHING;
  ELSE
    DELETE FROM public.user_mfa_requirements WHERE user_id = auth.uid();
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.set_user_mfa_requirement(BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_user_mfa_requirement(BOOLEAN) TO authenticated;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT public.is_mfa_access_allowed() AND EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()
  );
$$;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

CREATE OR REPLACE FUNCTION public.is_account_active()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT public.is_mfa_access_allowed() AND auth.uid() IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.account_suspensions WHERE user_id = auth.uid()
  );
$$;
REVOKE ALL ON FUNCTION public.is_account_active() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_account_active() TO authenticated;

DROP POLICY IF EXISTS "Authenticated users can read feature flags" ON public.app_feature_flags;
CREATE POLICY "Authenticated users can read feature flags"
  ON public.app_feature_flags FOR SELECT TO authenticated
  USING (public.is_account_active());

DO $$
BEGIN
  IF to_regclass('public.device_sessions') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can update own device sessions" ON public.device_sessions';
    EXECUTE 'CREATE POLICY "Users can update own device sessions"
      ON public.device_sessions FOR UPDATE TO authenticated
      USING (auth.uid() = user_id AND public.is_account_active())
      WITH CHECK (auth.uid() = user_id AND public.is_account_active())';
  END IF;
END;
$$;

--LIVE CHAT SUPPORT SCHEMA
-- 1. Create chat sessions table (the main thread)
CREATE TABLE IF NOT EXISTS public.support_chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create chat messages table (individual texts in the thread)
CREATE TABLE IF NOT EXISTS public.support_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.support_chat_sessions(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('user', 'admin')),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.support_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_chat_messages ENABLE ROW LEVEL SECURITY;

-- 4. Apply Security Policies for Sessions
CREATE POLICY "Users can view own sessions" ON public.support_chat_sessions 
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own sessions" ON public.support_chat_sessions 
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own sessions" ON public.support_chat_sessions 
  FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can view all sessions" ON public.support_chat_sessions 
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can update all sessions" ON public.support_chat_sessions 
  FOR UPDATE TO authenticated USING (public.is_admin());

-- 5. Apply Security Policies for Messages
CREATE POLICY "Users can view own messages" ON public.support_chat_messages 
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.support_chat_sessions WHERE id = session_id AND user_id = auth.uid())
  );
CREATE POLICY "Users can insert own messages" ON public.support_chat_messages 
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.support_chat_sessions WHERE id = session_id AND user_id = auth.uid()) 
    AND sender_role = 'user'
  );
CREATE POLICY "Admins can view all messages" ON public.support_chat_messages 
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can insert all messages" ON public.support_chat_messages 
  FOR INSERT TO authenticated WITH CHECK (public.is_admin() AND sender_role = 'admin');

-- 6. Add tables to Supabase Realtime publication
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') AND NOT EXISTS (
       SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'support_chat_sessions'
     ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.support_chat_sessions;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') AND NOT EXISTS (
       SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'support_chat_messages'
     ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.support_chat_messages;
  END IF;
END;
$$;