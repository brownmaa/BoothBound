import { useState, useEffect } from "react";
import { 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell, 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import { Event, Lead } from "@shared/schema";

// Define colors for charts
const COLORS = {
  primary: "#0ea5e9",
  secondary: "#8b5cf6",
  accent: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  gray: "#6b7280",
};

// Colors for quality distribution chart
const QUALITY_COLORS = {
  high: COLORS.accent,
  medium: COLORS.warning,
  low: COLORS.gray,
};

interface QualityDistributionChartProps {
  highCount: number;
  mediumCount: number;
  lowCount: number;
}

export function QualityDistributionChart({ highCount, mediumCount, lowCount }: QualityDistributionChartProps) {
  const data = [
    { name: "High", value: highCount, color: QUALITY_COLORS.high },
    { name: "Medium", value: mediumCount, color: QUALITY_COLORS.medium },
    { name: "Low", value: lowCount, color: QUALITY_COLORS.low },
  ];

  const totalCount = highCount + mediumCount + lowCount;
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsPieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={true}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          label={({ name, percent }) => totalCount > 0 ? `${name}: ${(percent * 100).toFixed(0)}%` : `${name}: 0%`}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => [`${value} leads`, 'Count']} />
        <Legend />
      </RechartsPieChart>
    </ResponsiveContainer>
  );
}

interface LeadsByEventChartProps {
  events: Event[];
  leads: Lead[];
}

export function LeadsByEventChart({ events, leads }: LeadsByEventChartProps) {
  const [chartData, setChartData] = useState<any[]>([]);
  
  useEffect(() => {
    // Create a map of event names
    const eventMap = new Map<number, string>();
    events.forEach(event => {
      eventMap.set(event.id, event.name);
    });
    
    // Count leads by event
    const leadCounts = new Map<number, number>();
    leads.forEach(lead => {
      const count = leadCounts.get(lead.eventId) || 0;
      leadCounts.set(lead.eventId, count + 1);
    });
    
    // Format data for the chart
    const data = Array.from(leadCounts.entries()).map(([eventId, count]) => ({
      name: eventMap.get(eventId) || `Event #${eventId}`,
      value: count,
    }));
    
    setChartData(data);
  }, [events, leads]);
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsBarChart
        data={chartData}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="name" 
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => {
            // Truncate long event names
            return value.length > 15 ? `${value.substring(0, 12)}...` : value;
          }}
        />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="value" name="Leads" fill={COLORS.primary} />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
