import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig, Plugin} from 'vite';

// LINT.IfChange(aistudio_media_plugin)
function aistudioMediaPlugin(): Plugin {
  return {
    name: 'vite-plugin-aistudio-media',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.startsWith('/assets/aistudio/')) {
          const rawPath = req.url.split('?')[0].split('#')[0];
          try {
            const decodedPath = decodeURIComponent(rawPath);
            const relativePath = decodedPath.replace(/^\//, '');
            const aistudioDir = path.resolve(
              __dirname,
              'public',
              'assets',
              'aistudio',
            );
            const filePath = path.resolve(__dirname, 'public', relativePath);
            if (
              filePath.startsWith(aistudioDir + path.sep) &&
              fs.existsSync(filePath) &&
              fs.statSync(filePath).isFile()
            ) {
              const ext = path.extname(filePath).toLowerCase();
              const mimeMap: Record<string, string> = {
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.gif': 'image/gif',
                '.webp': 'image/webp',
                '.svg': 'image/svg+xml',
                '.bmp': 'image/bmp',
                '.ico': 'image/x-icon',
                '.mp4': 'video/mp4',
                '.webm': 'video/webm',
                '.ogv': 'video/ogg',
                '.mp3': 'audio/mpeg',
                '.wav': 'audio/wav',
                '.ogg': 'audio/ogg',
                '.pdf': 'application/pdf',
              };
              res.setHeader(
                'Content-Type',
                mimeMap[ext] || 'application/octet-stream',
              );
              res.setHeader('Cache-Control', 'no-cache');
              fs.createReadStream(filePath).pipe(res);
              return;
            }
          } catch {
            // Fall through if URI decoding or file access fails
          }
        }
        next();
      });
    },
  };
}
// LINT.ThenChange(//depot/google3/java/com/google/alkali/boq/makersuite/applet_dev_service/templates/initializers/react_theme/vite.config.ts:aistudio_media_plugin)

// CSI Real-time Streaming & Ingestion Plugin for Wi-Safe AI
function csiStreamingPlugin(): Plugin {
  const sseClients = new Set<any>();
  let packetCount = 0;
  let lastPacketTime = 0;
  const pairedDevices = [
    {
      id: 'TX-NODE-01',
      name: 'Wi-Fi AP Router (5GHz Channel 36)',
      role: 'TRANSMITTER',
      pairingCode: 'WI-SAFE-4821',
      connectedAt: '2026-09-10T10:00:00Z',
      snr: 34.5,
    },
    {
      id: 'RX-ESP32-S3',
      name: 'ESP32-S3 CSI Sink Node (Antenna A/B)',
      role: 'RECEIVER',
      pairingCode: 'WI-SAFE-8820',
      connectedAt: '2026-09-10T10:00:15Z',
      snr: 31.2,
    },
  ];

  return {
    name: 'vite-plugin-csi-streaming',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // SSE Stream: /api/csi/stream
        if (req.url === '/api/csi/stream') {
          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
          });

          res.write(`data: ${JSON.stringify({ type: 'handshake', status: 'connected', serverTime: Date.now() })}\n\n`);
          sseClients.add(res);

          req.on('close', () => {
            sseClients.delete(res);
          });
          return;
        }

        // Ingest: POST /api/csi/ingest
        if (req.url === '/api/csi/ingest' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              packetCount++;
              lastPacketTime = Date.now();
              const payload = JSON.stringify({
                type: 'packet',
                packet: {
                  timestamp: data.timestamp || Date.now(),
                  subcarriers: data.subcarriers || Array.from({ length: 30 }, (_, i) => i),
                  amplitude: data.amplitude || [],
                  phase: data.phase || [],
                  frequency: data.frequency || 5180,
                  deviceId: data.deviceId || 'EXT-CSI-NODE',
                },
              });

              for (const client of sseClients) {
                try {
                  client.write(`data: ${payload}\n\n`);
                } catch {
                  sseClients.delete(client);
                }
              }

              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true, packetCount, receivedAt: lastPacketTime }));
            } catch (err: any) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Invalid JSON payload', message: err.message }));
            }
          });
          return;
        }

        // Status: GET /api/csi/status
        if (req.url === '/api/csi/status') {
          const isLive = Date.now() - lastPacketTime < 6000 && packetCount > 0;
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              isLive,
              packetCount,
              lastPacketTime,
              connectedClients: sseClients.size,
              deviceCount: pairedDevices.length,
              samplingRateHz: 50,
            })
          );
          return;
        }

        // Devices list: GET /api/devices
        if (req.url === '/api/devices' && req.method === 'GET') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ devices: pairedDevices }));
          return;
        }

        // Device pairing: POST /api/devices/pair
        if (req.url === '/api/devices/pair' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const deviceData = JSON.parse(body);
              const newDevice = {
                id: deviceData.id || `DEV-${Math.floor(1000 + Math.random() * 9000)}`,
                name: deviceData.name || 'Mobile Wi-Fi Companion',
                role: deviceData.role || 'MONITOR',
                pairingCode: deviceData.pairingCode || `WI-SAFE-${Math.floor(1000 + Math.random() * 9000)}`,
                connectedAt: new Date().toISOString(),
                snr: 28.0 + Math.random() * 8,
              };
              pairedDevices.push(newDevice);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true, device: newDevice, totalDevices: pairedDevices.length }));
            } catch (err: any) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Invalid device payload' }));
            }
          });
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), aistudioMediaPlugin(), csiStreamingPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
