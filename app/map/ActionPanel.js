"use client";

import { useState } from "react";

export default function ActionPanel({ selectedPin, clearSelectedPin }) {
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
      {/* Action Panel */}
      <div style={panelStyle}>
        <div style={rowStyle}>
          <button onClick={() => handleAction("Knock")}>Knock</button>
          <button onClick={() => handleAction("Talk")}>Talk</button>
          <button onClick={() => handleAction("Walk")}>Walk</button>
          <button onClick={() => handleAction("No Answer")}>No Answer</button>
        </div>

        <div style={rowStyle}>
          <button style={dangerStyle} onClick={() => handleAction("DNK")}>
            DNK
          </button>
          <button onClick={() => handleAction("Contingency")}>
            Contingency
          </button>
          <button onClick={() => handleAction("Contract")}>Contract</button>
        </div>

        <div style={rowStyle}>
          <label style={{ width: "100%" }}>
            Damage Severity
            <input type="range" min="0" max="100" style={{ width: "100%" }} />
          </label>
        </div>
      </div>

      {/* Undo Toast */}
      {showUndo && (
        <div style={toastStyle}>
          <span>{lastAction} logged</span>
          <button onClick={undoAction} style={undoButtonStyle}>
            Undo
          </button>
        </div>
      )}

      {/* PIN DETAILS MODAL */}
      {selectedPin && (
        <div
          onClick={clearSelectedPin}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            zIndex: 50,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white",
              borderRadius: 12,
              padding: 16,
              width: "90%",
              maxWidth: 320,
              boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <strong>House Details</strong>
              <button
                onClick={clearSelectedPin}
                style={{
                  fontSize: 16,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginTop: 10, fontSize: 14 }}>
              <div><strong>Status:</strong> {selectedPin.type}</div>
              <div><strong>Logged:</strong> {selectedPin.timestamp}</div>

              {selectedPin.severity !== undefined && (
                <div style={{ marginTop: 6 }}>
                  <strong>Severity:</strong> {selectedPin.severity}/10
                </div>
              )}

              {selectedPin.notes && (
                <div style={{ marginTop: 6 }}>
                  <strong>Notes:</strong>
                  <div style={{ fontSize: 13, marginTop: 2 }}>
                    {selectedPin.notes}
                  </div>
                </div>
              )}
            </div>
          </div>
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
