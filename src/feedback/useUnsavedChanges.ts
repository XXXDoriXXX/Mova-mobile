import { useCallback, useEffect } from "react";
import { BackHandler } from "react-native";
import { useFocusEffect, useNavigation } from "expo-router";

import { confirm } from "./dialogStore";

type Options = {
  /** Whether the form has unsaved changes. */
  dirty: boolean;
  /** Localized confirm dialog. */
  title: string;
  body?: string;
  confirmLabel: string;
  cancelLabel?: string;
};

/**
 * Intercepts every way a user can leave the current screen and gates
 * the exit through a `confirm()` sheet when the form is dirty:
 *
 *   - Native back gesture (iOS swipe / Android hardware back)
 *   - Tab bar tap that would move them off the stack
 *   - `router.back()` calls that bubble through React Navigation
 *
 * Cleans up on unmount + when the screen loses focus. No-op when
 * `dirty` is false.
 *
 * Usage:
 *   useUnsavedChanges({
 *     dirty: formState.isDirty,
 *     title: t("...confirm.title"),
 *     confirmLabel: t("common.discard"),
 *   });
 */
export function useUnsavedChanges({
  dirty,
  title,
  body,
  confirmLabel,
  cancelLabel,
}: Options): void {
  const navigation = useNavigation();

  // React Navigation fires `beforeRemove` whenever the screen is about
  // to leave the stack. Block it, ask, and dispatch the original
  // action if the user confirms.
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

  // Android hardware back is handled by React Navigation already on
  // most setups, but expo-router stacks behave inconsistently — so
  // we also catch the hardware event explicitly and short-circuit it
  // through the same confirm.
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
        return true; // we handled it
      });
      return () => sub.remove();
    }, [dirty, title, body, confirmLabel, cancelLabel, navigation]),
  );
}
