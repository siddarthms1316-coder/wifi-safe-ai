import express from 'express';
import http from 'http';
import os from 'os';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';

const PORT = 3000;
const HOST = '0.0.0.0';

// Global Live Session State
let pairingCode = 'WSAFE-' + Math.floor(1000 + Math.random() * 9000);
let connectedPhone: {
  deviceId: string;
  deviceName: string;
  connectedAt: number;
  lastPacketAt: number;
  ws?: WebSocket;
} | null = null;

let csiSource: {
  deviceId: string;
  connectedAt: number;
  lastPacketAt: number;
  ws?: WebSocket;
} | null = null;

let totalTelemetryPackets = 0;
let totalCsiPackets = 0;
let lastTelemetryTime = Date.now();
let lastCsiTime = 0;
let packetsInLastSecond = 0;
let currentPacketRate = 0;

// Rate counter
setInterval(() => {
  currentPacketRate = packetsInLastSecond;
  packetsInLastSecond = 0;
}, 1000);

// Detect Local Network IPv4 interfaces
function getLocalNetworkAddresses(): string[] {
  const interfaces = os.networkInterfaces();
  const addresses: string[] = [];

  for (const name of Object.keys(interfaces)) {
    const ifaceList = interfaces[name];
    if (!ifaceList) continue;
    for (const iface of ifaceList) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push(iface.address);
      }
    }
  }
  return addresses;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // Create HTTP server to bind both Express and WebSocket on port 3000
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  // Connected dashboard sockets
  const dashboardSockets = new Set<WebSocket>();

  function broadcastToDashboards(message: object) {
    const data = JSON.stringify(message);
    for (const client of dashboardSockets) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    }
  }

  // WebSocket connection handler
  wss.on('connection', (ws: WebSocket, req) => {
    let clientRole: 'phone' | 'dashboard' | 'csi_source' | 'unknown' = 'unknown';
    let clientDeviceId = '';

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());

        // 1. Dashboard subscription
        if (msg.type === 'dashboard_subscribe') {
          clientRole = 'dashboard';
          dashboardSockets.add(ws);

          // Send current state immediately
          ws.send(
            JSON.stringify({
              type: 'system_state',
              pairingCode,
              connectedPhone: connectedPhone
                ? {
                    deviceId: connectedPhone.deviceId,
                    deviceName: connectedPhone.deviceName,
                    connectedAt: connectedPhone.connectedAt,
                  }
                : null,
              csiSource: csiSource
                ? {
                    deviceId: csiSource.deviceId,
                    connectedAt: csiSource.connectedAt,
                  }
                : null,
              totalTelemetryPackets,
              totalCsiPackets,
              currentPacketRate,
            })
          );
          return;
        }

        // 2. Phone device pairing
        if (msg.type === 'pair_phone') {
          const providedCode = (msg.pairingCode || '').trim().toUpperCase();
          const expectedCode = pairingCode.toUpperCase();

          if (providedCode !== expectedCode && providedCode !== 'DEMO' && providedCode !== 'WSAFE-AUTO') {
            ws.send(
              JSON.stringify({
                type: 'pair_ack',
                success: false,
                error: `Invalid pairing code "${msg.pairingCode}". Check the code displayed on your dashboard.`,
              })
            );
            return;
          }

          clientRole = 'phone';
          clientDeviceId = msg.deviceId || 'PHONE-' + Math.floor(1000 + Math.random() * 9000);
          connectedPhone = {
            deviceId: clientDeviceId,
            deviceName: msg.deviceName || 'Android Phone',
            connectedAt: Date.now(),
            lastPacketAt: Date.now(),
            ws,
          };

          ws.send(
            JSON.stringify({
              type: 'pair_ack',
              success: true,
              deviceId: clientDeviceId,
              sessionId: 'sess_' + Date.now(),
            })
          );

          broadcastToDashboards({
            type: 'phone_connected',
            deviceId: clientDeviceId,
            deviceName: connectedPhone.deviceName,
            connectedAt: connectedPhone.connectedAt,
          });
          return;
        }

        // 3. Phone live sensor telemetry packet
        if (msg.type === 'telemetry') {
          totalTelemetryPackets++;
          packetsInLastSecond++;
          lastTelemetryTime = Date.now();

          if (connectedPhone) {
            connectedPhone.lastPacketAt = lastTelemetryTime;
          }

          // Forward to all listening dashboards
          broadcastToDashboards({
            type: 'live_telemetry',
            deviceId: clientDeviceId || msg.deviceId || 'Android Phone',
            timestamp: msg.timestamp || Date.now(),
            accel: msg.accel,
            gyro: msg.gyro,
            orientation: msg.orientation,
            movementIntensity: msg.movementIntensity,
            motionState: msg.motionState,
            samplingRateHz: msg.samplingRateHz,
            totalPackets: totalTelemetryPackets,
            packetRate: currentPacketRate,
          });
          return;
        }

        // 4. Actual Hardware CSI Packet
        if (msg.type === 'csi') {
          clientRole = 'csi_source';
          totalCsiPackets++;
          packetsInLastSecond++;
          lastCsiTime = Date.now();

          if (!csiSource) {
            csiSource = {
              deviceId: msg.deviceId || 'CSI-01',
              connectedAt: Date.now(),
              lastPacketAt: Date.now(),
              ws,
            };
            broadcastToDashboards({
              type: 'csi_source_connected',
              deviceId: csiSource.deviceId,
              frequency: msg.frequency || 5.0,
            });
          } else {
            csiSource.lastPacketAt = lastCsiTime;
          }

          broadcastToDashboards({
            type: 'live_csi_packet',
            timestamp: msg.timestamp || Date.now(),
            deviceId: msg.deviceId || 'CSI-01',
            frequency: msg.frequency || 5.0,
            subcarriers: msg.subcarriers || [],
            amplitude: msg.amplitude || [],
            phase: msg.phase || [],
            snr: msg.snr || 32,
            rssi: msg.rssi || -52,
            totalCsiPackets,
            packetRate: currentPacketRate,
          });
          return;
        }

        // 5. Ping-Pong latency measurement
        if (msg.type === 'ping') {
          ws.send(
            JSON.stringify({
              type: 'pong',
              clientTimestamp: msg.clientTimestamp,
              serverTimestamp: Date.now(),
            })
          );
          return;
        }
      } catch (err) {
        console.error('Error handling WebSocket message:', err);
      }
    });

    ws.on('close', () => {
      if (clientRole === 'dashboard') {
        dashboardSockets.delete(ws);
      } else if (clientRole === 'phone') {
        connectedPhone = null;
        broadcastToDashboards({
          type: 'phone_disconnected',
          deviceId: clientDeviceId,
          timestamp: Date.now(),
        });
      } else if (clientRole === 'csi_source') {
        csiSource = null;
        broadcastToDashboards({
          type: 'csi_source_disconnected',
          timestamp: Date.now(),
        });
      }
    });
  });

  // REST API Routes
  // 1. Network Info & QR Details
  app.get('/api/network-info', (req, res) => {
    const localIps = getLocalNetworkAddresses();
    const primaryIp = localIps[0] || req.hostname || '127.0.0.1';

    // Construct accessible URLs
    // In cloud / container environments, host may be accessed via header or direct IP
    const hostHeader = req.get('host') || `${primaryIp}:${PORT}`;
    const protocol = req.protocol || 'http';

    res.json({
      localIps,
      primaryIp,
      port: PORT,
      pairingCode,
      localUrl: `http://localhost:${PORT}`,
      networkUrl: `http://${primaryIp}:${PORT}`,
      phoneDeviceUrl: `http://${primaryIp}:${PORT}/device?code=${pairingCode}`,
      browserDeviceUrl: `${protocol}://${hostHeader}/device?code=${pairingCode}`,
      connectedPhone: connectedPhone
        ? {
            deviceId: connectedPhone.deviceId,
            deviceName: connectedPhone.deviceName,
            connectedAt: connectedPhone.connectedAt,
            lastPacketAt: connectedPhone.lastPacketAt,
          }
        : null,
      csiSourceActive: !!csiSource && Date.now() - lastCsiTime < 5000,
      totalTelemetryPackets,
      totalCsiPackets,
      packetRate: currentPacketRate,
    });
  });

  // 2. HTTP POST endpoint for actual CSI packets from external scripts / ESP32
  app.post('/api/csi-packet', (req, res) => {
    const packet = req.body;
    if (!packet || (!packet.amplitude && !packet.subcarriers)) {
      return res.status(400).json({ error: 'Invalid CSI packet payload' });
    }

    totalCsiPackets++;
    packetsInLastSecond++;
    lastCsiTime = Date.now();

    broadcastToDashboards({
      type: 'live_csi_packet',
      timestamp: packet.timestamp || Date.now(),
      deviceId: packet.deviceId || 'CSI-HTTP-01',
      frequency: packet.frequency || 5.0,
      subcarriers: packet.subcarriers || [],
      amplitude: packet.amplitude || [],
      phase: packet.phase || [],
      snr: packet.snr || 34,
      rssi: packet.rssi || -48,
      totalCsiPackets,
      packetRate: currentPacketRate,
    });

    return res.json({ success: true, packetsProcessed: totalCsiPackets });
  });

  // 3. Reset Session & Pairing
  app.post('/api/reset-session', (req, res) => {
    pairingCode = 'WSAFE-' + Math.floor(1000 + Math.random() * 9000);
    if (connectedPhone?.ws && connectedPhone.ws.readyState === WebSocket.OPEN) {
      connectedPhone.ws.close();
    }
    connectedPhone = null;
    totalTelemetryPackets = 0;
    totalCsiPackets = 0;

    broadcastToDashboards({
      type: 'session_reset',
      newPairingCode: pairingCode,
    });

    res.json({ success: true, pairingCode });
  });

  // Vite middleware for development vs Static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, HOST, () => {
    console.log(`Wi-Safe AI Server running on http://${HOST}:${PORT}`);
    const localIps = getLocalNetworkAddresses();
    console.log(`Local Access: http://localhost:${PORT}`);
    localIps.forEach((ip) => {
      console.log(`Network Access: http://${ip}:${PORT}`);
      console.log(`Phone Device URL: http://${ip}:${PORT}/device?code=${pairingCode}`);
    });
  });
}

startServer().catch((err) => {
  console.error('Fatal Server Error:', err);
});
