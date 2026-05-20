import React, { Component, type ReactNode } from "react";
import { View } from "react-native";

import { captureException } from "@/observability/sentry";

import { Banner } from "./Banner";
import { Button } from "./Button";
import { Text } from "./Text";

type Props = {
  children: ReactNode;
  /** Override the default reload action (mostly for tests). */
  onReload?: () => void;
  /** Optional logout hook — when provided, surfaces "Sign out" as a recovery. */
  onSignOut?: () => void;
};

type State = { error: Error | null };

/**
 * Soft dependency on expo-updates. When present (standalone builds), Reload
 * fully restarts the JS bundle; otherwise we just clear the error state and
 * let React retry rendering. Resolved lazily so the module is optional.
 */
function tryReload(): boolean {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("expo-updates") as { reloadAsync?: () => Promise<void> };
    if (typeof mod.reloadAsync === "function") {
      void mod.reloadAsync();
      return true;
    }
  } catch {
    // expo-updates not installed
  }
  return false;
}

/**
 * Root-only error boundary. Mobile flows are short and one boundary catches
 * everything; per-route boundaries are overkill and tend to hide bugs behind
 * dismissible fallbacks. Errors are reported to Sentry, then the user gets
 * "Reload" (Updates.reloadAsync) and optionally "Sign out".
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    captureException(error, { componentStack: info.componentStack });
  }

  private handleReload = (): void => {
    if (this.props.onReload) {
      this.props.onReload();
      return;
    }
    tryReload();
    this.setState({ error: null });
  };

  render(): ReactNode {
    if (!this.state.error) return this.props.children;
    return (
      <View
        style={{
          flex: 1,
          padding: 24,
          gap: 16,
          justifyContent: "center",
          backgroundColor: "#0E1116",
        }}
      >
        <Text variant="title" color="text" align="center">
          Something went wrong
        </Text>
        <Banner
          tone="danger"
          message={this.state.error.message || "Unexpected error"}
        />
        <Button label="Reload" onPress={this.handleReload} />
        {this.props.onSignOut ? (
          <Button
            label="Sign out"
            variant="secondary"
            onPress={this.props.onSignOut}
          />
        ) : null}
      </View>
    );
  }
}
