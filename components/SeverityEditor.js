// SeverityEditor.js
export default function SeverityEditor({ show, severity, setSeverity, notes, setNotes, selectedStatus, setSelectedStatus, STATUS_OPTIONS, onSave, onCancel }) {
  if (!show) return null;

  const severityPercent = (severity / 10) * 100;

  return (
    <div style={{ position: "fixed", bottom: 130, left: "50%", transform: "translateX(-50%)", background: "white", padding: 22, borderRadius: 18, width: 320, zIndex: 200, maxWidth: "90vw" }}>
      <div style={{ marginBottom: 10 }}>Edit Pin</div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
        {STATUS_OPTIONS.map((s) => (
          <button key={s.label} onClick={() => setSelectedStatus(s)}
            style={{
              background: s.color,
              color: "white",
              padding: "6px 10px",
              borderRadius: 6,
              fontSize: 12,
              border: selectedStatus?.label === s.label ? "2px solid black" : "none"
            }}>
            {s.label}
          </button>
        ))}
      </div>

      <input
        type="range"
        min={0}
        max={10}
        value={severity}
        onChange={(e) => setSeverity(Number(e.target.value))}
        style={{
          width: "100%",
          appearance: "none",
          height: 16,
          borderRadius: 999,
          fontSize: 16,
          touchAction: "none",
          background: `
            linear-gradient(
              90deg,
              #16a34a 0%,
              #facc15 50%,
              #dc2626 100%
            )
          `,
        }}
      />

      <textarea
        placeholder="Notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        style={{ width: "100%", height: 80, marginTop: 10, fontSize: 16 }}
      />

      <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
        <button onClick={onSave}>Save</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
