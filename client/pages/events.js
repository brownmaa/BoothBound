import Link from "next/link";             // ➊  FIX: add this line

/* mock array with ids */
const events = [
  { id: "saastr-2025",  name: "SaaStr Annual 2025", start: "2025‑09‑10", end: "2025‑09‑12", city: "Austin",  state: "TX" },
  { id: "ces-2026",     name: "CES 2026",           start: "2026‑01‑07", end: "2026‑01‑10", city: "Las Vegas",state: "NV" },
  { id: "inbound-2025", name: "Inbound 2025",       start: "2025‑05‑15", end: "2025‑05‑17", city: "Boston",  state: "MA" },
];

export default function EventsPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-center text-3xl font-semibold">Upcoming Events</h1>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((ev) => (
          <article key={ev.id} className="rounded-xl border p-6 shadow">
            <h2 className="text-xl font-medium">{ev.name}</h2>
            <p className="text-sm text-gray-600">
              {ev.start} → {ev.end}
            </p>
            <p className="mb-4 text-sm text-gray-600">
              {ev.city}, {ev.state}
            </p>

            <Link
              href={`/events/${ev.id}`}
              className="inline-block rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
            >
              View details
            </Link>
          </article>
        ))}
      </div>
    </main>
  );
}
