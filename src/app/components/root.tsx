import { Outlet, Link, useLocation } from "react-router";
import { Calendar, CheckSquare, Crown, Home } from "lucide-react";
import prepKingLogo from "../../assets/prep-king-logo.svg";

export function Root() {
  const location = useLocation();

  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/plan", icon: Crown, label: "Plan" },
    { path: "/schedule", icon: Calendar, label: "Schedule" },
    { path: "/practice", icon: CheckSquare, label: "Practice" },
  ];

  return (
    <div className="size-full flex flex-col">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <img
                src={prepKingLogo}
                alt="Prep King logo"
                className="w-8 h-8 rounded-lg"
              />
              <span className="text-xl font-semibold">Prep King</span>
            </Link>
            
            <nav className="hidden md:flex gap-6">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                      isActive
                        ? "bg-purple-50 text-purple-600"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-gray-50">
        <Outlet />
      </main>

      {/* Mobile Navigation */}
      <nav className="md:hidden border-t bg-white">
        <div className="flex justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1 py-3 px-4 flex-1 ${
                  isActive ? "text-purple-600" : "text-gray-600"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}