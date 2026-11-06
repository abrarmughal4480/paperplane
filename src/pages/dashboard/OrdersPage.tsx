import React, { useState, useMemo } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
  Calendar,
  Banknote,
  Smartphone,
  Eye,
} from 'lucide-react';
import {
  type Order,
  type OrderStatus,
  type PaymentMethod,
} from '../../data/mockData';
import { useCustomerOrder } from '../../context/CustomerOrderContext';
import { formatPrice } from '../../utils/pricing';
import { Card } from '../../components/ui/Card';
import { StatusBadge, Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

const PAGE_SIZE = 8;

export default function OrdersPage() {
  const { orders } = useCustomerOrder();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const sortedOrders = useMemo(() => {
    return [...orders].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [orders]);

  const filtered = useMemo(() => {
    return sortedOrders.filter((o) => {
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      if (paymentFilter !== 'all' && o.paymentMethod !== paymentFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          o.token.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.document.fileName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [sortedOrders, search, statusFilter, paymentFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // Real CSV export of the currently filtered orders (was a dead button).
  const handleExportCsv = () => {
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const header = ['Token', 'Customer', 'File', 'Pages', 'Copies', 'Status', 'Payment', 'Price (PKR)', 'Created'];
    const rows = filtered.map((o) => [
      esc(o.token),
      esc(o.customerName),
      esc(o.document.fileName),
      o.document.pageCount,
      o.settings.copies,
      esc(o.status),
      esc(o.paymentMethod),
      o.price,
      esc(new Date(o.createdAt).toISOString()),
    ].join(','));
    const csv = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `paperplane-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Print Order Archive
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Audit trail of completed, collected and cancelled photocopy counter jobs.
          </p>
        </div>

        <Button variant="outline" size="sm" className="gap-2" onClick={handleExportCsv}>
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV</span>
        </Button>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by customer, token, document..."
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-card border border-border/80 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary shadow-subtle"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-3 py-2 rounded-xl text-xs bg-card border border-border/80 text-foreground focus:ring-2 focus:ring-primary shadow-subtle cursor-pointer"
        >
          <option value="all">All Statuses</option>
          <option value="queued">Queued</option>
          <option value="printing">Printing</option>
          <option value="ready">Ready</option>
          <option value="collected">Collected</option>
          <option value="cancelled">Cancelled</option>
        </select>

        {/* Payment Filter */}
        <select
          value={paymentFilter}
          onChange={(e) => {
            setPaymentFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-3 py-2 rounded-xl text-xs bg-card border border-border/80 text-foreground focus:ring-2 focus:ring-primary shadow-subtle cursor-pointer"
        >
          <option value="all">All Payments</option>
          <option value="cash">Cash at Counter</option>
          <option value="jazzcash">JazzCash</option>
          <option value="easypaisa">Easypaisa</option>
        </select>
      </div>

      {/* Table */}
      <Card className="overflow-hidden border-border/80 shadow-subtle">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border/60 text-muted-foreground uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3.5 pl-4 font-bold">Token</th>
                <th className="p-3.5 font-bold">Customer</th>
                <th className="p-3.5 font-bold">Document</th>
                <th className="p-3.5 font-bold">Date & Time</th>
                <th className="p-3.5 font-bold text-right">Price</th>
                <th className="p-3.5 font-bold text-center">Payment</th>
                <th className="p-3.5 pr-4 font-bold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-muted-foreground">
                    No orders match your filter criteria.
                  </td>
                </tr>
              ) : (
                paginated.map((order) => (
                  <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3.5 pl-4 font-mono font-bold text-primary">
                      {order.token}
                    </td>
                    <td className="p-3.5 font-semibold text-foreground">
                      {order.customerName}
                    </td>
                    <td className="p-3.5 text-muted-foreground truncate max-w-[180px]">
                      {order.documents && order.documents.length > 1
                        ? `${order.documents.length} Files (${order.document.fileName} +${order.documents.length - 1})`
                        : order.document.fileName}
                    </td>
                    <td className="p-3.5 text-muted-foreground tabular-nums text-[11px]">
                      {new Date(order.createdAt).toLocaleDateString()} • {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-3.5 text-right font-bold tabular-nums text-foreground">
                      {formatPrice(order.price)}
                    </td>
                    <td className="p-3.5 text-center">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-muted text-foreground capitalize">
                        {order.paymentMethod === 'cash' ? (
                          <Banknote className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Smartphone className="w-3 h-3 text-primary" />
                        )}
                        {order.paymentMethod}
                      </span>
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

        {/* Pagination Footer */}
        <div className="p-4 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Showing <strong className="text-foreground">{paginated.length}</strong> of{' '}
            <strong className="text-foreground">{filtered.length}</strong> orders
          </span>

          <div className="flex items-center gap-1.5">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-border text-foreground hover:bg-muted disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-semibold text-foreground tabular-nums">
              Page {currentPage} of {totalPages}
            </span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-border text-foreground hover:bg-muted disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
