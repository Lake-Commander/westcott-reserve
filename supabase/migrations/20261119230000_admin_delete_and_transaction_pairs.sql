ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
  ADD COLUMN IF NOT EXISTS transfer_pair_key TEXT;

UPDATE public.transactions
SET transfer_pair_key = COALESCE(
  NULLIF(btrim(reference), ''),
  NULLIF(btrim(idempotency_key), ''),
  'single-' || id::TEXT
)
WHERE transfer_pair_key IS NULL;

CREATE INDEX IF NOT EXISTS transactions_transfer_pair_key_idx
  ON public.transactions(transfer_pair_key);

CREATE OR REPLACE FUNCTION public.set_transaction_transfer_pair_key()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.transfer_pair_key := COALESCE(
    NULLIF(btrim(NEW.transfer_pair_key), ''),
    NULLIF(btrim(NEW.reference), ''),
    NULLIF(btrim(NEW.idempotency_key), ''),
    'single-' || NEW.id::TEXT
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_transaction_transfer_pair_key ON public.transactions;
CREATE TRIGGER set_transaction_transfer_pair_key
  BEFORE INSERT OR UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_transaction_transfer_pair_key();

CREATE OR REPLACE FUNCTION public.admin_update_transaction_receipt(
  p_transaction_id UUID,
  p_amount NUMERIC,
  p_timestamp TIMESTAMPTZ,
  p_counterparty TEXT,
  p_receiver_name TEXT,
  p_account_number TEXT,
  p_routing_number TEXT,
  p_bank_name TEXT,
  p_category TEXT,
  p_note TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  pair_key TEXT;
  original_reference TEXT;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  IF p_transaction_id IS NULL OR p_amount IS NULL OR p_amount < 0 OR p_timestamp IS NULL THEN
    RAISE EXCEPTION 'Transaction, amount, and date/time are required';
  END IF;

  SELECT COALESCE(transfer_pair_key, NULLIF(btrim(reference), ''), NULLIF(btrim(idempotency_key), ''), 'single-' || id::TEXT)
    INTO pair_key
  FROM public.transactions
  WHERE id = p_transaction_id;

  IF pair_key IS NULL THEN
    RAISE EXCEPTION 'Transaction not found';
  END IF;

  SELECT reference INTO original_reference
  FROM public.transactions
  WHERE id = p_transaction_id;

  UPDATE public.transactions AS t
  SET amount = p_amount,
      timestamp = p_timestamp,
      routing_number = NULLIF(btrim(p_routing_number), ''),
      bank_name = NULLIF(btrim(p_bank_name), ''),
      category = NULLIF(btrim(p_category), ''),
      note = NULLIF(btrim(p_note), '')
  WHERE COALESCE(t.transfer_pair_key, NULLIF(btrim(t.reference), ''), NULLIF(btrim(t.idempotency_key), ''), 'single-' || t.id::TEXT) = pair_key;

  UPDATE public.transactions
  SET counterparty = NULLIF(btrim(p_counterparty), ''),
      receiver_name = NULLIF(btrim(p_receiver_name), ''),
      account_number = NULLIF(btrim(p_account_number), '')
  WHERE id = p_transaction_id;

  INSERT INTO public.admin_audit_log (actor_id, action, entity_type, entity_id, details)
  VALUES (
    auth.uid(), 'transaction_receipt_updated', 'transaction', p_transaction_id::TEXT,
    jsonb_build_object(
      'pair_key', pair_key,
      'reference', original_reference,
      'amount', p_amount,
      'timestamp', p_timestamp,
      'counterparty', p_counterparty,
      'receiver_name', p_receiver_name,
      'account_number', p_account_number,
      'routing_number', p_routing_number,
      'bank_name', p_bank_name,
      'category', p_category,
      'note', p_note
    )
  );
END;
$$;
REVOKE ALL ON FUNCTION public.admin_update_transaction_receipt(UUID, NUMERIC, TIMESTAMPTZ, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_transaction_receipt(UUID, NUMERIC, TIMESTAMPTZ, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_delete_transaction(p_transaction_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  pair_key TEXT;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Admin access required'; END IF;
  SELECT COALESCE(transfer_pair_key, NULLIF(btrim(reference), ''), NULLIF(btrim(idempotency_key), ''), 'single-' || id::TEXT)
  INTO pair_key FROM public.transactions WHERE id = p_transaction_id;
  IF pair_key IS NULL THEN RAISE EXCEPTION 'Transaction not found'; END IF;
  DELETE FROM public.transactions AS t
  WHERE COALESCE(t.transfer_pair_key, NULLIF(btrim(t.reference), ''), NULLIF(btrim(t.idempotency_key), ''), 'single-' || t.id::TEXT) = pair_key;
  INSERT INTO public.admin_audit_log(actor_id, action, entity_type, entity_id, details)
  VALUES(auth.uid(), 'transaction_deleted', 'transaction', p_transaction_id::TEXT, jsonb_build_object('pair_key', pair_key));
END;
$$;
REVOKE ALL ON FUNCTION public.admin_delete_transaction(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_delete_transaction(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_delete_account(p_user_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Admin access required'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id) THEN RAISE EXCEPTION 'Account not found'; END IF;
  DELETE FROM auth.users WHERE id = p_user_id;
  INSERT INTO public.admin_audit_log(actor_id, action, entity_type, entity_id)
  VALUES(auth.uid(), 'account_deleted', 'account', p_user_id::TEXT);
END;
$$;
REVOKE ALL ON FUNCTION public.admin_delete_account(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_delete_account(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_delete_chat(p_session_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Admin access required'; END IF;
  DELETE FROM public.support_chat_sessions WHERE id = p_session_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Chat session not found'; END IF;
  INSERT INTO public.admin_audit_log(actor_id, action, entity_type, entity_id)
  VALUES(auth.uid(), 'chat_deleted', 'support_chat', p_session_id::TEXT);
END;
$$;
REVOKE ALL ON FUNCTION public.admin_delete_chat(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_delete_chat(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_delete_customer_care(p_message_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Admin access required'; END IF;
  DELETE FROM public.customer_care_messages WHERE id = p_message_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Customer care message not found'; END IF;
  INSERT INTO public.admin_audit_log(actor_id, action, entity_type, entity_id)
  VALUES(auth.uid(), 'customer_care_deleted', 'customer_care', p_message_id::TEXT);
END;
$$;
REVOKE ALL ON FUNCTION public.admin_delete_customer_care(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_delete_customer_care(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_delete_notification(p_notification_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Admin access required'; END IF;
  DELETE FROM public.admin_notifications WHERE id = p_notification_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Notification not found'; END IF;
  INSERT INTO public.admin_audit_log(actor_id, action, entity_type, entity_id)
  VALUES(auth.uid(), 'notification_deleted', 'notification', p_notification_id::TEXT);
END;
$$;
REVOKE ALL ON FUNCTION public.admin_delete_notification(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_delete_notification(UUID) TO authenticated;
