import { Link, useLocation } from "wouter";
import { Home, CalendarDays, Users, BarChart } from "lucide-react";

export function MobileNav() {
  const [location] = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-10 bg-white shadow-lg md:hidden">
      <div className="flex justify-around p-2">
        <Link href="/">
          <a className={`${
            location === "/" ? "text-primary" : "text-gray-500"
          } flex flex-col items-center px-3 py-2`}>
            <Home className="h-6 w-6" />
            <span className="text-xs mt-1">Home</span>
          </a>
        </Link>
        <Link href="/events">
          <a className={`${
            location.includes("/events") && !location.includes("/scanner") ? "text-primary" : "text-gray-500"
          } flex flex-col items-center px-3 py-2`}>
            <CalendarDays className="h-6 w-6" />
            <span className="text-xs mt-1">Events</span>
          </a>
        </Link>
        <Link href="/leads">
          <a className={`${
            location === "/leads" ? "text-primary" : "text-gray-500"
          } flex flex-col items-center px-3 py-2`}>
            <Users className="h-6 w-6" />
            <span className="text-xs mt-1">Leads</span>
          </a>
        </Link>
        <Link href="/analytics">
          <a className={`${
            location === "/analytics" ? "text-primary" : "text-gray-500"
          } flex flex-col items-center px-3 py-2`}>
            <BarChart className="h-6 w-6" />
            <span className="text-xs mt-1">Analytics</span>
          </a>
        </Link>
      </div>
    </div>
  );
}
