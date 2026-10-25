import React from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/geist/latin-400.css";
import "@fontsource/geist/latin-500.css";
import "@fontsource/geist/latin-700.css";
import "./style.css";
import { App } from "./App";
import { PrivacyGate } from "./Privacy";
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <main className="startup">
        <h1>Saku perlu dibuka ulang</h1>
        <p>Catatan yang sudah tersimpan tetap berada di perangkat.</p>
        <button className="primary" onClick={() => location.reload()}>
          Buka ulang
        </button>
      </main>
    ) : (
      this.props.children
    );
  }
}
createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <PrivacyGate>
      <App />
    </PrivacyGate>
  </ErrorBoundary>,
);
