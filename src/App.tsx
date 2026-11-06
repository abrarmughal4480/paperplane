import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { CustomerOrderProvider } from './context/CustomerOrderContext';
import { CustomerLayout } from './pages/customer/CustomerLayout';
import { UploadPage } from './pages/customer/UploadPage';
import { PreviewPage } from './pages/customer/PreviewPage';
import { SettingsPage } from './pages/customer/SettingsPage';
import { ConfirmPage } from './pages/customer/ConfirmPage';
import { TokenPage } from './pages/customer/TokenPage';
import { StatusPage } from './pages/customer/StatusPage';
import DashboardLayout from './pages/dashboard/DashboardLayout';
import DashboardHome from './pages/dashboard/DashboardHome';
import QueuePage from './pages/dashboard/QueuePage';
import PricingPage from './pages/dashboard/PricingPage';
import OrdersPage from './pages/dashboard/OrdersPage';
import ReportsPage from './pages/dashboard/ReportsPage';
import PrinterPage from './pages/dashboard/PrinterPage';
import DashboardSettingsPage from './pages/dashboard/SettingsPage';

function App() {
  return (
    <ThemeProvider>
      <CustomerOrderProvider>
        <Routes>
          {/* Customer Routes (Mobile-first QR Flow) */}
          <Route path="/customer/*" element={<CustomerLayout />}>
            <Route index element={<Navigate to="upload" replace />} />
            <Route path="upload" element={<UploadPage />} />
            <Route path="preview" element={<PreviewPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="confirm" element={<ConfirmPage />} />
            <Route path="token" element={<TokenPage />} />
            <Route path="status" element={<StatusPage />} />
          </Route>

          {/* Dashboard Routes (Desktop-optimized Shopkeeper POS) */}
          <Route path="/dashboard/*" element={<DashboardLayout />}>
            <Route index element={<DashboardHome />} />
            <Route path="queue" element={<QueuePage />} />
            <Route path="pricing" element={<PricingPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="printer" element={<PrinterPage />} />
            <Route path="settings" element={<DashboardSettingsPage />} />
          </Route>

          {/* Default redirect to customer upload */}
          <Route path="/" element={<Navigate to="/customer/upload" replace />} />
          <Route path="*" element={<Navigate to="/customer/upload" replace />} />
        </Routes>
      </CustomerOrderProvider>
    </ThemeProvider>
  );
}

export default App;
