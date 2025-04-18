import { leads } from "../data";
import Link from "next/link";

export default function LeadsPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-semibold">Leads</h1>

      <table className="w-full border text-left text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-2">Name</th>
            <th className="p-2">Company</th>
            <th className="p-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((l) => (
            <tr key={l.id} className="border-t hover:bg-gray-50">
              <td className="p-2">
                <Link href={`/leads/${l.id}`} className="text-blue-600 hover:underline">
                  {l.name}
                </Link>
              </td>
              <td className="p-2">{l.company}</td>
              <td className="p-2">
                <span className={`rounded px-2 py-1 text-white text-xs ${l.status === "Hot" ? "bg-red-600" : l.status === "Warm" ? "bg-yellow-500" : "bg-gray-400"}`}>
                  {l.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
