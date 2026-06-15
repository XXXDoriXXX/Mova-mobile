import { apiClient } from "./client";
import type {
  ContactRequestStatus,
  ContactUser,
  IncomingContactRequest,
} from "@/types/api";

// Resolve a nickname or email to a verified user (null if none). The handle is
// what the hearing user types into the "add contact" field.
export async function searchContact(query: string): Promise<ContactUser | null> {
  const { data } = await apiClient.get<{ user: ContactUser | null }>(
    "/contacts/search",
    { params: { q: query } },
  );
  return data.user;
}

// Send a contact request by nickname or email. Returns the resulting status —
// "accepted" already if the other side had requested us first.
export async function requestContact(
  handle: string,
): Promise<ContactRequestStatus> {
  const { data } = await apiClient.post<{ status: ContactRequestStatus }>(
    "/contacts/requests",
    { handle },
  );
  return data.status;
}

export async function listIncomingRequests(): Promise<IncomingContactRequest[]> {
  const { data } = await apiClient.get<IncomingContactRequest[]>(
    "/contacts/requests",
  );
  return data;
}

export async function acceptContactRequest(requestId: string): Promise<void> {
  await apiClient.post(`/contacts/requests/${requestId}/accept`);
}

export async function declineContactRequest(requestId: string): Promise<void> {
  await apiClient.post(`/contacts/requests/${requestId}/decline`);
}

export async function listContacts(): Promise<ContactUser[]> {
  const { data } = await apiClient.get<ContactUser[]>("/contacts");
  return data;
}

export async function removeContact(contactUserId: string): Promise<void> {
  await apiClient.delete(`/contacts/${contactUserId}`);
}
