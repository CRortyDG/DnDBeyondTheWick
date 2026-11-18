import { Component, StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { AdminApp } from "./AdminApp";
import "./admin.css";

/** Never a blank page: show what broke, and a way out (forget the saved key). */
class Crash extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="ad ad-gate">
        <div className="ad-card">
          <h1>Something broke</h1>
          <p className="ad-error">{this.state.error.message}</p>
          <button
            className="ad-btn"
            onClick={() => {
              try {
                sessionStorage.removeItem("cf-admin-key");
                localStorage.removeItem("cf-admin-key");
              } catch {}
              location.reload();
            }}
          >
            Forget the key and reload
          </button>
        </div>
      </div>
    );
  }
}

// /admin: the site owner's console. It loads none of the main app's code.
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Crash>
      <AdminApp />
    </Crash>
  </StrictMode>,
);
