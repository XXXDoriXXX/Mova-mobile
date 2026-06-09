import { useRouter } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { deleteConversation } from "@/api/conversations";
import { actionSheet, confirm } from "@/feedback/dialogStore";
import { toast } from "@/feedback/toast";
import type { Conversation } from "@/types/api";
import { formatPhoneForDisplay } from "@/utils/phone";

type Args = {
  onOpen: (id: string) => void;
};

export function useConversationActions({ onOpen }: Args) {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();

  const deleteMut = useMutation({
    mutationFn: deleteConversation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations", "list"] });
      toast.success(t("conversation.deleteSuccess"));
    },
    onError: () => toast.error(t("conversation.deleteError")),
  });

  function quickRecall(c: Conversation) {
    router.push({
      pathname: "/call/pre",
      params: { prefillPhone: c.targetPhone },
    });
  }

  async function openMenu(c: Conversation) {
    const chosen = await actionSheet({
      title: formatPhoneForDisplay(c.targetPhone),
      actions: [
        { id: "recall", label: t("history.recall"), icon: "call-outline" },
        { id: "open", label: t("history.open"), icon: "chatbubbles-outline" },
        {
          id: "delete",
          label: t("conversation.delete"),
          icon: "trash-outline",
          destructive: true,
        },
      ],
    });
    if (chosen === "recall") {
      quickRecall(c);
    } else if (chosen === "open") {
      onOpen(c.id);
    } else if (chosen === "delete") {
      const ok = await confirm({
        title: t("conversation.deleteConfirm"),
        confirmLabel: t("conversation.delete"),
        destructive: true,
        icon: "trash-outline",
      });
      if (ok) deleteMut.mutate(c.id);
    }
  }

  return { quickRecall, openMenu };
}
