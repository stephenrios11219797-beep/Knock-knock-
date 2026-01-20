"use client";

import { useRouter } from "next/navigation";

export default function MainNav() {
  const router = useRouter();

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 56,
        background: "#111827",
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        zIndex: 20,
      }}
    >
      <button
        onClick={() => router.push("/")}
        style={{
          background: "transparent",
          color: "white",
          border: "none",
          fontSize: 16,
          fontWeight: 600,
        }}
      >
        ← Home
      </button>
    </div>
  );
}
