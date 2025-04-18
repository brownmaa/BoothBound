import Link from "next/link";

export default function NavBar() {
  return (
    <header className="w-full bg-white shadow-sm">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* logo / brand */}
        <Link href="/" className="text-lg font-semibold text-gray-900">
          BoothBound
        </Link>

        {/* desktop links */}
        <ul className="hidden gap-6 md:flex">
          <li><Link href="/"      className="hover:text-blue-600">Home</Link></li>
          <li><Link href="/events" className="hover:text-blue-600">Events</Link></li>
          {/* add Leads, Analytics later */}
        </ul>

        {/* mobile hamburger (coming soon) */}
        <button className="md:hidden rounded p-2 hover:bg-gray-100">
          <svg className="h-6 w-6" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
      </nav>
    </header>
  );
}
