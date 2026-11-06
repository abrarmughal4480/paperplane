import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShieldCheck, Printer } from 'lucide-react';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { useCustomerOrder } from '../../context/CustomerOrderContext';

export function CustomerLayout() {
  const location = useLocation();
  const isUpload = location.pathname.endsWith('/upload');
  // Navbar is dynamic: shop name comes from Shop Settings
  // (Dashboard → Shop Settings → Shop Name), not hardcoded text.
  const { shopConfig } = useCustomerOrder();
  const shopName = shopConfig.name || 'PaperPlane Print Shop';

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
      {/* Top Ambient Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-card/80 backdrop-blur-md">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
          {/* Brand — real PaperPlane logo (v5 PNG), shop name in Poppins wordmark */}
          <Link to="/customer/upload" className="flex items-center gap-2.5 text-foreground hover:opacity-90">
            <img
              src="/paperplane-logo-mark.png"
              alt="PaperPlane logo"
              className="w-8 h-8 rounded-xl shadow-subtle object-cover bg-white"
            />
            <div>
              <div className="text-sm font-bold tracking-tight leading-tight font-display">{shopName}</div>
              <div className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                Counter Online
              </div>
            </div>
          </Link>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-primary/60 bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
              title="Switch to POS Dashboard"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">POS</span> ↗
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-md mx-auto px-4 pb-16 pt-3">
        <Outlet />
      </main>

      {/* Mobile Footer Privacy Banner */}
      <footer className="max-w-md mx-auto px-4 pb-8 text-center">
        <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/80 bg-muted/40 px-3 py-1.5 rounded-full border border-border/40">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Files are automatically shredded post-printing</span>
        </div>
      </footer>
    </div>
  );
}
