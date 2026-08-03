import { Component, type ErrorInfo, type ReactNode } from "react";

export class SceneErrorBoundary extends Component<{ onFailure: (message: string) => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error, _info: ErrorInfo) { void _info; this.props.onFailure(error.message); }
  render() { return this.state.failed ? null : this.props.children; }
}
