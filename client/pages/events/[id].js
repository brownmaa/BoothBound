import { events } from "@/data/events";
import { useRouter } from "next/router";
import Link from "next/link";

/*--- 1.  same mock data (or import from a shared file) ---*/

export default function EventDetail() {
  const { query } = useRouter();
  const event = events.find((e) => e.id === query.id);

  if (!event) {
    return (
      <main className="flex h-screen flex-col items-center justify-center">
        <h1 className="text-2xl font-semibold">Event not found 😕</h1>
        <Link href="/events" className="mt-4 text-blue-600 underline">
          Back to events
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <Link href="/events" className="text-blue-600">&larr; All events</Link>

      <h1 className="mt-4 text-3xl font-bold">{event.name}</h1>
      <p className="mt-2 text-gray-600">
        {event.start} &rarr; {event.end}
      </p>
      <p className="mb-6 text-gray-600">
        {event.city}, {event.state}
      </p>

      {/* placeholder for notes, reps, etc. */}
      <section className="rounded border p-4">
        <h2 className="mb-2 text-xl font-semibold">Notes</h2>
        <textarea
          placeholder="Add a note..."
          className="h-32 w-full rounded border p-2"
        />
        <button className="mt-2 rounded bg-blue-600 px-4 py-2 text-white">
          Save note
        </button>
      </section>
    </main>
  );
}