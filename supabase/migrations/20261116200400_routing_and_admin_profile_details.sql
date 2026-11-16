ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS routing_number TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS routing_number TEXT;

DROP FUNCTION IF EXISTS public.admin_list_profiles();
CREATE OR REPLACE FUNCTION public.admin_list_profiles()
RETURNS TABLE (
  id UUID,
  email TEXT,
  name TEXT,
  username TEXT,
  phone TEXT,
  account_number TEXT,
  avatar_url TEXT,
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
    SELECT p.id, p.email, p.name, p.username, p.phone, p.account_number, p.avatar_url,
      p.balance, p.currency, p.created_at,
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
