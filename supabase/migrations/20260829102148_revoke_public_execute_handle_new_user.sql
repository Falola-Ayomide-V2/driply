/*
# Revoke public execute on handle_new_user

The initial REVOKE from anon/authenticated didn't remove access because
functions default to GRANT EXECUTE TO PUBLIC. Revoke from PUBLIC explicitly
to prevent any API access to this trigger-only function.
*/

REVOKE EXECUTE ON FUNCTION handle_new_user() FROM PUBLIC;
