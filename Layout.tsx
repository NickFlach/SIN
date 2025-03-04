import { Link, useLocation } from "wouter";
import { Sidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Network,
  Brain,
  Activity,
  Vote,
  AppWindow,
  FileText,
  Users,
  ArrowRight,
  LogOut
} from "lucide-react";
import DemoDisclaimer from "@/components/DemoDisclaimer";
import { MusicPlayerProvider } from "@/lib/MusicPlayerContext";
import { MusicPlayerModal } from "@/components/MusicPlayerModal";
import { useIdentity } from "@/lib/IdentityContext";
import { useEffect } from "react";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: Network, label: "Node Map", href: "/nodes" },
  { icon: Brain, label: "Training", href: "/training" },
  { icon: Activity, label: "SCADA", href: "/scada" },
  { icon: Vote, label: "Governance", href: "/governance" },
  { icon: AppWindow, label: "Applications", href: "/applications" },
  { icon: Users, label: "Partners", href: "/partners" },
  { icon: ArrowRight, label: "Integration", href: "/integration" },
  { icon: FileText, label: "Documentation", href: "/documentation" }
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const isApplicationsPage = location === "/applications";
  const { user, logout } = useIdentity();
  const [, navigate] = useLocation();

  // Function to handle logout with confirmation
  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log("Logout button clicked");

    // Clear localStorage immediately
    localStorage.removeItem('sinet_session_id');
    localStorage.removeItem('sinet_user_name');

    // Call the context logout function
    logout();

    // Force navigation to login page
    navigate("/login");
  };

  return (
    <MusicPlayerProvider>
      <div className="flex h-screen bg-background">
        <Sidebar className="border-r">
          <div className="px-3 py-4">
            <h2 className="mb-6 px-4 text-lg font-semibold tracking-tight">
              SINet Dashboard
            </h2>
            <div className="space-y-1">
              {menuItems.map((item) => (
                <Button
                  key={item.href}
                  variant={location === item.href ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  asChild
                >
                  <Link href={item.href}>
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </Link>
                </Button>
              ))}

              {/* User identity section with logout button */}
              <div className="mt-6 pt-6 border-t border-border">
                <div className="px-4 mb-2">
                  <div className="text-sm font-medium">{user.username || 'Unknown User'}</div>
                  <div className="text-xs text-muted-foreground">Zero Knowledge ID</div>
                </div>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-100/10"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </Sidebar>
        <main className="flex-1 overflow-auto p-8">
          {children}
          {!isApplicationsPage && <DemoDisclaimer variant="banner" />}
        </main>
      </div>

      {/* Music Player Modal - Always available in the DOM but only visible when needed */}
      <MusicPlayerModal />
    </MusicPlayerProvider>
  );
}