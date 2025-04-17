import { MobileHeader } from "@/components/mobile-header";
import { MobileNav } from "@/components/mobile-nav";
import { QuickStats } from "@/components/dashboard/quick-stats";
import { EventsSection } from "@/components/dashboard/events-section";
import { LeadsSection } from "@/components/dashboard/leads-section";
import { AnalyticsSection } from "@/components/dashboard/analytics-section";

export default function DashboardPage() {
  return (
    <div className="flex flex-col h-screen">
      <MobileHeader title="BoothBound" />
      
      <main className="flex-1 pb-16 md:pb-0 overflow-y-auto">
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
            
            {/* Quick Stats Cards */}
            <QuickStats />
            
            {/* Events Section */}
            <EventsSection />
            
            {/* Leads Section */}
            <LeadsSection />
            
            {/* Analytics Section */}
            <AnalyticsSection />
          </div>
        </div>
      </main>
      
      <MobileNav />
    </div>
  );
}
