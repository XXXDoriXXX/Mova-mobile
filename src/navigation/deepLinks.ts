
const SCHEME = "mova://";

export const DeepLinks = {
  welcome: () => `${SCHEME}welcome`,
  home: () => `${SCHEME}home`,
  history: () => `${SCHEME}history`,
  settings: () => `${SCHEME}settings`,
  billing: () => `${SCHEME}billing`,
  templates: () => `${SCHEME}templates`,
  styles: () => `${SCHEME}styles`,
  styleProfile: () => `${SCHEME}settings/style-profile`,
  conversation: (id: string) => `${SCHEME}conversation/${encodeURIComponent(id)}`,
  callPre: () => `${SCHEME}call/pre`,
  callLive: (params: { conversationId: string; initialStyleId?: string }) => {
    const qs = new URLSearchParams({ conversationId: params.conversationId });
    if (params.initialStyleId) qs.set("initialStyleId", params.initialStyleId);
    return `${SCHEME}call/live?${qs.toString()}`;
  },
} as const;

export type DeepLinkKey = keyof typeof DeepLinks;
