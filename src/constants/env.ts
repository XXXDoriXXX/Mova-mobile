import Constants from "expo-constants";

type AppExtra = {
  apiUrl: string;
  wsUrl: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as Partial<AppExtra>;

export const API_BASE_URL: string = extra.apiUrl ?? "http://localhost:3000/v1";
export const WS_URL: string = extra.wsUrl ?? "ws://localhost:3001";
