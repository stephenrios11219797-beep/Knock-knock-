"use client";

import { useState } from "react";

const STATUS_OPTIONS = [
  { label: "Walked", color: "#16a34a" },
  { label: "No Answer", color: "#dc2626" },
  { label: "Soft Set", color: "#0ea5e9" },
  { label: "Contingency", color: "#7c3aed" },
  { label: "Contract", color: "#d4af37" },
  { label: "Not Interested", color: "#4b5563" },
];

export default function ActionPanel({ getPendingLngLat, onSave }) {
  const [showStatus, setShowStatus] = useState(false);
  const [showSeverity, setShowSeverity] = useState(false);
  const [severity, setSeverity] = useState(5);
  const [notes, setNotes] = useState("");
  const [selectedStatus, setSelectedStatus] = useState(null);

  const logHouse = () => {
    setShowStatus(true);
  };

  const selectStatus = (status) => {
    setSelectedStatus(status);

    if (status.label === "No Answer") {
      setShowSeverity(true);
    } else {
      save(status);
    }
  };

  const save = (status) => {
    const lngLat = getPendingLngLat();
    if (!lngLat) return;

    onSave({
      lat: lngLat.lat,
      lng: lngLat.lng,
      color: status.color,
      severity,
      notes,
    });

    reset();
  };

  const reset = () => {
    setShowStatus(false);
    setShowSeverity(false);
    setSeverity(5);
    setNotes("");
    setSelectedStatus(null);
  };

  return (
    <>
      <div
        style={{
          position: "fixed",
          bottom: 24,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 50,
        }}
      >
        <button
          onClick={logHouse}
          style={{ borderRadius: 999, padding: "12px 18px" }}
        >
          Log House
        </button>
      </div>

      {showStatus && (
        <div
          style={{
            position: "fixed",
            bottom: 90,
            left: "50%",
            transform: "translateX(-50%)",
            background: "white",
            padding: 10,
            borderRadius: 12,
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
            justifyContent: "center",
            maxWidth: "90vw",
            zIndex: 100,
          }}
        >
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s.label}
              onClick={() => selectStatus(s)}
              style={{
                background: s.color,
                color: "white",
                padding: "6px 10px",
                borderRadius: 6,
                fontSize: 12,
              }}
            >
              {s.label}
            </button>
          ))}
          <button onClick={reset}>Cancel</button>
        </div>
      )}

      {showSeverity && (
        <div
          style={{
            position: "fixed",
            bottom: 130,
            left: "50%",
            transform: "translateX(-50%)",
            background: "white",
            padding: 22,
            borderRadius: 18,
            width: 320,
            zIndex: 200,
          }}
        >
          <div style={{ marginBottom: 10 }}>Roof Damage Severity</div>

          <input
            type="range"
            min={0}
            max={10}
            value={severity}
            onChange={(e) => setSeverity(Number(e.target.value))}
            style={{ width: "100%" }}
          />

          <textarea
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{
              marginTop: 12,
              width: "100%",
              height: 80,
              fontSize: 16,
            }}
          />

          <div style={{ display: "flex", gap: 12, marginTop: 14 }}>
            <button onClick={() => save(selectedStatus)}>Save</button>
            <button onClick={reset}>Skip</button>
          </div>
        </div>
      )}
    </>
  );
}
