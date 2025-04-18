import MobileMenu from "@/components/MobileMenu";

  return (
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-semibold text-gray-900">
        </Link>
        {/* desktop links */}
          <li><Link href="/"      className="hover:text-blue-600">Home</Link></li>
          {/* add Leads, Analytics later */}
          <li><Link href="/analytics" className="hover:text-blue-600">Analytics</Link></li>
</ul>

        {/* mobile hamburger (coming soon) */}
        <button className="md:hidden rounded p-2 hover:bg-gray-100">
          <svg className="h-6 w-6" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
      </nav>
    </header>
  );
}
