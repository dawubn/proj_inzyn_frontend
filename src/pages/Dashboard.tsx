import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen p-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold">Dashboard</h1>

          <p className="text-gray-500 mt-2">You are logged in.</p>
        </div>

        <Button
          onClick={() => {
            logout();
            navigate("/login");
          }}
          className="cursor-pointer"
        >
          Logout
        </Button>
      </div>
    </div>
  );
}
