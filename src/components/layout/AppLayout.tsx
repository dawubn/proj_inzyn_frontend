import { getMe } from "@/api/auth";
import { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  LayoutDashboard,
  History,
  FileText,
  Settings,
  User,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const menuItems = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "History of analysis",
    path: "/history",
    icon: History,
  },
  {
    label: "Document Analysis",
    path: "/document-analysis",
    icon: FileText,
  },
  {
    label: "Rule profiles",
    path: "/rule-profiles",
    icon: Settings,
  },
  {
    label: "Account details",
    path: "/account-details",
    icon: User,
  },
];

type Breadcrumb = {
  label: string;
  path: string;
};

const breadcrumbMap: Record<string, Breadcrumb[]> = {
  "/dashboard": [{ label: "Dashboard", path: "/dashboard" }],

  "/history": [
    { label: "Dashboard", path: "/dashboard" },
    { label: "History of analysis", path: "/history" },
  ],

  "/history/analysis-details": [
    { label: "Dashboard", path: "/dashboard" },
    { label: "History of analysis", path: "/history" },
    { label: "Analysis details", path: "/history/analysis-details" },
  ],

  "/document-analysis": [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Document Analysis", path: "/document-analysis" },
  ],

  "/rule-profiles": [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Rule profiles", path: "/rule-profiles" },
  ],

  "/account-details": [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Account details", path: "/account-details" },
  ],
};

function getBreadcrumbs(pathname: string) {
  return (
    breadcrumbMap[pathname] ?? [{ label: "Dashboard", path: "/dashboard" }]
  );
}

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  const breadcrumbs = getBreadcrumbs(location.pathname);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  useEffect(() => {
    async function fetchUser() {
      try {
        const user = await getMe();
        setUserEmail(user.email);
      } catch (error) {
        console.error(error);
      }
    }

    fetchUser();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* top section */}
      <header className="flex items-start justify-between px-8 py-6">
        <div>
          <h1
            onClick={() => navigate("/dashboard")}
            className="cursor-pointer text-lg font-semibold transition-opacity hover:opacity-70"
          >
            CerberDoc
          </h1>

          <div className="mt-4 flex items-center gap-3 text-sm text-gray-500">
            {breadcrumbs.length > 1 && (
              <button
                onClick={() =>
                  navigate(breadcrumbs[breadcrumbs.length - 2].path)
                }
                className="cursor-pointer text-gray-700 hover:text-black"
              >
                <ArrowLeft size={18} />
              </button>
            )}

            {breadcrumbs.map((breadcrumb, index) => {
              const isLast = index === breadcrumbs.length - 1;

              return (
                <div key={breadcrumb.path} className="flex items-center gap-3">
                  <span
                    onClick={() => {
                      if (!isLast) {
                        navigate(breadcrumb.path);
                      }
                    }}
                    className={
                      isLast
                        ? "font-medium text-gray-900"
                        : "cursor-pointer hover:text-black"
                    }
                  >
                    {breadcrumb.label}
                  </span>

                  {!isLast && <ChevronRight size={14} />}
                </div>
              );
            })}
          </div>
        </div>

        {/* sidebar trigger */}
        <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
          <SheetTrigger asChild>
            <button className="flex cursor-pointer items-center gap-3 rounded-full hover:bg-gray-50">
              <Avatar className="h-10 w-10">
                <AvatarFallback>
                  <User size={18} />
                </AvatarFallback>
              </Avatar>

              <ChevronDown size={16} className="text-gray-500" />
            </button>
          </SheetTrigger>

          <SheetContent
            side="right"
            className="w-[280px] px-6 py-6 [&>button]:cursor-pointer"
          >
            <SheetHeader>
              <SheetTitle className="sr-only">Navigation</SheetTitle>

              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    <User size={18} />
                  </AvatarFallback>
                </Avatar>

                <div>
                  <p className="text-sm font-medium">{userEmail}</p>
                  <p className="text-xs text-gray-500">User account</p>
                </div>
              </div>
            </SheetHeader>

            <Separator className="my-6" />

            <nav className="space-y-6">
              <div>
                <p className="mb-2 text-xs font-semibold text-gray-500">Menu</p>

                <div className="space-y-1">
                  {menuItems.slice(0, 4).map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;

                    return (
                      <button
                        key={item.path}
                        onClick={() => {
                          navigate(item.path);
                          setIsSidebarOpen(false);
                        }}
                        className={`flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                          isActive
                            ? "bg-gray-100 text-black"
                            : "text-gray-600 hover:bg-gray-50 hover:text-black"
                        }`}
                      >
                        <Icon size={16} />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold text-gray-500">
                  Account
                </p>

                <button
                  onClick={() => {
                    navigate("/account-details");
                    setIsSidebarOpen(false);
                  }}
                  className={`flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                    location.pathname === "/account-details"
                      ? "bg-gray-100 text-black"
                      : "text-gray-600 hover:bg-gray-50 hover:text-black"
                  }`}
                >
                  <User size={16} />
                  Account details
                </button>
              </div>
            </nav>

            <div className="absolute bottom-6 left-6 right-6">
              <Button
                onClick={handleLogout}
                className="w-full cursor-pointer bg-black text-white hover:bg-black/90"
              >
                <LogOut size={16} />
                Log out
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </header>

      {/* main content */}
      <main className="px-8 pb-8">
        <div className="min-h-[calc(100vh-140px)] rounded-sm bg-white">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
