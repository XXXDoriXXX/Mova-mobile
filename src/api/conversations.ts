import { apiClient } from "./client";
import type {
  Conversation,
  ConversationStatus,
  CursorPage,
  Message,
} from "@/types/api";

export type ListConversationsParams = {
  cursor?: string;
  limit?: number;
  status?: ConversationStatus;
  from?: string;
  to?: string;
};

export async function listConversations(
  params: ListConversationsParams = {},
): Promise<CursorPage<Conversation>> {
  const { data } = await apiClient.get<CursorPage<Conversation>>(
    "/conversations",
    { params },
  );
  return data;
}

export async function getConversation(id: string): Promise<Conversation> {
  const { data } = await apiClient.get<Conversation>(`/conversations/${id}`);
  return data;
}

export async function getConversationMessages(
  id: string,
  params: { cursor?: string; limit?: number } = {},
): Promise<CursorPage<Message>> {
  const { data } = await apiClient.get<CursorPage<Message>>(
    `/conversations/${id}/messages`,
    { params },
  );
  return data;
}

export async function deleteConversation(id: string): Promise<void> {
  await apiClient.delete(`/conversations/${id}`);
}
