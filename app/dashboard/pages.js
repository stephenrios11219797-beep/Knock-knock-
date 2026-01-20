import ManagerDashboard from "../(manager)/ManagerDashboard";
import RepDashboard from "../(rep)/RepDashboard";

export default function DashboardPage() {
  // TEMP: hardcode role until auth is wired
  const role = "manager"; // or "rep"

  if (role === "manager") {
    return <ManagerDashboard />;
  }

  return <RepDashboard />;
}
