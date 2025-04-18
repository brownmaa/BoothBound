import { useRouter } from "next/router";
import Link from "next/link";
import { leads } from "@/data/leads";

export default function LeadDetail() {
  const { query } = useRouter();
  const lead = leads.find((l) => l.id === query.id);

  if (!lead) {
    return <main className="p-8">Lead not found · <Link href="/leads">Back</Link></main>;
  }

  return (
    <main className="p-8 space-y-4">
      <h1 className="text-3xl font-bold">{lead.name}</h1>
      <p>Company: {lead.company}</p>
      <p>Title: {lead.title}</p>
      <p>Score: {lead.score}/10</p>
      <Link href="/leads" className="text-blue-600 underline">← back</Link>
    </main>
  );
}
