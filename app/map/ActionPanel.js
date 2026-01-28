"use client";

import { useState } from "react";

export default function ActionPanel() {
  const [lastAction, setLastAction] = useState(null);
  const [showUndo, setShowUndo] = useState(false);

  const handleAction = (type) => {
    setLastAction(type);
    setShowUndo(true);

    setTimeout(() => {
      setShowUndo(false);
      setLastAction(null);
    }, 5000);
  };

  const undoAction = () => {
    setShowUndo(false);
    setLastAction(null);
  };

  return (
    <>
      <div style={panelStyle}>
        <div style={rowStyle}>
          <button style={buttonStyle} onClick={() => handleAction("Knock")}>Knock</button>
          <button style={buttonStyle} onClick={() => handleAction("Talk")}>Talk</button>
          <button style={buttonStyle} onClick={() => handleAction("Walk")}>Walk</button>
          <button style={buttonStyle} onClick={() => handleAction("No Answer")}>No Answer</button>
        </div>

        <div style={rowStyle}>
          <button style={{ ...buttonStyle, ...dangerStyle }} onClick={() => handleAction("DNK")}>
            DNK
          </button>
          <button style={buttonStyle} onClick={() => handleAction("Contingency")}>
            Contingency
          </button>
          <button style={buttonStyle} onClick={() => handleAction("Contract")}>
            Contract
          </button>
        </div>

        <div style={rowStyle}>
          <label style={{ width: "100%" }}>
            Damage Severity
            <input type="range" min="0" max="100" style={{ width: "100%" }} />
          </label>
        </div>
      </div>

      {showUndo && (
        <div style={toastStyle}>
          <span>{lastAction} logged</span>
          <button onClick={undoAction} style={undoButtonStyle}>
            Undo
          </button>
        </div>
      )}
    </>
  );
}

/* ---------- Styles ---------- */

const panelStyle = {
  position: "fixed",
  bottom: "0",
  left: "0",
  right: "0",
  background: "#ffffff",
  padding: "12px",
  borderTop: "1px solid #ddd",
  zIndex: 10,
};

const rowStyle = {
  display: "flex",
  gap: "8px",
  marginBottom: "8px",
};

const buttonStyle = {
  padding: "10px 14px",
};

const dangerStyle = {
  background: "#dc2626",
  color: "#fff",
};

const toastStyle = {
  position: "fixed",
  bottom: "120px",
  left: "50%",
  transform: "translateX(-50%)",
  background: "#111",
  color: "#fff",
  padding: "10px 16px",
  borderRadius: "6px",
  display: "flex",
  gap: "12px",
  alignItems: "center",
  zIndex: 20,
};

const undoButtonStyle = {
  background: "transparent",
  color: "#38bdf8",
  border: "none",
  cursor: "pointer",
};
