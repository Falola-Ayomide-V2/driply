/*
# Harden database functions

## Changes

1. Revoke EXECUTE on handle_new_user() from anon and authenticated roles.
   This function is only meant to be called by the auth.users trigger, not via the API.

2. Recreate set_updated_at() with an explicit search_path to prevent search path injection.
   Triggers depending on it are dropped and recreated.
*/

REVOKE EXECUTE ON FUNCTION handle_new_user() FROM anon, authenticated;

DROP TRIGGER IF EXISTS profiles_set_updated_at ON profiles;
DROP TRIGGER IF EXISTS user_preferences_set_updated_at ON user_preferences;

DROP FUNCTION IF EXISTS set_updated_at();

CREATE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER user_preferences_set_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();
