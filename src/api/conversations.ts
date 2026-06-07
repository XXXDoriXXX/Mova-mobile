import { apiClient } from "./client";
import type {
  Conversation,
  ConversationStatus,
  CursorPage,
  Message,
  SearchResultPage,
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

export type SearchConversationsParams = {
  q: string;
  from?: string;
  to?: string;
  templateId?: string;
  cursor?: string;
  limit?: number;
};

export async function searchConversations(
  params: SearchConversationsParams,
): Promise<SearchResultPage> {
  const { data } = await apiClient.get<SearchResultPage>(
    "/conversations/search",
    { params },
  );
  return data;
}
