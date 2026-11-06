// ============================================================
// PaperPlane — Server-Sent Events (SSE) Real-Time Broadcaster
// Zero external library needed — works seamlessly on local Wi-Fi
// ============================================================

class SSEManager {
  constructor() {
    // Set of response objects for dashboard POS
    this.dashboardClients = new Set();
    // Map of token -> Set of response objects for customer phones
    this.customerClients = new Map();
  }

  // Register dashboard client
  addDashboardClient(res) {
    this.dashboardClients.add(res);
    res.on('close', () => {
      this.dashboardClients.delete(res);
    });
  }

  // Register customer client by order token
  addCustomerClient(token, res) {
    if (!this.customerClients.has(token)) {
      this.customerClients.set(token, new Set());
    }
    const tokenSet = this.customerClients.get(token);
    tokenSet.add(res);

    res.on('close', () => {
      tokenSet.delete(res);
      if (tokenSet.size === 0) {
        this.customerClients.delete(token);
      }
    });
  }

  // Broadcast new order to shopkeeper dashboard
  broadcastNewOrder(order) {
    const data = JSON.stringify({ type: 'NEW_ORDER', order, timestamp: Date.now() });
    for (const client of this.dashboardClients) {
      try {
        client.write(`event: new_order\ndata: ${data}\n\n`);
      } catch (err) {
        this.dashboardClients.delete(client);
      }
    }
  }

  // Broadcast order status change to both dashboard and the specific customer
  broadcastOrderStatus(order) {
    const data = JSON.stringify({ type: 'STATUS_UPDATE', order, timestamp: Date.now() });

    // Send to dashboard clients
    for (const client of this.dashboardClients) {
      try {
        client.write(`event: order_status\ndata: ${data}\n\n`);
      } catch (err) {
        this.dashboardClients.delete(client);
      }
    }

    // Send to customer phone watching this token
    if (order.token && this.customerClients.has(order.token)) {
      const set = this.customerClients.get(order.token);
      for (const client of set) {
        try {
          client.write(`event: status_change\ndata: ${data}\n\n`);
        } catch (err) {
          set.delete(client);
        }
      }
    }
  }

  // Keep-alive heartbeat every 20 seconds
  startHeartbeat() {
    setInterval(() => {
      const ping = `: heartbeat\n\n`;
      for (const client of this.dashboardClients) {
        try {
          client.write(ping);
        } catch {
          this.dashboardClients.delete(client);
        }
      }
      for (const [token, set] of this.customerClients.entries()) {
        for (const client of set) {
          try {
            client.write(ping);
          } catch {
            set.delete(client);
          }
        }
      }
    }, 20000);
  }
}

export const sseManager = new SSEManager();
sseManager.startHeartbeat();

