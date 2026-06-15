import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  acceptContactRequest,
  declineContactRequest,
  listContacts,
  listIncomingRequests,
  removeContact,
  requestContact,
} from "@/api/contacts";

export const contactsKeys = {
  list: ["contacts", "list"] as const,
  requests: ["contacts", "requests"] as const,
};

export function useContactsList() {
  return useQuery({ queryKey: contactsKeys.list, queryFn: listContacts });
}

export function useIncomingRequests() {
  return useQuery({
    queryKey: contactsKeys.requests,
    queryFn: listIncomingRequests,
  });
}

// Send a contact request by nickname/email. Both lists may change (an
// auto-accepted reverse request lands straight in the contacts list).
export function useAddContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (handle: string) => requestContact(handle),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: contactsKeys.list });
      void qc.invalidateQueries({ queryKey: contactsKeys.requests });
    },
  });
}

export function useRespondRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, accept }: { requestId: string; accept: boolean }) =>
      accept ? acceptContactRequest(requestId) : declineContactRequest(requestId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: contactsKeys.list });
      void qc.invalidateQueries({ queryKey: contactsKeys.requests });
    },
  });
}

export function useRemoveContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (contactUserId: string) => removeContact(contactUserId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: contactsKeys.list });
    },
  });
}
