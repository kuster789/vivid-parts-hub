I will implement a comprehensive security hardening migration to fix all identified vulnerabilities and warnings.

### Security Hardening Plan

1. **Realtime & Broadcast Security**
   - Restrict Realtime access to authenticated users only for sensitive channels.
   - Implement policies to ensure users can only subscribe to their own notification channels.
   - Disable public broadcast for page views.

2. **Privilege Escalation Prevention**
   - Update `user_roles` policies to ensure only `admin_master` can promote or demote other administrative roles.
   - Prevent `admin` from promoting themselves to `admin_master`.
   - Add a trigger to enforce these rules at the database level.

3. **Security Definer Functions**
   - Revoke `EXECUTE` on all `SECURITY DEFINER` functions from `public` and `anon` roles.
   - Explicitly grant `EXECUTE` only to `authenticated` or specific administrative roles as needed.
   - Ensure all `SECURITY DEFINER` functions have a secure `search_path` set (most already do, but I will verify).

4. **Storage Security**
   - Update storage policies for `product-images` and `manuals` buckets to prevent public listing while maintaining public read access for individual files.
   - Restrict upload/update/delete permissions to authorized administrative roles.

5. **RLS Policy Hardening**
   - Identify and replace any `USING (true)` or `WITH CHECK (true)` policies with specific, restrictive conditions.
   - For public tables like `products`, keep `SELECT` open but ensure `INSERT/UPDATE/DELETE` are strictly controlled.
   - Secure sensitive tables like `leads`, `page_views`, and `notifications`.

6. **Validation**
   - Run the Supabase linter again after the migration to ensure all errors and warnings are resolved.

### Technical Details

- **Affected Tables**: `user_roles`, `notifications`, `leads`, `page_views`, `reviews`, `manuals`, `role_permissions`.
- **Affected Functions**: All `SECURITY DEFINER` functions in the `public` schema.
- **Affected Buckets**: `product-images`, `manuals`.
- **Approach**: A single, versioned migration file using the `supabase--migration` tool.
