/*
# Make follow_ups.lead_id nullable

1. Changes
- ALTER TABLE follow_ups: change lead_id from NOT NULL to NULLABLE.
- This allows standalone follow-ups (not linked to a lead) to be created
  from the Calendar page, where the user provides a client_name instead.

2. Security
- No RLS policy changes. Existing policies remain intact.

3. Notes
- This is a non-destructive change: it only relaxes a constraint.
- Existing rows with non-null lead_id are unaffected.
- The follow_ups table was created with lead_id as NOT NULL, but the
  Calendar module's follow-up creation form allows optional lead linking.
*/

ALTER TABLE follow_ups ALTER COLUMN lead_id DROP NOT NULL;
