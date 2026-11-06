import React, { useState } from 'react';
import {
  Printer,
  RefreshCw,
  Wifi,
  WifiOff,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { useCustomerOrder } from '../../context/CustomerOrderContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

export default function PrinterPage() {
  const { printers, refreshPrinters } = useCustomerOrder();
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshPrinters();
    setLastRefresh(new Date());
    setRefreshing(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Printers
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Printers detected on this computer, checked live from the operating system.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          isLoading={refreshing}
          className="gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Check Status</span>
        </Button>
      </div>

      {printers.length === 0 ? (
        <Card className="p-8 text-center space-y-3 border-border/80 shadow-subtle">
          <div className="w-14 h-14 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center mx-auto">
            <Printer className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-bold text-foreground">No printer detected</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            No printer is installed on this computer. Connect a printer via USB
            or Wi-Fi, install its driver, then press Check Status.
          </p>
          {lastRefresh && (
            <p className="text-[11px] text-muted-foreground">
              Last checked {lastRefresh.toLocaleTimeString()}
            </p>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {printers.map((pr, idx) => {
            const isOnline = pr.status === 'online';
            const isUnknown = pr.status === 'unknown';
            return (
              <Card
                key={`${pr.name}-${idx}`}
                className={`p-6 space-y-5 border-border/80 shadow-subtle ${
                  !isOnline ? 'border-amber-500/30' : ''
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                        isOnline ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'
                      }`}
                    >
                      <Printer className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-foreground">{pr.name}</h3>
                      {pr.model ? (
                        <p className="text-xs text-muted-foreground">{pr.model}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground">Detected by the operating system</p>
                      )}
                    </div>
                  </div>

                  <Badge variant={isOnline ? 'success' : isUnknown ? 'outline' : 'destructive'} className="gap-1">
                    {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                    <span className="capitalize">{pr.status}</span>
                  </Badge>
                </div>

                {/* Offline Warning Banner */}
                {!isOnline && !isUnknown && (
                  <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2 font-medium">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Printer is offline or disconnected. Please check power and cable.</span>
                  </div>
                )}

                {/* Levels — only shown when the printer actually reports them */}
                {pr.paperLevel != null || pr.tonerLevel != null ? (
                  <div className="space-y-4 pt-1">
                    {pr.paperLevel != null && (
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between text-muted-foreground">
                          <span className="font-semibold text-foreground">Paper Tray</span>
                          <span className="font-bold tabular-nums text-foreground">{pr.paperLevel}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${pr.paperLevel < 20 ? 'bg-destructive' : 'bg-primary'}`}
                            style={{ width: `${pr.paperLevel}%` }}
                          />
                        </div>
                      </div>
                    )}
                    {pr.tonerLevel != null && (
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between text-muted-foreground">
                          <span className="font-semibold text-foreground">Black Toner Cartridge</span>
                          <span className="font-bold tabular-nums text-foreground">{pr.tonerLevel}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${pr.tonerLevel < 20 ? 'bg-destructive' : 'bg-emerald-500'}`}
                            style={{ width: `${pr.tonerLevel}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground flex items-center gap-2 pt-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    Paper and toner levels are not reported by this printer — check them on the printer itself.
                  </p>
                )}

                {/* Footer */}
                <div className="pt-3 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>
                    Last checked:{' '}
                    {pr.lastChecked
                      ? new Date(pr.lastChecked).toLocaleTimeString()
                      : lastRefresh
                        ? lastRefresh.toLocaleTimeString()
                        : 'just now'}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
