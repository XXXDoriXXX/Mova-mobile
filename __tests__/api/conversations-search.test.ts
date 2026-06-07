/* eslint-disable @typescript-eslint/no-require-imports */
import MockAdapter from "axios-mock-adapter";

describe("searchConversations", () => {
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

  it("forwards q, from, to, templateId, cursor, limit as query params", async () => {
    let captured: Record<string, unknown> | null = null;
    mock.onGet("/conversations/search").reply((config) => {
      captured = config.params as Record<string, unknown>;
      return [200, { items: [], nextCursor: null }];
    });
    const { searchConversations } = require("@/api/conversations");

    await searchConversations({
      q: "лікар",
      from: "2026-05-01T00:00:00Z",
      to: "2026-05-31T23:59:59Z",
      templateId: "00000000-0000-4000-8000-000000000010",
      cursor: "opaque",
      limit: 20,
    });

    expect(captured).toEqual({
      q: "лікар",
      from: "2026-05-01T00:00:00Z",
      to: "2026-05-31T23:59:59Z",
      templateId: "00000000-0000-4000-8000-000000000010",
      cursor: "opaque",
      limit: 20,
    });
  });

  it("returns the parsed page from the response body", async () => {
    mock.onGet("/conversations/search").reply(200, {
      items: [
        {
          conversationId: "c-1",
          status: "ended",
          startedAt: "2026-05-01T10:00:00Z",
          endedAt: "2026-05-01T10:05:00Z",
          durationSeconds: 300,
          templateId: null,
          templateName: null,
          matches: [
            {
              messageId: "m-1",
              role: "interlocutor",
              snippet: "<mark>день</mark>",
              createdAt: "2026-05-01T10:00:10Z",
            },
          ],
        },
      ],
      nextCursor: "next",
    });

    const { searchConversations } = require("@/api/conversations");
    const page = await searchConversations({ q: "день" });

    expect(page.nextCursor).toBe("next");
    expect(page.items).toHaveLength(1);
    expect(page.items[0].matches[0].snippet).toBe("<mark>день</mark>");
  });
});
