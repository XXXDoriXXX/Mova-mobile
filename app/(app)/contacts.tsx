import { useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import Animated, {
  Easing,
  FadeInDown,
  LinearTransition,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { Avatar } from "@/components/Avatar";
import { Banner } from "@/components/Banner";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { IconButton } from "@/components/IconButton";
import { Screen } from "@/components/Screen";
import { Spinner } from "@/components/Spinner";
import { Text } from "@/components/Text";
import { TextField } from "@/components/TextField";
import { useTheme } from "@/theme/ThemeProvider";
import { useAuthStore } from "@/auth/store";
import { extractErrorPayload, extractErrorStatus } from "@/api/client";
import { confirm } from "@/feedback/dialogStore";
import { toast } from "@/feedback/toast";
import { useStartPeerCall } from "@/features/calls";
import {
  useAddContact,
  useContactsList,
  useIncomingRequests,
  useRemoveContact,
  useRespondRequest,
} from "@/features/contacts";
import type { ContactUser, IncomingContactRequest } from "@/types/api";

export default function ContactsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const meIsDeafMute = useAuthStore((s) => s.user?.isDeafMute ?? true);

  const contactsQuery = useContactsList();
  const requestsQuery = useIncomingRequests();
  const addContact = useAddContact();
  const respond = useRespondRequest();
  const removeContact = useRemoveContact();
  const peerCall = useStartPeerCall();

  const [handle, setHandle] = useState("");
  const [addError, setAddError] = useState<string | null>(null);

  const refreshing = contactsQuery.isRefetching || requestsQuery.isRefetching;
  function refresh() {
    void contactsQuery.refetch();
    void requestsQuery.refetch();
  }

  async function onAdd() {
    const value = handle.trim();
    if (value.length === 0) return;
    setAddError(null);
    try {
      const status = await addContact.mutateAsync(value);
      setHandle("");
      toast.success(
        status === "accepted"
          ? t("contacts.addAccepted")
          : t("contacts.addSent"),
      );
    } catch (err) {
      if (extractErrorStatus(err) === 404) {
        setAddError(t("contacts.addNotFound"));
      } else {
        setAddError(
          extractErrorPayload(err)
            ? t("contacts.addFailed")
            : t("common.offline"),
        );
      }
    }
  }

  async function onRemove(contact: ContactUser) {
    const ok = await confirm({
      title: t("contacts.removeConfirmTitle"),
      body: t("contacts.removeConfirmBody", { name: contact.name }),
      confirmLabel: t("contacts.removeConfirmCta"),
      destructive: true,
    });
    if (ok) await removeContact.mutateAsync(contact.id);
  }

  const requests = requestsQuery.data ?? [];
  const contacts = contactsQuery.data ?? [];
  const canCall = (c: ContactUser) => !meIsDeafMute && c.isDeafMute;

  return (
    <Screen padded>
      <ScrollView
        contentContainerStyle={{ gap: theme.spacing.lg, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} />
        }
      >
        <View style={{ gap: 4, paddingTop: 8 }}>
          <Text variant="label" color="textMuted">
            MOVA
          </Text>
          <Text variant="title">{t("contacts.title")}</Text>
        </View>

        {/* Add by nickname or email */}
        <View style={{ gap: theme.spacing.sm }}>
          <TextField
            label={t("contacts.addLabel")}
            placeholder={t("contacts.addPlaceholder")}
            autoCapitalize="none"
            autoCorrect={false}
            value={handle}
            onChangeText={(text) => {
              setHandle(text);
              if (addError) setAddError(null);
            }}
            onSubmitEditing={onAdd}
            returnKeyType="send"
            error={addError ?? undefined}
          />
          <Button
            label={t("contacts.addCta")}
            variant="secondary"
            size="md"
            loading={addContact.isPending}
            disabled={handle.trim().length === 0}
            onPress={onAdd}
            leading={
              <Ionicons name="person-add" size={16} color={theme.colors.text} />
            }
          />
        </View>

        {peerCall.error ? (
          <Banner tone="danger" message={peerCallErrorMessage(t, peerCall.error)} />
        ) : null}

        {/* Incoming requests */}
        {requests.length > 0 ? (
          <View style={{ gap: theme.spacing.sm }}>
            <Text variant="subtitle">{t("contacts.requestsTitle")}</Text>
            {requests.map((req, i) => (
              <Animated.View
                key={req.requestId}
                entering={FadeInDown.duration(260).easing(Easing.out(Easing.cubic)).delay(i * 45)}
                layout={LinearTransition.duration(240).easing(Easing.out(Easing.cubic))}
              >
                <RequestRow
                  request={req}
                  busy={respond.isPending}
                  onAccept={() =>
                    respond.mutate({ requestId: req.requestId, accept: true })
                  }
                  onDecline={() =>
                    respond.mutate({ requestId: req.requestId, accept: false })
                  }
                />
              </Animated.View>
            ))}
          </View>
        ) : null}

        {/* Contacts list */}
        <View style={{ gap: theme.spacing.sm }}>
          <Text variant="subtitle">{t("contacts.listTitle")}</Text>
          {contactsQuery.isLoading ? (
            <Spinner size="small" />
          ) : contacts.length === 0 ? (
            <EmptyState
              icon="people-outline"
              title={t("contacts.emptyTitle")}
              body={t("contacts.emptyBody")}
            />
          ) : (
            contacts.map((contact, i) => (
              <Animated.View
                key={contact.id}
                entering={FadeInDown.duration(260).easing(Easing.out(Easing.cubic)).delay(i * 45)}
                layout={LinearTransition.duration(240).easing(Easing.out(Easing.cubic))}
              >
                <ContactRow
                  contact={contact}
                  callable={canCall(contact)}
                  calling={peerCall.submitting}
                  onCall={() =>
                    void peerCall.call({
                      calleeUserId: contact.id,
                      calleeName: contact.name,
                    })
                  }
                  onRemove={() => void onRemove(contact)}
                />
              </Animated.View>
            ))
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

function RequestRow({
  request,
  busy,
  onAccept,
  onDecline,
}: {
  request: IncomingContactRequest;
  busy: boolean;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <Card>
      <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.md }}>
        <Avatar name={request.from.name} />
        <View style={{ flex: 1 }}>
          <Text variant="body" weight="bold">
            {request.from.name}
          </Text>
          {request.from.username ? (
            <Text variant="caption" color="textMuted">
              @{request.from.username}
            </Text>
          ) : null}
        </View>
        <IconButton tone="muted" onPress={onDecline} accessibilityLabel={t("contacts.decline")} disabled={busy}>
          <Ionicons name="close" size={18} color={theme.colors.text} />
        </IconButton>
        <IconButton tone="accent" onPress={onAccept} accessibilityLabel={t("contacts.accept")} disabled={busy}>
          <Ionicons name="checkmark" size={18} color={theme.colors.accentText} />
        </IconButton>
      </View>
    </Card>
  );
}

function ContactRow({
  contact,
  callable,
  calling,
  onCall,
  onRemove,
}: {
  contact: ContactUser;
  callable: boolean;
  calling: boolean;
  onCall: () => void;
  onRemove: () => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <Card>
      <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.md }}>
        <Avatar name={contact.name} />
        <View style={{ flex: 1 }}>
          <Text variant="body" weight="bold">
            {contact.name}
          </Text>
          {contact.username ? (
            <Text variant="caption" color="textMuted">
              @{contact.username}
            </Text>
          ) : null}
        </View>
        {callable ? (
          <IconButton
            tone="accent"
            onPress={onCall}
            disabled={calling}
            accessibilityLabel={t("contacts.call")}
          >
            <Ionicons name="call" size={18} color={theme.colors.accentText} />
          </IconButton>
        ) : null}
        <IconButton
          tone="muted"
          onPress={onRemove}
          accessibilityLabel={t("contacts.remove")}
        >
          <Ionicons name="trash-outline" size={18} color={theme.colors.text} />
        </IconButton>
      </View>
    </Card>
  );
}

function peerCallErrorMessage(
  t: (key: string) => string,
  code: string,
): string {
  switch (code) {
    case "MEDIA_UNAVAILABLE":
      return t("contacts.callErrMedia");
    case "NOT_A_CONTACT":
      return t("contacts.callErrNotContact");
    case "CALLEE_OFFLINE":
      return t("contacts.callErrOffline");
    case "CALLEE_BUSY":
      return t("contacts.callErrBusy");
    case "CALLEE_UNAVAILABLE":
      return t("contacts.callErrUnavailable");
    case "CALL_IN_PROGRESS":
      return t("contacts.callErrInProgress");
    default:
      return t("contacts.callErrGeneric");
  }
}
