import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AuthProvider, useAuth } from "@/lib/auth";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Tracking from "./pages/Tracking";
import Payment from "./pages/Payment";
import Order from "./pages/Order";
import AdminLogin from "./pages/admin/Login";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminOrders from "./pages/admin/Orders";
import AdminOrderDetail from "./pages/admin/OrderDetail";
import AdminNewOrder from "./pages/admin/NewOrder";
import AdminCustomers from "./pages/admin/Customers";
import AdminExpenses from "./pages/admin/Expenses";
import AdminSettings from "./pages/admin/Settings";
import AdminActivityLogs from "./pages/admin/ActivityLogs";
import AdminUserManagement from "./pages/admin/UserManagement";
import AdminInventory from "./pages/admin/Inventory";

const FinancialReports = lazy(() => import("./pages/admin/FinancialReports"));

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <FloatingWhatsApp />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/track" element={<Tracking />} />
            <Route path="/track/:trackingCode" element={<Tracking />} />
            <Route path="/tracking" element={<Tracking />} />
            <Route path="/tracking/:trackingCode" element={<Tracking />} />
            <Route path="/order" element={<Order />} />
            <Route path="/pesan" element={<Order />} />
            <Route path="/pay" element={<Payment />} />
            <Route path="/pay/:trackingCode" element={<Payment />} />
            
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/orders"
              element={
                <ProtectedRoute>
                  <AdminOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/orders/new"
              element={
                <ProtectedRoute>
                  <AdminNewOrder />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/orders/:id"
              element={
                <ProtectedRoute>
                  <AdminOrderDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/customers"
              element={
                <ProtectedRoute>
                  <AdminCustomers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/expenses"
              element={
                <ProtectedRoute>
                  <AdminExpenses />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/inventory"
              element={
                <ProtectedRoute>
                  <AdminInventory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/financial-reports"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>}>
                    <FinancialReports />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute>
                  <AdminSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/activity-logs"
              element={
                <ProtectedRoute>
                  <AdminActivityLogs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute>
                  <AdminUserManagement />
                </ProtectedRoute>
              }
            />
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
