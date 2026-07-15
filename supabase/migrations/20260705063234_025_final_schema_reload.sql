-- Final schema cache reload for service_catalog
-- Supabase PostgREST schema cache requires notification

-- Add trigger to ensure schema cache is reloaded
CREATE OR REPLACE FUNCTION reload_pgrst_schema() RETURNS void AS $$
BEGIN
  NOTIFY pgrst, 'reload schema';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Call the function
SELECT reload_pgrst_schema();