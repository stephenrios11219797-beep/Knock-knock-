"use client";

import { useState } from "react";

export default function RepDashboard() {
  const [knocks, setKnocks] = useState(0);
  const [talks, setTalks] = useState(0);
  const [walks, setWalks] = useState(0);

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "20px",
        background: "#020617",
        color: "#f8fafc",
      }}
    >
      <h1 style={{ fontSize: "1.8rem", marginBottom: "6px" }}>
        Rep Dashboard
      </h1>

      <p style={{ opacity: 0.8, marginBottom: "24px" }}>
        Manual activity tracking
      </p>

      <section style={card}>
        <h3>Knocks</h3>
        <p>{knocks}</p>
        <button style={button} onClick={() => setKnocks(knocks + 1)}>
          + Knock
        </button>
      </section>

      <section style={card}>
        <h3>Talks</h3>
        <p>{talks}</p>
        <button style={button} onClick={() => setTalks(talks + 1)}>
          + Talk
        </button>
      </section>

      <section style={card}>
        <h3>Walks (Roof Walked)</h3>
        <p>{walks}</p>
        <button style={button} onClick={() => setWalks(walks + 1)}>
          + Walk
        </button>
      </section>

      <p style={{ marginTop: "24px", fontSize: "0.85rem", opacity: 0.6 }}>
        All entries require manual confirmation.
      </p>
    </main>
  );
}

const card = {
  background: "#020617",
  border: "1px solid #1e293b",
  borderRadius: "12px",
  padding: "16px",
  marginBottom: "16px",
};

const button = {
  marginTop: "8px",
  padding: "10px 14px",
  borderRadius: "8px",
  background: "#22c55e",
  color: "#020617",
  border: "none",
  fontWeight: 600,
};
