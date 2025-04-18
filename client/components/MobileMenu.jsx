import Link from "next/link";
import { useState } from "react";

export default function MobileMenu() {
  const [open,setOpen]=useState(false);
  return (
    <>
      <button onClick={()=>setOpen(true)} className="md:hidden rounded p-2 hover:bg-gray-100">
        <svg className="h-6 w-6" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={()=>setOpen(false)}>
          <div className="absolute right-0 top-0 h-full w-2/3 max-w-xs bg-white p-6">
            <button onClick={()=>setOpen(false)} className="mb-4 text-gray-500">✕</button>
            <nav className="flex flex-col gap-4">
              <Link href="/"      onClick={()=>setOpen(false)}>Home</Link>
              <Link href="/events" onClick={()=>setOpen(false)}>Events</Link>
              <Link href="/leads"  onClick={()=>setOpen(false)}>Leads</Link>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
