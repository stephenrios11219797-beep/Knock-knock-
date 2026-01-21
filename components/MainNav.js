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
    <>
      {/* TOP LEFT */}
      <div style={styles.topLeft}>
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

      {/* TOP RIGHT (MAP ONLY) */}
      {isMap && (
        <div style={styles.topRight}>
          <button style={styles.smallBtn} onClick={onRequestGPS}>
            GPS
          </button>

          <button style={styles.smallBtn} onClick={onToggleFollow}>
            {isFollowing ? "Unlock" : "Follow"}
          </button>
        </div>
      )}
    </>
  );
}

const styles = {
  topLeft: {
    position: "fixed",
    top: "12px",
    left: "12px",
    zIndex: 1000,
  },
  topRight: {
    position: "fixed",
    top: "12px",
    right: "12px",
    display: "flex",
    gap: "8px",
    zIndex: 1000,
  },
  primaryBtn: {
    padding: "8px 14px",
    fontSize: "14px",
    fontWeight: "600",
    borderRadius: "999px", // pill
    border: "1px solid #ccc",
    background: "#ffffff",
  },
  smallBtn: {
    padding: "6px 12px",
    fontSize: "13px",
    borderRadius: "999px", // pill
    border: "1px solid #ccc",
    background: "#ffffff",
  },
};
