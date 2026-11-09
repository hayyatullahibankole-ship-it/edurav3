export const projectAuthActivity = (user: {
  id: string;
  created_at?: string | null;
  last_sign_in_at?: string | null;
  [key: string]: unknown;
}) => ({
  auth_user_id: user.id,
  auth_created_at: user.created_at || null,
  last_login_at: user.last_sign_in_at || null,
});