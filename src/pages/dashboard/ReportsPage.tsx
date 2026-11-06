import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Line,
  ComposedChart,
} from 'recharts';
import {
  FileText,
  Banknote,
  TrendingUp,
  CheckCircle,
  XCircle,
  Calendar,
  Layers,
} from 'lucide-react';
import { useCustomerOrder } from '../../context/CustomerOrderContext';
import { formatPrice } from '../../utils/pricing';
import { Card } from '../../components/ui/Card';

export default function ReportsPage() {
  const { orders, dailyStats } = useCustomerOrder();

  // Dynamically compute real weekly revenue & jobs from actual orders
  const weeklyData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const result = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dayName = days[d.getDay()];
      const dayOrders = orders.filter((o) => {
        const od = new Date(o.createdAt);
        return od.toDateString() === d.toDateString() && o.status !== 'cancelled';
      });
      const rev = dayOrders.reduce((sum, o) => sum + o.price, 0);
      result.push({
        day: dayName,
        revenue: rev,
        jobs: dayOrders.length,
      });
    }
    return result;
  }, [orders]);

  // Dynamically compute real status breakdown
  const statusCounts = useMemo(() => {
    const queued = orders.filter((o) => o.status === 'queued').length;
    const printing = orders.filter((o) => o.status === 'printing').length;
    const ready = orders.filter((o) => o.status === 'ready').length;
    const collected = orders.filter((o) => o.status === 'collected').length;
    const cancelled = orders.filter((o) => o.status === 'cancelled').length;

    return [
      { status: 'Queued (Awaiting Spool)', count: queued, color: '#3b82f6' },
      { status: 'Printing in Progress', count: printing, color: '#f59e0b' },
      { status: 'Ready for Counter Pickup', count: ready, color: '#10b981' },
      { status: 'Collected & Paid', count: collected, color: '#8b5cf6' },
      { status: 'Cancelled', count: cancelled, color: '#ef4444' },
    ];
  }, [orders]);

  const summary = [
    {
      label: 'Total Orders Spooled',
      value: (dailyStats?.totalJobs ?? orders.length).toString(),
      icon: FileText,
      color: 'text-blue-500 bg-blue-500/10',
    },
    {
      label: 'Gross Daily Revenue',
      value: formatPrice(dailyStats?.revenue ?? 0),
      icon: Banknote,
      color: 'text-emerald-500 bg-emerald-500/10',
    },
    {
      label: 'Average Order Value',
      value: formatPrice(dailyStats?.averageOrder ?? 0),
      icon: TrendingUp,
      color: 'text-amber-500 bg-amber-500/10',
    },
    {
      label: 'Collected & Picked',
      value: (dailyStats?.completed ?? 0).toString(),
      icon: CheckCircle,
      color: 'text-purple-500 bg-purple-500/10',
    },
    {
      label: 'Cancelled / Abandoned',
      value: (dailyStats?.cancelled ?? 0).toString(),
      icon: XCircle,
      color: 'text-red-500 bg-red-500/10',
    },
  ];

  const totalStatusCount = orders.length || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Shop Performance Analytics
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            End-of-day revenue reconciliation and weekly job distribution reports.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-card border border-border text-xs font-semibold">
          <Calendar className="w-3.5 h-3.5 text-primary" />
          <span>Today: {new Date().toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {summary.map((card, i) => {
          const Icon = card.icon;
          return (
            <Card key={i} className="p-4 border-border/80 shadow-subtle">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-muted-foreground truncate">
                  {card.label}
                </span>
                <div className={`p-2 rounded-xl ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-foreground tabular-nums">
                {card.value}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Chart Section */}
      <Card className="p-6 border-border/80 shadow-subtle space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-foreground">
              Weekly Revenue & Print Volume (Monday – Sunday)
            </h3>
            <p className="text-xs text-muted-foreground">
              Bar: Total PKR Revenue • Line: Number of customer print jobs
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-primary">
              <span className="w-2.5 h-2.5 rounded-sm bg-primary" /> Revenue (PKR)
            </span>
            <span className="flex items-center gap-1.5 text-emerald-500">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Jobs Count
            </span>
          </div>
        </div>

        <div className="w-full h-72 pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} />
              <YAxis
                yAxisId="left"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                tickFormatter={(v) => `Rs.${v}`}
              />
              <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: 12,
                  fontSize: 12,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                }}
              />
              <Bar yAxisId="left" dataKey="revenue" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="jobs" stroke="#34C759" strokeWidth={3} dot={{ r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Status Breakdown Section */}
      <Card className="p-6 border-border/80 shadow-subtle space-y-4">
        <h3 className="text-base font-bold text-foreground">
          Queue Distribution Status
        </h3>

        <div className="space-y-3">
          {statusCounts.map((item) => {
            const pct = Math.round((item.count / totalStatusCount) * 100);
            return (
              <div key={item.status} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-foreground">{item.status}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {item.count} jobs ({pct}%)
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${pct}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
