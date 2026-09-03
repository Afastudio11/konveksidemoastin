import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";

import AdminLayout from "@/components/admin/AdminLayout";
import { FilterSection, DateFilterType } from "@/components/dashboard/filter-section";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { MonthlyLeadGrowthChart } from "@/components/dashboard/monthly-lead-growth-chart";
import { LeadsByStatusChart } from "@/components/dashboard/leads-by-status-chart";
import { AnalyticsSection } from "@/components/dashboard/analytics-section";
import { OrdersTable } from "@/components/dashboard/orders-table";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function AdminDashboard() {
  const { token } = useAuth();
  const [filterType, setFilterType] = useState<DateFilterType>("all");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  const filterParams: Record<string, string> = {};
  if (filterType === "this_month") {
    const now = new Date();
    filterParams.month = String(now.getMonth() + 1);
    filterParams.year = String(now.getFullYear());
  } else if (filterType === "today") {
    const todayStr = format(new Date(), "yyyy-MM-dd");
    filterParams.startDate = todayStr;
    filterParams.endDate = todayStr;
  } else if (filterType === "custom" && startDate && endDate) {
    filterParams.startDate = format(startDate, "yyyy-MM-dd");
    filterParams.endDate = format(endDate, "yyyy-MM-dd");
  }

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-stats", filterParams],
    queryFn: () => api.dashboard.stats(token!, filterParams),
    enabled: !!token,
  });

  const { data: recentOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ["recent-orders", filterParams],
    queryFn: () => api.dashboard.recentOrders(token!, filterParams),
    enabled: !!token,
  });

  const { data: productAnalytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["product-analytics", filterParams],
    queryFn: () => api.dashboard.productAnalytics(token!, filterParams),
    enabled: !!token,
  });

  const { data: productionOverview, isLoading: productionLoading } = useQuery({
    queryKey: ["production-overview", filterParams],
    queryFn: () => api.dashboard.productionOverview(token!, filterParams),
    enabled: !!token,
  });

  const exportExcel = useMutation({
    mutationFn: () => api.dashboard.exportExcel(token!, filterParams),
    onSuccess: () => toast.success("Export Excel berhasil diunduh!"),
    onError: () => toast.error("Gagal melakukan export Excel."),
  });

  const exportPdf = useMutation({
    mutationFn: () => api.dashboard.exportPdf(token!, filterParams),
    onSuccess: () => toast.success("Export PDF berhasil diunduh!"),
    onError: () => toast.error("Gagal melakukan export PDF."),
  });

  const totalOrders = Number(stats?.totalOrders || 0);
  const completedOrders = Number(stats?.completedOrders || 0);
  const activeOrders = Number(stats?.activeOrders || 0);
  const monthlyRevenue = Number(stats?.monthlyRevenue || 0);
  const totalOmzet = Number(
    (filterType === "all" ? stats?.totalOmzetAllTime : stats?.totalOmzet) ||
      stats?.totalOmzetAllTime ||
      stats?.totalOmzet ||
      0
  );

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6 w-full">
        {/* Filter & Actions Bar - Square UI Leads */}
        <FilterSection
          filterType={filterType}
          onFilterChange={(type) => {
            setFilterType(type);
            if (type !== "custom") {
              setStartDate(undefined);
              setEndDate(undefined);
            }
          }}
          startDate={startDate}
          endDate={endDate}
          onDateRangeChange={(start, end) => {
            setStartDate(start);
            setEndDate(end);
          }}
          onExportExcel={() => exportExcel.mutate()}
          onExportPdf={() => exportPdf.mutate()}
          isExportingExcel={exportExcel.isPending}
          isExportingPdf={exportPdf.isPending}
        />

        {/* Stats Cards - Square UI 4-column divider layout */}
        <StatsCards
          totalOmzet={totalOmzet}
          activeOrders={activeOrders}
          monthlyRevenue={monthlyRevenue}
          completedOrders={completedOrders}
          totalOrders={totalOrders}
          isLoading={statsLoading}
        />

        {/* Charts Row - Square UI Leads Layout */}
        <div className="flex flex-col xl:flex-row gap-4 sm:gap-6 w-full items-stretch">
          <MonthlyLeadGrowthChart
            monthlyRevenue={monthlyRevenue}
            totalOrders={totalOrders}
          />
          <LeadsByStatusChart
            statusCounts={productionOverview?.statusCounts}
            isLoading={productionLoading}
          />
        </div>

        {/* Product, Category & Color Analytics - Square UI Card styling */}
        <AnalyticsSection
          productSales={productAnalytics?.productSales}
          productCategorySales={productAnalytics?.productCategorySales}
          colorSales={productAnalytics?.colorSales}
          isLoading={analyticsLoading}
        />

        {/* Orders Table - Square UI LeadsTable styling */}
        <OrdersTable
          orders={recentOrders?.orders}
          isLoading={ordersLoading}
        />
      </div>
    </AdminLayout>
  );
}
