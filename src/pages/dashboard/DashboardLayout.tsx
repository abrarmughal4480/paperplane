import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ListOrdered,
  DollarSign,
  FileStack,
  BarChart3,
  Printer,
  Settings,
  LogOut,
  Menu,
  X,
  QrCode,
  ShieldCheck,
  Smartphone,
  ChevronRight,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { cn } from '../../utils/cn';
import { mockDailyStats } from '../../data/mockData';
import { useCustomerOrder } from '../../context/CustomerOrderContext';
import { Modal } from '../../components/ui/Modal';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Overview', end: true },
  { to: '/dashboard/queue', icon: ListOrdered, label: 'Print Queue', end: false, badge: '5' },
  { to: '/dashboard/pricing', icon: DollarSign, label: 'Pricing Matrix', end: false },
  { to: '/dashboard/orders', icon: FileStack, label: 'Order Archive', end: false },
  { to: '/dashboard/reports', icon: BarChart3, label: 'Analytics', end: false },
  { to: '/dashboard/printer', icon: Printer, label: 'Printers', end: false, dot: true },
  { to: '/dashboard/settings', icon: Settings, label: 'Shop Settings', end: false },
];

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [networkInfo, setNetworkInfo] = useState<{
    lanIp: string;
    port: number;
    customerUrl: string;
    qrCodeDataUrl: string;
  } | null>(null);

  const location = useLocation();
  // Navbar is dynamic: shop name + live queue count come from the store
  // (Dashboard → Shop Settings edits the name; the queue badge counts
  // real queued orders instead of a hardcoded "5").
  const { shopConfig, orders } = useCustomerOrder();
  const queuedCount = orders.filter((o) => o.status === 'queued').length;

  useEffect(() => {
    fetch('/api/network-info')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setNetworkInfo(data);
      })
      .catch(() => {});
  }, []);

  const handleCopyLink = () => {
    const url = networkInfo?.customerUrl || `${window.location.origin}/customer/upload`;
    navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex transition-colors duration-200">
      {/* Mobile Top Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-card/90 backdrop-blur-md border-b border-border/80 px-4 flex items-center justify-between z-40">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-lg text-foreground hover:bg-muted"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <img
              src="/paperplane-logo-mark.png"
              alt="PaperPlane logo"
              className="w-7 h-7 rounded-lg shadow-subtle object-cover bg-white"
            />
            <span className="font-bold text-sm font-display">PaperPlane</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            to="/customer/upload"
            className="p-1.5 rounded-lg text-primary bg-primary/10 hover:bg-primary/20"
            title="Customer View"
          >
            <QrCode className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 w-64 bg-card border-r border-border/80 flex flex-col z-50 transition-transform duration-300 md:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-border/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/paperplane-logo-mark.png"
              alt="PaperPlane logo"
              className="w-9 h-9 rounded-xl shadow-subtle object-cover bg-white"
            />
            <div>
              <div className="text-sm font-bold tracking-tight font-display">PaperPlane POS</div>
              <div className="text-[11px] text-muted-foreground truncate max-w-[130px]">
                {shopConfig.name}
              </div>
            </div>
          </div>

          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Counter QR Code Quick Launcher Card */}
        <div className="p-3">
          <button
            type="button"
            onClick={() => setShowQrModal(true)}
            className="w-full p-2.5 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/25 hover:border-primary/40 flex items-center justify-between text-left transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-xs">
                <QrCode className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">Counter QR Code</p>
                <p className="text-[10px] text-muted-foreground">Scan to upload</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-primary group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <item.icon
                      className={cn(
                        'w-4 h-4 transition-transform group-hover:scale-110',
                        isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'
                      )}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.to === '/dashboard/queue' ? (
                    queuedCount > 0 && (
                      <span
                        className={cn(
                          'text-[10px] px-1.5 py-0.5 rounded-full font-bold tabular-nums',
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-primary/10 text-primary'
                        )}
                      >
                        {queuedCount}
                      </span>
                    )
                  ) : (
                    item.badge && (
                      <span
                        className={cn(
                          'text-[10px] px-1.5 py-0.5 rounded-full font-bold tabular-nums',
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-primary/10 text-primary'
                        )}
                      >
                        {item.badge}
                      </span>
                    )
                  )}

                  {item.dot && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom Station Status & Profile */}
        <div className="p-3 border-t border-border/70 space-y-3 bg-muted/20">
          {/* Theme switcher */}
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-medium text-muted-foreground">Appearance</span>
            <ThemeToggle />
          </div>

          {/* Shop Status & Switcher Link */}
          <div className="p-2.5 rounded-xl bg-card border border-border/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <div>
                <p className="text-xs font-bold leading-tight">Counter Live</p>
                <p className="text-[10px] text-muted-foreground font-mono">
                  {networkInfo?.lanIp ? `${networkInfo.lanIp}:${networkInfo.port || 5000}` : 'Local Station'}
                </p>
              </div>
            </div>

            <Link
              to="/customer/upload"
              target="_blank"
              className="p-1 rounded-md text-primary hover:bg-primary/10 transition-colors"
              title="Open Customer QR Page in New Tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 p-4 sm:p-6 lg:p-8 pt-18 md:pt-8 min-h-screen">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Counter QR Code Standee Modal Popup — shared Modal shell */}
      <Modal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        title="Counter QR Code"
        subtitle={`${shopConfig.name} — scan to upload over local Wi-Fi`}
        footer={
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex-1 py-2.5 px-3 rounded-xl border border-border text-foreground hover:bg-muted text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Link Copied!' : 'Copy Wi-Fi URL'}</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="py-2.5 px-3.5 rounded-xl border border-border text-foreground hover:bg-muted text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              title="Print standee for counter"
            >
              <Printer className="w-4 h-4" />
              <span>Print Standee</span>
            </button>

            <Link
              to="/customer/upload"
              target="_blank"
              className="py-2.5 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 text-center flex items-center justify-center gap-1.5 shadow-xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Test</span>
            </Link>
          </div>
        }
      >
        <div className="p-6 space-y-5 text-center">
          {/* High-Contrast Scan Frame */}
          <div className="relative mx-auto inline-block p-5 bg-white rounded-2xl shadow-subtle border-2 border-zinc-200 dark:border-zinc-700">
            {/* Corner scan viewfinder brackets */}
            <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-primary rounded-tl-sm pointer-events-none" />
            <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-primary rounded-tr-sm pointer-events-none" />
            <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-primary rounded-bl-sm pointer-events-none" />
            <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-primary rounded-br-sm pointer-events-none" />

            {networkInfo?.qrCodeDataUrl ? (
              <img
                src={networkInfo.qrCodeDataUrl}
                alt="Counter Wi-Fi QR Code"
                className="w-56 h-56 mx-auto object-contain select-none"
                loading="eager"
              />
            ) : (
              <div className="w-56 h-56 flex flex-col items-center justify-center space-y-2 bg-zinc-50 rounded-xl">
                <QrCode className="w-12 h-12 text-primary animate-pulse" />
                <span className="text-[11px] text-zinc-500 font-medium">Generating Wi-Fi QR...</span>
              </div>
            )}
          </div>

          {/* Direct Network Link (Strictly LAN Wi-Fi IP, Zero localhost) */}
          <div className="space-y-2">
            <div className="p-3 rounded-2xl bg-muted/40 border border-border/80 text-left space-y-1">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground font-semibold">
                <span className="flex items-center gap-1.5 text-foreground">
                  <Smartphone className="w-3.5 h-3.5 text-primary" />
                  Direct Mobile Link
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                  Wi-Fi Active
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-mono font-bold text-primary break-all">
                  {networkInfo?.customerUrl || `http://${networkInfo?.lanIp || '10.116.63.104'}:${networkInfo?.port || 5000}/customer/upload`}
                </p>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="p-1.5 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground shrink-0 transition-colors cursor-pointer"
                  title="Copy Link"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* 3 Step Guide Badge */}
            <div className="grid grid-cols-3 gap-2 text-[10px] font-semibold text-muted-foreground pt-1">
              <div className="p-2 rounded-xl bg-card border border-border/60">
                <span className="block font-bold text-foreground">1. Connect</span>
                Shop Wi-Fi
              </div>
              <div className="p-2 rounded-xl bg-card border border-border/60">
                <span className="block font-bold text-foreground">2. Scan</span>
                Phone Camera
              </div>
              <div className="p-2 rounded-xl bg-card border border-border/60">
                <span className="block font-bold text-foreground">3. Upload</span>
                Instant Token
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
