import { apiClient } from "./client";
import type { CallStartResponse } from "@/types/api";

export type StartCallInput = {
  targetPhone: string;
  templateId?: string;
};

export async function startCall(
  input: StartCallInput,
): Promise<CallStartResponse> {
  const { data } = await apiClient.post<CallStartResponse>(
    "/calls/start",
    input,
  );
  return data;
}
