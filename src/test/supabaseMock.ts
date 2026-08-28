import { vi } from "vitest";

/**
 * Minimal chainable Supabase client stub used by the smoke tests.
 * Table results are provided per table name; every builder method returns `this`
 * and the chain resolves to the configured result when awaited.
 */
export type TableResult = { data?: any; error?: any };

export interface SupabaseMockConfig {
  tables?: Record<string, TableResult>;
  rpc?: Record<string, TableResult>;
  functions?: Record<string, TableResult>;
  user?: any;
}

export function createSupabaseMock(config: SupabaseMockConfig = {}) {
  const tables = config.tables ?? {};
  const rpcs = config.rpc ?? {};
  const functions = config.functions ?? {};

  const makeBuilder = (table: string) => {
    const result: TableResult = tables[table] ?? { data: [], error: null };
    const builder: any = {};
    const chain = [
      "select",
      "insert",
      "update",
      "upsert",
      "delete",
      "eq",
      "neq",
      "in",
      "is",
      "gt",
      "gte",
      "lt",
      "lte",
      "order",
      "limit",
      "range",
      "match",
      "filter",
      "or",
    ];
    chain.forEach((m) => {
      builder[m] = vi.fn(() => builder);
    });
    builder.single = vi.fn(async () => ({ data: result.data, error: result.error ?? null }));
    builder.maybeSingle = vi.fn(async () => ({ data: result.data, error: result.error ?? null }));
    builder.then = (resolve: any, reject: any) =>
      Promise.resolve({ data: result.data ?? [], error: result.error ?? null }).then(resolve, reject);
    return builder;
  };

  const auth = {
    signInWithPassword: vi.fn(async () => ({
      data: { user: config.user ?? { id: "user-1", email: "test@edura.com.ng" }, session: { access_token: "t" } },
      error: null,
    })),
    signInWithOtp: vi.fn(async () => ({ data: {}, error: null })),
    verifyOtp: vi.fn(async () => ({
      data: { user: config.user ?? { id: "user-1", email: "test@edura.com.ng" }, session: { access_token: "t" } },
      error: null,
    })),
    resend: vi.fn(async () => ({ data: {}, error: null })),
    updateUser: vi.fn(async () => ({ data: { user: config.user ?? { id: "user-1" } }, error: null })),
    signOut: vi.fn(async () => ({ error: null })),
    getUser: vi.fn(async () => ({ data: { user: config.user ?? { id: "user-1" } }, error: null })),
    getSession: vi.fn(async () => ({ data: { session: { access_token: "t", user: config.user ?? { id: "user-1" } } }, error: null })),
    onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    mfa: {
      listFactors: vi.fn(async () => ({ data: { totp: [] }, error: null })),
      getAuthenticatorAssuranceLevel: vi.fn(async () => ({
        data: { currentLevel: "aal1", nextLevel: "aal1" },
        error: null,
      })),
    },
  };

  return {
    from: vi.fn((table: string) => makeBuilder(table)),
    rpc: vi.fn(async (name: string) => rpcs[name] ?? { data: [], error: null }),
    functions: {
      invoke: vi.fn(async (name: string) => functions[name] ?? { data: { success: true }, error: null }),
    },
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() })),
    removeChannel: vi.fn(),
    storage: { from: vi.fn(() => ({ upload: vi.fn(), getPublicUrl: vi.fn(() => ({ data: { publicUrl: "" } })) })) },
    auth,
  };
}
