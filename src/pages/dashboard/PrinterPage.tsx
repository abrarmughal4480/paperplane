import React, { useState } from 'react';
import {
  Printer,
  RefreshCw,
  Wifi,
  WifiOff,
  AlertTriangle,
  CheckCircle2,
  Settings,
} from 'lucide-react';
import { defaultPrinter, offlinePrinter, type PrinterStatus } from '../../data/mockData';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

export default function PrinterPage() {
  const [refreshing, setRefreshing] = useState(false);
  const [printers, setPrinters] = useState<PrinterStatus[]>([defaultPrinter, offlinePrinter]);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Printer Hardware & Spoolers
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Monitor local shop printing peripherals, paper tray capacity, and toner levels.
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

      {/* Printer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {printers.map((pr, idx) => {
          const isOnline = pr.status === 'online';
          return (
            <Card
              key={idx}
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
                    <p className="text-xs text-muted-foreground">{pr.model}</p>
                  </div>
                </div>

                <Badge variant={isOnline ? 'success' : 'destructive'} className="gap-1">
                  {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                  <span className="capitalize">{pr.status}</span>
                </Badge>
              </div>

              {/* Offline Warning Banner */}
              {!isOnline && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2 font-medium">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Printer is offline or USB disconnected. Please check power.</span>
                </div>
              )}

              {/* Levels */}
              <div className="space-y-4 pt-1">
                {/* Paper level */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span className="font-semibold text-foreground">Paper Tray (A4 / Legal)</span>
                    <span className="font-bold tabular-nums text-foreground">{pr.paperLevel}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        pr.paperLevel < 20 ? 'bg-destructive' : 'bg-primary'
                      }`}
                      style={{ width: `${pr.paperLevel}%` }}
                    />
                  </div>
                </div>

                {/* Toner Level */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span className="font-semibold text-foreground">Black Toner Cartridge</span>
                    <span className="font-bold tabular-nums text-foreground">{pr.tonerLevel}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        pr.tonerLevel < 20 ? 'bg-destructive' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${pr.tonerLevel}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Last verified: {pr.lastChecked}</span>
                <span className="font-medium text-foreground">Protocol: USB RAW / ESC-POS</span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
