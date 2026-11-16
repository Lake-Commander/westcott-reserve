DO $$
DECLARE
  profile_row RECORD;
  generated_account_number TEXT;
BEGIN
  FOR profile_row IN
    SELECT id
    FROM public.profiles
    WHERE account_number IS NULL
       OR account_number !~ '^[0-9]{10}$'
  LOOP
    LOOP
      generated_account_number :=
        '80' || floor(random() * 90000000 + 10000000)::BIGINT::TEXT;

      EXIT WHEN NOT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE account_number = generated_account_number
      );
    END LOOP;

    UPDATE public.profiles
    SET account_number = generated_account_number,
        updated_at = timezone('utc'::text, now())
    WHERE id = profile_row.id
      AND (
        account_number IS NULL
        OR account_number !~ '^[0-9]{10}$'
      );
  END LOOP;
END;
$$;
