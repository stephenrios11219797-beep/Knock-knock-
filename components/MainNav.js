"use client";

import { usePathname, useRouter } from "next/navigation";

export default function MainNav({
  onRequestGPS,
  isFollowing,
  onToggleFollow,
}) {
  const pathname = usePathname();
  const router = useRouter();

  const isHome = pathname === "/";
  const isMap = pathname === "/map";

  return (
    <div style={styles.nav}>
      {/* LEFT SIDE */}
      <div style={styles.left}>
        {isHome && (
          <button style={styles.primaryBtn} onClick={() => router.push("/map")}>
            Map
          </button>
        )}

        {isMap && (
          <button style={styles.primaryBtn} onClick={() => router.push("/")}>
            Home
          </button>
        )}
      </div>

      {/* RIGHT SIDE (MAP ONLY) */}
      <div style={styles.right}>
        {isMap && (
          <>
            <button style={styles.smallBtn} onClick={onRequestGPS}>
              GPS
            </button>

            <button style={styles.smallBtn} onClick={onToggleFollow}>
              {isFollowing ? "Unlock" : "Follow"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  nav: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    height: "56px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 12px",
    background: "#ffffff",
    borderBottom: "1px solid #e5e5e5",
    zIndex: 1000,
  },
  left: {
    display: "flex",
    gap: "8px",
  },
  right: {
    display: "flex",
    gap: "8px",
  },
  primaryBtn: {
    padding: "8px 14px",
    fontSize: "15px",
    fontWeight: "600",
    borderRadius: "8px",
    border: "1px solid #ccc",
    background: "#f5f5f5",
  },
  smallBtn: {
    padding: "6px 10px",
    fontSize: "13px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    background: "#f9f9f9",
  },
};
