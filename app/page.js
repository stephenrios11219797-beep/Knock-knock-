"use client";

import { useState } from "react";

export default function RepPage() {
  const [knocks, setKnocks] = useState(0);
  const [talks, setTalks] = useState(0);
  const [walks, setWalks] = useState(0);

  return (
    <main>
      <h1>Rep Dashboard</h1>

      <div style={{ marginTop: 20 }}>
        <h3>Knocks</h3>
        <p>{knocks}</p>
        <button onClick={() => setKnocks(knocks + 1)}>Add Knock</button>
      </div>

      <div style={{ marginTop: 20 }}>
        <h3>Talks</h3>
        <p>{talks}</p>
        <button onClick={() => setTalks(talks + 1)}>Add Talk</button>
      </div>

      <div style={{ marginTop: 20 }}>
        <h3>Walks (Roof Walked)</h3>
        <p>{walks}</p>
        <button onClick={() => setWalks(walks + 1)}>Add Walk</button>
      </div>

      <p style={{ marginTop: 30 }}>
        All entries are manually confirmed.
      </p>
    </main>
  );
}
