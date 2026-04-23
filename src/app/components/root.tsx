import { Outlet, Link, useLocation, useNavigate } from "react-router";
import { useEffect, useRef, useState } from "react";
import {
  Calendar,
  CheckSquare,
  ChevronDown,
  Crown,
  Database,
  Home,
} from "lucide-react";
import prepKingLogo from "../../assets/prep-king-logo.svg";
import { clearToken, getMyProfile, isAuthenticated } from "../lib/api";

export function Root() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(isAuthenticated());
  const [fullName, setFullName] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (!isAuthenticated()) {
        setIsLoggedIn(false);
        setFullName("");
        return;
      }
      try {
        const profile = await getMyProfile();
        setIsLoggedIn(true);
        setFullName(profile.fullName || profile.email);
      } catch {
        setIsLoggedIn(false);
        setFullName("");
      }
    };

    void loadProfile();
  }, [location.pathname]);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onDocumentClick = (event: MouseEvent) => {
      if (!menuRef.current) {
        return;
      }

      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", onDocumentClick);
    return () => document.removeEventListener("mousedown", onDocumentClick);
  }, []);

  const handleLogout = () => {
    clearToken();
    setIsLoggedIn(false);
    setFullName("");
    setMenuOpen(false);
    navigate("/");
  };

  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/plan", icon: Crown, label: "Plan" },
    { path: "/schedule", icon: Calendar, label: "Schedule" },
    { path: "/practice", icon: CheckSquare, label: "Practice" },
    { path: "/question-bank", icon: Database, label: "Question DB" },
  ];

  return (
    <div className="size-full flex flex-col">
      {/* Header */}
      <header className="-b bordborderer-emerald-900/15 relative z-50 bg-[#fffaf0]/95 backdrop-blur supports-[backdrop-filter]:bg-[#fffaf0]/80 shadow-[0_2px_24px_rgba(31,77,58,0.06)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3">
              <img
                src={prepKingLogo}
                alt="Silicon Defense logo"
                className="w-9 h-9 rounded-xl shadow-sm ring-1 ring-emerald-900/10"
              />
              <div className="leading-tight">
                <span className="block text-xl font-semibold tracking-tight text-stone-900">
                  Silicon Defense
                </span>
                <span className="block text-[11px] uppercase tracking-[0.3em] text-emerald-800/70">
                  Chess-powered prep
                </span>
              </div>
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
                        ? "bg-emerald-900/10 text-emerald-900"
                        : "text-stone-600 hover:text-stone-900 hover:bg-amber-50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="relative z-50" ref={menuRef}>
              {isLoggedIn ? (
                <button
                  type="button"
                  onClick={() => setMenuOpen((prev) => !prev)}
                  className="inline-flex items-center gap-2 rounded-md bg-emerald-900 px-3 py-2 text-[#fffaf0] transition-colors hover:bg-emerald-800"
                >
                  {fullName || "Account"}
                  <ChevronDown className="h-4 w-4" />
                </button>
              ) : (
                <Link
                  to="/auth"
                  className="rounded-md bg-amber-100 px-3 py-2 text-stone-800 transition-colors hover:bg-amber-200"
                >
                  Login / Sign Up
                </Link>
              )}

              {isLoggedIn && menuOpen && (
                <div className="absolute right-0 z-50 mt-2 w-44 rounded-lg border border-emerald-900/10 bg-[#fffaf0] p-1 shadow-lg">
                  <Link
                    to="/profile"
                    className="block rounded-md px-3 py-2 text-sm text-stone-700 hover:bg-emerald-50 hover:text-emerald-900"
                  >
                    Profile
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="block w-full rounded-md px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-transparent">
        <Outlet />
      </main>

      {/* Mobile Navigation */}
      <nav className="md:hidden border-t border-emerald-900/15 bg-[#fffaf0]/95 backdrop-blur">
        <div className="flex justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1 py-3 px-4 flex-1 ${
                  isActive ? "text-emerald-900" : "text-stone-600"
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
