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
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  IF p_transaction_id IS NULL OR p_amount IS NULL OR p_amount < 0 OR p_timestamp IS NULL THEN
    RAISE EXCEPTION 'Transaction, amount, and date/time are required';
  END IF;

  UPDATE public.transactions
  SET amount = p_amount,
      timestamp = p_timestamp,
      counterparty = NULLIF(btrim(p_counterparty), ''),
      receiver_name = NULLIF(btrim(p_receiver_name), ''),
      account_number = NULLIF(btrim(p_account_number), ''),
      routing_number = NULLIF(btrim(p_routing_number), ''),
      bank_name = NULLIF(btrim(p_bank_name), ''),
      category = NULLIF(btrim(p_category), ''),
      note = NULLIF(btrim(p_note), '')
  WHERE id = p_transaction_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transaction not found';
  END IF;

  INSERT INTO public.admin_audit_log (actor_id, action, entity_type, entity_id, details)
  VALUES (
    auth.uid(), 'transaction_receipt_updated', 'transaction', p_transaction_id::TEXT,
    jsonb_build_object('amount', p_amount, 'timestamp', p_timestamp)
  );
END;
$$;
REVOKE ALL ON FUNCTION public.admin_update_transaction_receipt(UUID, NUMERIC, TIMESTAMPTZ, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_transaction_receipt(UUID, NUMERIC, TIMESTAMPTZ, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
