CREATE TABLE IF NOT EXISTS public.notification_states (
  notification_id UUID NOT NULL REFERENCES public.admin_notifications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  PRIMARY KEY (notification_id, user_id)
);

ALTER TABLE public.notification_states ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_states TO authenticated;

DROP POLICY IF EXISTS "Users manage own notification states" ON public.notification_states;
CREATE POLICY "Users manage own notification states"
  ON public.notification_states FOR ALL TO authenticated
  USING (auth.uid() = user_id AND public.is_account_active())
  WITH CHECK (auth.uid() = user_id AND public.is_account_active());

DROP POLICY IF EXISTS "Admins can read notification states" ON public.notification_states;
CREATE POLICY "Admins can read notification states"
  ON public.notification_states FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can read notifications" ON public.admin_notifications;
CREATE POLICY "Admins can read notifications"
  ON public.admin_notifications FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.create_event_notification(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.admin_notifications (audience_user_id, title, message)
  VALUES (p_user_id, p_title, p_message)
  RETURNING id INTO notification_id;
  RETURN notification_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_event_notification(UUID, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_event_notification(UUID, TEXT, TEXT)
  TO service_role;

CREATE OR REPLACE FUNCTION public.notify_user_of_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  transaction_currency TEXT;
BEGIN
  IF NEW.amount <= 0 THEN
    RETURN NEW;
  END IF;

  SELECT currency INTO transaction_currency
  FROM public.profiles
  WHERE id = NEW.user_id;

  INSERT INTO public.admin_notifications (audience_user_id, title, message)
  VALUES (
    NEW.user_id,
    CASE WHEN NEW.type = 'CREDIT' THEN 'Money received' ELSE 'Transfer recorded' END,
    format(
      '%s of %s %s was recorded for %s. Open History to review the details.',
      CASE WHEN NEW.type = 'CREDIT' THEN 'A deposit' ELSE 'A transfer' END,
      COALESCE(transaction_currency, 'USD'),
      to_char(NEW.amount, 'FM999,999,999,990.00'),
      COALESCE(NEW.receiver_name, NEW.counterparty, 'your account')
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_user_of_transaction ON public.transactions;
CREATE TRIGGER notify_user_of_transaction
  AFTER INSERT ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_user_of_transaction();

DROP FUNCTION IF EXISTS public.admin_add_funds(UUID, NUMERIC);
DROP FUNCTION IF EXISTS public.admin_add_funds(UUID, NUMERIC, TEXT, TEXT);
CREATE OR REPLACE FUNCTION public.admin_add_funds(
  p_user_id UUID,
  p_amount NUMERIC,
  p_sender_name TEXT DEFAULT 'Northstar Clearing Bank',
  p_sender_account TEXT DEFAULT 'NSCB-104829'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF p_user_id IS NULL OR p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'A valid account and positive amount are required';
  END IF;
  IF p_sender_name IS NULL OR btrim(p_sender_name) = ''
     OR p_sender_account IS NULL OR btrim(p_sender_account) = '' THEN
    RAISE EXCEPTION 'A deposit source is required';
  END IF;

  UPDATE public.profiles
  SET balance = COALESCE(balance, 0) + p_amount
  WHERE id = p_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Account not found';
  END IF;

  INSERT INTO public.transactions (
    user_id, type, amount, counterparty, receiver_name, account_number,
    bank_name, category, note, reference, review_status
  )
  VALUES (
    p_user_id, 'CREDIT', p_amount, p_sender_name, p_sender_name,
    p_sender_account, p_sender_name, 'Deposit',
    'Deposit from ' || p_sender_name,
    'WR-DEP-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 16)),
    'normal'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_add_funds(UUID, NUMERIC, TEXT, TEXT)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_add_funds(UUID, NUMERIC, TEXT, TEXT)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.notify_user_of_admin_chat_reply()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  target_user UUID;
BEGIN
  IF NEW.sender_role <> 'admin' THEN
    RETURN NEW;
  END IF;

  SELECT user_id INTO target_user
  FROM public.support_chat_sessions
  WHERE id = NEW.session_id;

  IF target_user IS NOT NULL THEN
    PERFORM public.create_event_notification(
      target_user,
      'Support replied',
      left(NEW.message, 500)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_user_of_admin_chat_reply ON public.support_chat_messages;
CREATE TRIGGER notify_user_of_admin_chat_reply
  AFTER INSERT ON public.support_chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_user_of_admin_chat_reply();
