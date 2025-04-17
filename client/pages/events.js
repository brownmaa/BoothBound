/*  pages/events.js
    Simple, mobile‑friendly Event List
*/
import Head from "next/head";

const mockEvents = [
  {
    id: 1,
    name: "SaaStr Annual 2025",
    start: "2025‑09‑10",
    end: "2025‑09‑12",
    location: "Austin, TX",
  },
  {
    id: 2,
    name: "CES",
    start: "2026‑01‑07",
    end: "2026‑01‑10",
    location: "Las Vegas, NV",
  },
  {
    id: 3,
    name: "Inbound",
    start: "2025‑05‑15",
    end: "2025‑05‑17",
    location: "Boston, MA",
  },
];

export default function EventsPage() {
  return (
    <>
      <Head>
        <title>Events | BoothBound</title>
      </Head>

      <main className="min-h-screen bg-gray-50 px-4 py-6 md:px-8">
        <h1 className="text-3xl font-semibold text-center mb-8">
          Upcoming Events
        </h1>

        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {mockEvents.map((ev) => (
            <article
              key={ev.id}
              className="rounded-xl border bg-white p-6 shadow hover:shadow-md transition"
            >
              <h2 className="text-xl font-medium mb-2">{ev.name}</h2>
              <p className="text-sm text-gray-600 mb-1">
                {ev.start} → {ev.end}
              </p>
              <p className="text-sm text-gray-600 mb-4">{ev.location}</p>

              <a
                href={`/events/${ev.id}`}
                className="inline-block rounded bg-blue-600 px-4 py-2 text-white text-sm hover:bg-blue-700"
              >
                View details
              </a>
            </article>
          ))}
        </section>
      </main>
    </>
  );
}
