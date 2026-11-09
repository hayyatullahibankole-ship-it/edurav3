import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { projectAuthActivity } from './response.ts';

Deno.test('activity response exposes only linked user id and relevant timestamps', () => {
  const projected = projectAuthActivity({
    id: 'auth-user-1',
    created_at: '2026-11-01T10:00:00.000Z',
    last_sign_in_at: '2026-11-08T10:00:00.000Z',
    email: 'private@example.test',
  });

  assertEquals(projected, {
    auth_user_id: 'auth-user-1',
    auth_created_at: '2026-11-01T10:00:00.000Z',
    last_login_at: '2026-11-08T10:00:00.000Z',
  });
});

Deno.test('activity response preserves null timestamps', () => {
  assertEquals(projectAuthActivity({ id: 'auth-user-2' }), {
    auth_user_id: 'auth-user-2',
    auth_created_at: null,
    last_login_at: null,
  });
});