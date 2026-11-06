import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  Banknote,
  Printer,
  Package,
  CheckCircle,
  TrendingUp,
  ArrowRight,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { defaultPrinter } from '../../data/mockData';
import { useCustomerOrder } from '../../context/CustomerOrderContext';
import { formatPrice } from '../../utils/pricing';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export default function DashboardHome() {
  const navigate = useNavigate();
  const { orders, dailyStats } = useCustomerOrder();
  const currentOrders = orders;

  const recentOrders = [...currentOrders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const kpis = [
    {
      label: "Today's Jobs",
      value: (dailyStats?.totalJobs ?? currentOrders.length).toString(),
      trend: `${currentOrders.length} incoming total`,
      icon: FileText,
      color: 'text-blue-500 bg-blue-500/10',
    },
    {
      label: 'Gross Revenue',
      value: formatPrice(dailyStats?.revenue ?? 0),
      trend: 'PKR sales recorded',
      icon: Banknote,
      color: 'text-emerald-500 bg-emerald-500/10',
    },
    {
      label: 'Currently Printing',
      value: (dailyStats?.printing ?? 0).toString(),
      trend: 'Active on printer',
      icon: Printer,
      color: 'text-primary bg-primary/10',
    },
    {
      label: 'Ready for Pickup',
      value: (dailyStats?.ready ?? 0).toString(),
      trend: 'Waiting at counter',
      icon: Package,
      color: 'text-amber-500 bg-amber-500/10',
    },
    {
      label: 'Completed & Paid',
      value: (dailyStats?.completed ?? 0).toString(),
      trend: 'Archived today',
      icon: CheckCircle,
      color: 'text-purple-500 bg-purple-500/10',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              Counter Dashboard
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              POS Live
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time file intake, printer queue spooler and daily PKR sales tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/dashboard/queue">
            <Button variant="primary" size="md" className="gap-2">
              <Printer className="w-4 h-4" />
              <span>Open Print Queue</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <Card
              key={idx}
              className="p-4 relative overflow-hidden hover:shadow-elevation transition-all duration-200 border-border/80"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-muted-foreground truncate">
                  {kpi.label}
                </span>
                <div className={`p-2 rounded-xl ${kpi.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="text-2xl font-black tracking-tight text-foreground tabular-nums">
                {kpi.value}
              </div>

              <p className="text-[10px] text-muted-foreground/80 mt-1 truncate">
                {kpi.trend}
              </p>
            </Card>
          );
        })}
      </div>

      {/* Main Grid: Live Queue Table + Station Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live Queue Spotlight */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-foreground">
                Incoming Customer Jobs
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                {recentOrders.length}
              </span>
            </div>

            <Link
              to="/dashboard/queue"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-primary/40 bg-primary/10 text-xs font-bold text-primary hover:bg-primary/20"
            >
              View Full Queue <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <Card className="overflow-hidden border-border/80 shadow-subtle">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b border-border/60 text-muted-foreground uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3.5 pl-4 font-bold">Token</th>
                    <th className="p-3.5 font-bold">Customer</th>
                    <th className="p-3.5 font-bold">Document</th>
                    <th className="p-3.5 font-bold">Settings</th>
                    <th className="p-3.5 font-bold text-right">Price</th>
                    <th className="p-3.5 pr-4 font-bold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <FileText className="w-8 h-8 opacity-40 text-muted-foreground" />
                          <p className="text-xs font-semibold text-foreground">No print jobs in queue right now</p>
                          <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
                            Customer orders will arrive in real-time when scanned from the counter QR code over Wi-Fi.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    recentOrders.map((order) => (
                      <tr
                        key={order.id}
                        onClick={() => navigate('/dashboard/queue')}
                        title="Open print queue"
                        className="hover:bg-muted/30 transition-colors cursor-pointer group"
                      >
                        <td className="p-3.5 pl-4 font-mono font-bold text-primary group-hover:underline">
                          {order.token}
                        </td>
                        <td className="p-3.5 font-semibold text-foreground">
                          {order.customerName}
                        </td>
                        <td className="p-3.5 text-muted-foreground truncate max-w-[130px]">
                          {order.document.fileName}
                        </td>
                        <td className="p-3.5 text-muted-foreground text-[11px]">
                          {order.settings.copies}x · {order.settings.colorMode.toUpperCase()} ·{' '}
                          {order.settings.paperSize.toUpperCase()}
                        </td>
                        <td className="p-3.5 text-right font-bold tabular-nums text-foreground">
                          {formatPrice(order.price)}
                        </td>
                        <td className="p-3.5 pr-4 text-right">
                          <StatusBadge status={order.status} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right 1 Col: Station & Hardware Health */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-foreground">
            Station Status
          </h2>

          <Card className="p-5 space-y-4 border-border/80 shadow-subtle">
            {/* Printer widget */}
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">{defaultPrinter.model}</h4>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    ● Online & Spooling
                  </p>
                </div>
              </div>
              <Link to="/dashboard/printer" className="inline-flex items-center px-2.5 py-1.5 rounded-lg border border-primary/40 bg-primary/10 text-xs font-bold text-primary hover:bg-primary/20">
                Manage
              </Link>
            </div>

            {/* Paper & Toner gauges */}
            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between text-muted-foreground mb-1">
                  <span>Paper Tray Level</span>
                  <span className="font-bold text-foreground">{defaultPrinter.paperLevel}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full"
                    style={{ width: `${defaultPrinter.paperLevel}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-muted-foreground mb-1">
                  <span>Black Toner Cartridge</span>
                  <span className="font-bold text-foreground">{defaultPrinter.tonerLevel}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full"
                    style={{ width: `${defaultPrinter.tonerLevel}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Counter QR Link */}
            <div className="pt-2">
              <Link
                to="/customer/upload"
                target="_blank"
                className="w-full p-2.5 rounded-xl bg-muted/60 hover:bg-muted text-xs font-semibold text-foreground flex items-center justify-between transition-colors border border-border/60"
              >
                <span>Launch Counter Customer WebApp</span>
                <ExternalLink className="w-3.5 h-3.5 text-primary" />
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
