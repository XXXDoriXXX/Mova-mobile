import React, { Component, type ReactNode } from "react";
import { View } from "react-native";

import { captureException } from "@/observability/sentry";
import { reportError } from "@/observability/telemetry";

import { Banner } from "./Banner";
import { Button } from "./Button";
import { Text } from "./Text";

type Props = {
  children: ReactNode;
  onReload?: () => void;
  onSignOut?: () => void;
};

type State = { error: Error | null };

function tryReload(): boolean {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("expo-updates") as { reloadAsync?: () => Promise<void> };
    if (typeof mod.reloadAsync === "function") {
      void mod.reloadAsync();
      return true;
    }
  } catch {
  }
  return false;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    captureException(error, { componentStack: info.componentStack });
    reportError(error, {
      fatal: true,
      context: { source: "errorBoundary", componentStack: info.componentStack },
    });
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
