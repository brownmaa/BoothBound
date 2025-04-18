import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { name: "Jan", leads: 4 },
  { name: "Feb", leads: 7 },
  { name: "Mar", leads: 3 },
  { name: "Apr", leads: 8 },
];

export default function Analytics() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-semibold">Analytics</h1>
      <div className="h-64 w-full">
        <ResponsiveContainer>
          <BarChart data={data}>
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="leads" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </main>
  );
}
