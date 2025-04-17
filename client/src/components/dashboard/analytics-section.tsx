import { BarChart, PieChart, BarChart3, PieChart as PieChartIcon } from "lucide-react";

export function AnalyticsSection() {
  return (
    <div className="mt-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">Lead Analytics</h2>
        <a href="/analytics" className="text-sm font-medium text-primary hover:text-primary-600">
          View detailed analytics
        </a>
      </div>
      
      <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-base font-medium text-gray-900">Leads by Event</h3>
          <div className="mt-2 h-64 bg-gray-50 rounded-md flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">Bar Chart: Leads by Event</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-base font-medium text-gray-900">Lead Quality Distribution</h3>
          <div className="mt-2 h-64 bg-gray-50 rounded-md flex items-center justify-center">
            <div className="text-center">
              <PieChartIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">Pie Chart: Lead Quality</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
