import { useCallback, useEffect } from "react";
import { BackHandler } from "react-native";
import { useFocusEffect, useNavigation } from "expo-router";

import { confirm } from "./dialogStore";

type Options = {
  dirty: boolean;
  title: string;
  body?: string;
  confirmLabel: string;
  cancelLabel?: string;
};

export function useUnsavedChanges({
  dirty,
  title,
  body,
  confirmLabel,
  cancelLabel,
}: Options): void {
  const navigation = useNavigation();

  useEffect(() => {
    if (!dirty) return;
    const unsub = navigation.addListener("beforeRemove", (event) => {
      event.preventDefault();
      void (async () => {
        const ok = await confirm({
          title,
          body,
          confirmLabel,
          cancelLabel,
          destructive: true,
          icon: "alert-circle-outline",
        });
        if (ok) navigation.dispatch(event.data.action);
      })();
    });
    return unsub;
  }, [dirty, navigation, title, body, confirmLabel, cancelLabel]);

  useFocusEffect(
    useCallback(() => {
      if (!dirty) return;
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        void (async () => {
          const ok = await confirm({
            title,
            body,
            confirmLabel,
            cancelLabel,
            destructive: true,
            icon: "alert-circle-outline",
          });
          if (ok) navigation.dispatch({ type: "GO_BACK" });
        })();
        return true;
      });
      return () => sub.remove();
    }, [dirty, title, body, confirmLabel, cancelLabel, navigation]),
  );
}
