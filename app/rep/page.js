"use client";

import { useState, useEffect } from "react";

export default function RepPage() {
  const [rep, setRep] = useState("Rep 1");
  const [location, setLocation] = useState("Main Office");
  const [knocks, setKnocks] = useState(0);
  const [talks, setTalks] = useState(0);
  const [walks, setWalks] = useState(0);

  const alerts = {
    "Main Office": "🟢 Area recently worked. Light follow-ups only.",
    "North Location": "🟡 Area aging. Prioritize this territory.",
    "South Location": "🔴 Area stale. High priority for knocking.",
  };

  const storageKey = `repData-${rep}`;

  // Load rep-specific data
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (saved) {
      setLocation(saved.location);
      setKnocks(saved.knocks);
      setTalks(saved.talks);
      setWalks(saved.walks);
    }
  }, [rep]);

  // Save rep-specific data
  useEffect(() => {
    localStorage.setItem(
      storageKey,
      JSON.stringify({ location, knocks, talks, walks })
    );
  }, [rep, location, knocks, talks, walks]);

  return (
    <main>
      <h1>Rep Dashboard</h1>

      <div style={{ marginBottom: 20 }}>
        <label>
          <strong>Rep Name:</strong>{" "}
          <select value={rep} onChange={(e) => setRep(e.target.value)}>
            <option>Rep 1</option>
            <option>Rep 2</option>
            <option>Rep 3</option>
          </select>
        </label>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label>
          <strong>Current Location:</strong>{" "}
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          >
            <option>Main Office</option>
            <option>North Location</option>
            <option>South Location</option>
          </select>
        </label>
      </div>

      <div style={{ marginBottom: 20, padding: 10, background: "#f1f5f9" }}>
        <strong>Territory Alert:</strong>
        <p>{alerts[location]}</p>
      </div>

      <div>
        <h3>Knocks</h3>
        <p>{knocks}</p>
        <button onClick={() => setKnocks(knocks + 1)}>Add Knock</button>
      </div>

      <div>
        <h3>Talks</h3>
        <p>{talks}</p>
        <button onClick={() => setTalks(talks + 1)}>Add Talk</button>
      </div>

      <div>
        <h3>Walks (Roof Walked)</h3>
        <p>{walks}</p>
        <button onClick={() => setWalks(walks + 1)}>Add Walk</button>
      </div>

      <p style={{ marginTop: 30 }}>
        Data is saved per rep on this device.
      </p>
    </main>
  );
}
