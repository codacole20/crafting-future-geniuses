
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Flame, MessageCircle, Plus, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export function AppNavigation() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.pathname);

  const navItems = [
    {
      icon: Flame,
      text: "Quest",
      path: "/",
      active: activeTab === "/"
    },
    {
      icon: MessageCircle,
      text: "Chat",
      path: "/chat",
      active: activeTab === "/chat"
    },
    {
      icon: Plus,
      text: "Project Hub",
      path: "/projects",
      active: activeTab === "/projects"
    },
    {
      icon: Settings,
      text: "Settings",
      path: "/settings",
      active: activeTab === "/settings"
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-ct-white shadow-ct flex justify-around py-2 z-10">
      {navItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={cn(
            "flex flex-col items-center justify-center px-4 py-2 rounded-pill transition-all",
            item.active ? "text-[#FACD7B]" : "text-gray-400"
          )}
          onClick={() => setActiveTab(item.path)}
        >
          <item.icon className="h-6 w-6 mb-1" />
          <span className="text-xs font-medium">{item.text}</span>
        </Link>
      ))}
    </nav>
  );
}
