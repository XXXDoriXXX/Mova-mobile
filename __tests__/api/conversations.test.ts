/* eslint-disable @typescript-eslint/no-require-imports */
import MockAdapter from "axios-mock-adapter";

describe("conversations API", () => {
  let mock: MockAdapter;

  beforeEach(() => {
    jest.resetModules();
    const { useAuthStore } = require("@/auth/store");
    useAuthStore.setState({
      status: "authed",
      user: null,
      accessToken: "at",
      refreshToken: "rt",
      refreshExpiresAt: new Date(Date.now() + 60_000).toISOString(),
    });
    const { apiClient } = require("@/api/client");
    mock = new MockAdapter(apiClient);
  });

  afterEach(() => mock?.restore());

  it("listConversations forwards cursor/limit/status/from/to as query params", async () => {
    let captured: Record<string, string> | null = null;
    mock.onGet("/conversations").reply((config) => {
      captured = config.params as Record<string, string>;
      return [200, { items: [], nextCursor: null }];
    });
    const { listConversations } = require("@/api/conversations");
    await listConversations({
      cursor: "2026-05-20T12:00:00Z",
      limit: 20,
      status: "ended",
      from: "2026-05-01T00:00:00Z",
      to: "2026-05-31T00:00:00Z",
    });
    expect(captured).toEqual({
      cursor: "2026-05-20T12:00:00Z",
      limit: 20,
      status: "ended",
      from: "2026-05-01T00:00:00Z",
      to: "2026-05-31T00:00:00Z",
    });
  });

  it("listConversations defaults to no params", async () => {
    let captured: unknown = "untouched";
    mock.onGet("/conversations").reply((config) => {
      captured = config.params;
      return [200, { items: [], nextCursor: null }];
    });
    const { listConversations } = require("@/api/conversations");
    await listConversations();
    expect(captured).toEqual({});
  });

  it("deleteConversation issues DELETE to the id-scoped path", async () => {
    let path: string | null = null;
    mock.onDelete(/\/conversations\/.+/).reply((config) => {
      path = config.url ?? null;
      return [204];
    });
    const { deleteConversation } = require("@/api/conversations");
    await deleteConversation("abc-123");
    expect(path).toBe("/conversations/abc-123");
  });

  it("getConversationMessages forwards cursor + limit", async () => {
    let captured: Record<string, unknown> | null = null;
    mock.onGet(/\/conversations\/.+\/messages/).reply((config) => {
      captured = config.params as Record<string, unknown>;
      return [200, { items: [], nextCursor: null }];
    });
    const { getConversationMessages } = require("@/api/conversations");
    await getConversationMessages("abc-123", { cursor: "iso", limit: 50 });
    expect(captured).toEqual({ cursor: "iso", limit: 50 });
  });
});
