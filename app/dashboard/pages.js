'use client';

import { useState } from 'react';

function ManagerDashboard() {
  return (
    <div>
      <h2>Manager Dashboard</h2>
      <ul>
        <li>View all reps</li>
        <li>Assign retail appointments</li>
        <li>View leaderboard</li>
        <li>View contracts & contingencies</li>
      </ul>
    </div>
  );
}

function RepDashboard() {
  return (
    <div>
      <h2>Rep Dashboard</h2>
      <ul>
        <li>Log knocks / talks / walks</li>
        <li>View my houses</li>
        <li>View my appointments</li>
      </ul>
    </div>
  );
}

export default function DashboardPage() {
  // TEMP role switch (later this comes from auth / database)
  const [role, setRole] = useState('rep'); // 'rep' | 'manager'

  return (
    <main style={{ padding: '20px' }}>
      <h1>Dashboard</h1>

      {/* TEMP ROLE TOGGLE */}
      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => setRole('rep')}>Rep View</button>{' '}
        <button onClick={() => setRole('manager')}>Manager View</button>
      </div>

      {role === 'manager' ? <ManagerDashboard /> : <RepDashboard />}
    </main>
  );
}
