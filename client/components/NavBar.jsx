import React from "react";
import Link from "next/link";
import MobileMenu from "../components/MobileMenu";

export default function NavBar() {
  return (
    <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
      {/* brand */}
      <Link href="/" className="text-lg font-semibold text-gray-900">
        BoothBound
      </Link>

      {/* desktop links */}
      <ul className="hidden gap-6 md:flex">
        <li><Link href="/"          className="hover:text-blue-600">Home</Link></li>
        <li><Link href="/events"    className="hover:text-blue-600">Events</Link></li>
        <li><Link href="/leads"     className="hover:text-blue-600">Leads</Link></li>
        <li><Link href="/scanner" className="hover:text-blue-600">Scanner</Link></li>
        <li><Link href="/analytics" className="hover:text-blue-600">Analytics</Link></li>
        <li><Link href="/admin/dashboard" className="hover:text-blue-600">Admin</Link></li>
      </ul>

      {/* mobile hamburger */}
      <button
        onClick={MobileMenu.open}
        className="md:hidden rounded p-2 hover:bg-gray-100"
        aria-label="Open menu"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </nav>
  );
}
