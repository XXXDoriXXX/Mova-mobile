import { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, View } from "react-native";
import * as Contacts from "expo-contacts";
import parsePhoneNumberFromString from "libphonenumber-js";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { Banner } from "@/components/Banner";
import { Modal } from "@/components/Modal";
import { Spinner } from "@/components/Spinner";
import { Text } from "@/components/Text";
import { TextField } from "@/components/TextField";
import { useTheme } from "@/theme/ThemeProvider";

type Props = {
  visible: boolean;
  onClose: () => void;
  onPick: (phoneE164: string) => void;
};

type Entry = {
  id: string;
  name: string;
  raw: string;
  e164: string | null;
};

export function ContactsPicker({ visible, onClose, onPick }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [status, setStatus] = useState<
    "idle" | "loading" | "denied" | "unsupported" | "ready"
  >("idle");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!visible) {
      setEntries([]);
      setQuery("");
      setStatus("idle");
      return;
    }
    let cancelled = false;
    async function load() {
      setStatus("loading");
      try {
        const perm = await Contacts.requestPermissionsAsync();
        if (perm.status !== "granted") {
          if (!cancelled) setStatus("denied");
          return;
        }
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
          pageSize: 1000,
          sort: Contacts.SortTypes.FirstName,
        });
        if (cancelled) return;
        const flat: Entry[] = [];
        for (const c of data) {
          const name = c.name?.trim() || "—";
          for (const phone of c.phoneNumbers ?? []) {
            const raw = phone.number?.trim();
            if (!raw) continue;
            const parsed = parsePhoneNumberFromString(raw, "UA");
            const e164 = parsed?.isValid() ? parsed.number : null;
            flat.push({
              id: `${c.id}-${flat.length}`,
              name,
              raw,
              e164,
            });
          }
        }
        setEntries(flat);
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus("unsupported");
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [visible]);

  const filtered = useMemo(() => {
    if (!query.trim()) return entries;
    const q = query.toLowerCase();
    return entries.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.raw.toLowerCase().includes(q) ||
        (e.e164 ?? "").toLowerCase().includes(q),
    );
  }, [entries, query]);

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={t("preCall.contactsTitle")}
      scrollable={false}
    >
      <View style={{ gap: theme.spacing.md, maxHeight: 480 }}>
        <TextField
          placeholder={t("preCall.contactsSearch")}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
        />

        {status === "loading" ? (
          <Spinner />
        ) : status === "denied" ? (
          <Banner tone="warning" message={t("preCall.contactsDenied")} />
        ) : status === "unsupported" ? (
          <Banner tone="warning" message={t("preCall.contactsUnsupported")} />
        ) : filtered.length === 0 ? (
          <Banner tone="info" message={t("preCall.contactsEmpty")} />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(e) => e.id}
            renderItem={({ item }) => (
              <Pressable
                disabled={!item.e164}
                onPress={() => {
                  if (item.e164) {
                    onPick(item.e164);
                    onClose();
                  }
                }}
                style={{
                  paddingVertical: theme.spacing.sm,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: theme.spacing.sm,
                  opacity: item.e164 ? 1 : 0.4,
                }}
              >
                <Ionicons
                  name="person-circle-outline"
                  size={28}
                  color={theme.colors.textMuted}
                />
                <View style={{ flex: 1 }}>
                  <Text variant="body">{item.name}</Text>
                  <Text variant="caption" color="textMuted">
                    {item.e164 ?? item.raw}
                  </Text>
                </View>
                {item.e164 ? (
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={theme.colors.textMuted}
                  />
                ) : (
                  <Text variant="caption" color="danger">
                    {t("preCall.contactsInvalid")}
                  </Text>
                )}
              </Pressable>
            )}
            ItemSeparatorComponent={() => (
              <View
                style={{
                  height: 1,
                  backgroundColor: theme.colors.border,
                }}
              />
            )}
          />
        )}
      </View>
    </Modal>
  );
}
