import { useLocation } from "wouter";
import { Home, Search, Radio, Coins, User } from "lucide-react";

export default function BottomNavigation() {
  const [location, setLocation] = useLocation();

  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Search, label: "Discover", path: "/discover" },
    { icon: Radio, label: "Live", path: "/live", special: true },
    { icon: Coins, label: "Coins", path: "/coins" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-t border-gray-800">
      <div className="max-w-sm mx-auto">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            
            if (item.special) {
              return (
                <button
                  key={item.path}
                  className="flex flex-col items-center py-2 relative -top-2"
                >
                  <div className="w-12 h-8 bg-gradient-to-r from-pink-500 to-violet-500 rounded-lg flex items-center justify-center">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </button>
              );
            }

            return (
              <button
                key={item.path}
                onClick={() => setLocation(item.path)}
                className="flex flex-col items-center py-2 space-y-1"
              >
                <Icon
                  className={`w-6 h-6 ${
                    isActive ? "text-white" : "text-gray-400"
                  }`}
                />
                <span
                  className={`text-xs ${
                    isActive ? "text-white" : "text-gray-400"
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
