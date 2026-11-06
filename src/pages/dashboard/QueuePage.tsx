import React, { useState, useCallback } from 'react';
import {
  Search,
  Loader2,
  Printer,
  Eye,
  Edit2,
  XCircle,
  CheckCircle2,
  Filter,
  Check,
} from 'lucide-react';
import { mockOrders, type Order, type OrderStatus } from '../../data/mockData';
import { useCustomerOrder } from '../../context/CustomerOrderContext';
import { formatPrice } from '../../utils/pricing';
import JobDetailModal from './JobDetailModal';
import { StatusBadge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

const tabs: { label: string; value: OrderStatus | 'all' }[] = [
  { label: 'All Jobs', value: 'all' },
  { label: 'Queued', value: 'queued' },
  { label: 'Printing', value: 'printing' },
  { label: 'Ready for Pickup', value: 'ready' },
  { label: 'Collected', value: 'collected' },
];

export default function QueuePage() {
  const {
    orders,
    updateExistingOrderStatus,
    updateExistingOrder,
  } = useCustomerOrder();

  const [activeTab, setActiveTab] = useState<OrderStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleStatusChange = useCallback(
    (order: Order, newStatus: OrderStatus) => {
      updateExistingOrderStatus(order.id, newStatus);
      showToast(`${order.token} marked as ${newStatus}`);
    },
    [updateExistingOrderStatus, showToast]
  );

  const filteredOrders = orders.filter((o) => {
    if (activeTab !== 'all' && o.status !== activeTab) return false;
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Print Queue Management
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Monitor real-time incoming documents, spool print jobs, and mark pickups.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search token, customer, file..."
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-card border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-subtle"
          />
        </div>
      </div>

      {/* Filter Tabs with Dynamic Counts */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 select-none">
        {tabs.map((tab) => {
          const count =
            tab.value === 'all'
              ? orders.length
              : orders.filter((o) => o.status === tab.value).length;
          const isActive = activeTab === tab.value;

          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-card border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold tabular-nums ${
                  isActive ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* High-Density POS Table */}
      <Card className="overflow-hidden border-border/80 shadow-subtle">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border/60 text-muted-foreground uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3.5 pl-4 font-bold">Token</th>
                <th className="p-3.5 font-bold">Customer</th>
                <th className="p-3.5 font-bold">Document</th>
                <th className="p-3.5 font-bold text-center">Pages</th>
                <th className="p-3.5 font-bold">Settings</th>
                <th className="p-3.5 font-bold text-right">Price</th>
                <th className="p-3.5 font-bold text-center">Status</th>
                <th className="p-3.5 pr-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-muted-foreground">
                    No orders match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className="hover:bg-muted/30 transition-colors cursor-pointer group"
                  >
                    <td className="p-3.5 pl-4 font-mono font-bold text-primary group-hover:underline">
                      {order.token}
                    </td>
                    <td className="p-3.5 font-semibold text-foreground">
                      {order.customerName}
                    </td>
                    <td className="p-3.5 text-muted-foreground truncate max-w-[180px]">
                      {order.documents && order.documents.length > 1 ? (
                        <span className="font-semibold text-foreground">
                          {order.documents.length} Files{' '}
                          <span className="text-[10px] text-muted-foreground">({order.document.fileName} +{order.documents.length - 1})</span>
                        </span>
                      ) : (
                        order.document.fileName
                      )}
                    </td>
                    <td className="p-3.5 text-center font-semibold text-foreground">
                      {order.documents && order.documents.length > 1
                        ? `${order.documents.reduce((s, d) => s + (d.isImage ? 1 : d.pageCount), 0)} pgs`
                        : order.settings.pageRangeType === 'custom'
                        ? `${order.settings.pageRangeFrom}–${order.settings.pageRangeTo}`
                        : order.document.pageCount}
                    </td>
                    <td className="p-3.5 text-muted-foreground text-[11px]">
                      {order.settings.copies}x · {order.settings.colorMode.toUpperCase()} ·{' '}
                      {order.settings.paperSize.toUpperCase()} ·{' '}
                      {order.settings.sides === 'single' ? '1-side' : '2-sided'}
                    </td>
                    <td className="p-3.5 text-right font-bold tabular-nums text-foreground">
                      {formatPrice(order.price)}
                    </td>
                    <td className="p-3.5 text-center">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="p-3.5 pr-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {order.status === 'queued' && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleStatusChange(order, 'printing')}
                            className="gap-1 h-7 text-xs px-2.5"
                          >
                            <Printer className="w-3 h-3" />
                            Print
                          </Button>
                        )}

                        {order.status === 'printing' && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary px-2 py-1">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Spooling...
                          </span>
                        )}

                        {order.status === 'ready' && (
                          <Button
                            variant="subtle"
                            size="sm"
                            onClick={() => handleStatusChange(order, 'collected')}
                            className="gap-1 h-7 text-xs px-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20"
                          >
                            <Check className="w-3 h-3" />
                            Mark Collected
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedOrder(order)}
                          className="h-7 w-7 p-0"
                          title="View / Edit"
                        >
                          <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Inspector */}
      {selectedOrder && (
        <JobDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onSave={(updated) => {
            updateExistingOrder(updated);
            setSelectedOrder(null);
            showToast(`${updated.token} changes saved`);
          }}
          onPrint={(updated) => {
            updateExistingOrder({ ...updated, status: 'printing' });
            setSelectedOrder(null);
            showToast(`${updated.token} sent to printer spooler`);
          }}
          onCancel={(o) => {
            updateExistingOrderStatus(o.id, 'cancelled');
            setSelectedOrder(null);
            showToast(`${o.token} order cancelled`);
          }}
        />
      )}

      {/* Toast Alert */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-foreground text-background text-xs font-semibold shadow-floating animate-bounce">
          {toast}
        </div>
      )}
    </div>
  );
}
