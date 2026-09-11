import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { PairedDevice } from '../../types/virtualRoom';
import {
  Smartphone,
  Radio,
  Wifi,
  ShieldCheck,
  CheckCircle2,
  Copy,
  X,
  RefreshCw,
  Info,
  ExternalLink,
  Activity,
  AlertCircle,
} from 'lucide-react';

interface DevicePairingModalProps {
  isOpen: boolean;
  onClose: () => void;
  pairedDevices: PairedDevice[];
  onAddDevice: (device: PairedDevice) => void;
  activePhoneConnected: boolean;
  activePhoneDetails: {
    deviceId: string;
    deviceName: string;
    connectedAt: number;
    lastPingMs?: number;
  } | null;
  pairingCode: string;
  onRefreshPairingCode: () => void;
  totalPacketsReceived?: number;
  currentLatency?: number;
}

export const DevicePairingModal: React.FC<DevicePairingModalProps> = ({
  isOpen,
  onClose,
  pairedDevices,
  onAddDevice,
  activePhoneConnected,
  activePhoneDetails,
  pairingCode,
  onRefreshPairingCode,
  totalPacketsReceived = 0,
  currentLatency = 18,
}) => {
  const [networkInfo, setNetworkInfo] = useState<{
    localIps: string[];
    primaryIp: string;
    port: number;
    phoneDeviceUrl: string;
    browserDeviceUrl: string;
  } | null>(null);

  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Fetch real network info from backend
  useEffect(() => {
    if (!isOpen) return;

    fetch('/api/network-info')
      .then((res) => res.json())
      .then((data) => {
        setNetworkInfo(data);
        const targetUrl = data.browserDeviceUrl || data.phoneDeviceUrl || `${window.location.origin}/device?code=${pairingCode}`;
        QRCode.toDataURL(targetUrl, {
          width: 220,
          margin: 1.5,
          color: {
            dark: '#09090b',
            light: '#ffffff',
          },
        }).then(setQrCodeUrl);
      })
      .catch(() => {
        // Fallback to window origin
        const fallbackUrl = `${window.location.origin}/device?code=${pairingCode}`;
        QRCode.toDataURL(fallbackUrl, {
          width: 220,
          margin: 1.5,
          color: {
            dark: '#09090b',
            light: '#ffffff',
          },
        }).then(setQrCodeUrl);
      });
  }, [isOpen, pairingCode]);

  if (!isOpen) return null;

  const phoneUrl = networkInfo?.browserDeviceUrl || `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/device?code=${pairingCode}`;
  const serverAddress = networkInfo?.primaryIp ? `http://${networkInfo.primaryIp}:3000` : (typeof window !== 'undefined' ? window.location.host : 'localhost:3000');

  const handleCopyUrl = () => {
    navigator.clipboard?.writeText?.(phoneUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard?.writeText?.(pairingCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl border border-zinc-400 bg-[#e4e7ec] p-6 text-zinc-900 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-300 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-zinc-900 text-white shadow-xs">
              <Smartphone className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-base font-bold font-['Playfair_Display',serif] text-black">
                DEVICE CONNECTION CENTER
              </h2>
              <p className="text-xs text-zinc-600 font-mono">
                Connect Android or iOS Phone over Local Wi-Fi for Live Telemetry
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-950 hover:bg-zinc-300 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Status Bar */}
        <div className="p-3.5 rounded-xl border border-zinc-400 bg-[#cbd1d8]/50 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-zinc-600">CONNECTION STATUS:</span>
            {activePhoneConnected ? (
              <span className="flex items-center gap-1.5 text-emerald-800 font-bold bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                ● DEVICE CONNECTED ({activePhoneDetails?.deviceName || 'Android Phone'})
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-amber-800 font-semibold bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse" />
                Waiting for device...
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-zinc-700">
            <span className="flex items-center gap-1">
              <Wifi className="w-3.5 h-3.5 text-zinc-900" /> LOCAL WI-FI
            </span>
            <span>•</span>
            <span>Packets: {totalPacketsReceived.toLocaleString()}</span>
            <span>•</span>
            <span>Latency: {currentLatency} ms</span>
          </div>
        </div>

        {/* Technical Data Distinction Notice */}
        <div className="p-3 rounded-xl bg-cyan-50/80 border border-cyan-300 text-xs font-serif text-cyan-950 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-cyan-800 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="font-mono text-[11px] uppercase tracking-wide text-cyan-900">
              Scientific Data Architecture:
            </strong>{' '}
            Connected phones transmit high-rate motion telemetry (accelerometer, gyroscope, orientation)
            over local WebSocket. The dashboard clearly badges this stream as{' '}
            <span className="font-mono font-bold text-cyan-900 bg-cyan-200 px-1 py-0.5 rounded">
              LIVE DEVICE TELEMETRY
            </span>{' '}
            to preserve strict experimental honesty for judges.
          </p>
        </div>

        {/* Connection Setup Grid (QR Code + Address Details) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left Column: QR Code */}
          <div className="rounded-xl border border-zinc-400 bg-white p-4 flex flex-col items-center justify-center gap-3 shadow-2xs">
            <span className="text-xs font-mono font-bold text-zinc-800 tracking-wider">
              SCAN WITH PHONE CAMERA
            </span>
            {qrCodeUrl ? (
              <img
                src={qrCodeUrl}
                alt="Wi-Safe Phone QR Code"
                className="w-44 h-44 rounded-lg border border-zinc-200 shadow-xs"
              />
            ) : (
              <div className="w-44 h-44 bg-zinc-100 rounded-lg flex items-center justify-center text-xs font-mono text-zinc-500">
                Generating QR...
              </div>
            )}
            <p className="text-[11px] font-serif text-zinc-500 text-center">
              Ensure your phone is connected to the same Wi-Fi network as this laptop.
            </p>
          </div>

          {/* Right Column: Server IP & Pairing Code */}
          <div className="rounded-xl border border-zinc-400 bg-[#cbd1d8]/40 p-4 flex flex-col justify-between gap-3 shadow-2xs">
            {/* Pairing Code */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs font-mono text-zinc-600">
                <span>PAIRING CODE:</span>
                <button
                  onClick={onRefreshPairingCode}
                  className="text-cyan-800 hover:text-cyan-950 flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" /> Regenerate
                </button>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 py-2.5 px-3 rounded-lg bg-white border border-zinc-400 text-center text-lg font-bold font-mono tracking-widest text-zinc-950 shadow-2xs">
                  {pairingCode}
                </div>
                <button
                  onClick={handleCopyCode}
                  className="px-3 py-2.5 rounded-lg bg-zinc-200 hover:bg-zinc-300 text-xs font-mono text-zinc-800 border border-zinc-400 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Server IP and Port */}
            <div className="flex flex-col gap-1 text-xs font-mono">
              <span className="text-zinc-600">SERVER ADDRESS:</span>
              <div className="py-2 px-3 rounded-lg bg-white border border-zinc-400 text-zinc-950 font-semibold truncate shadow-2xs">
                {serverAddress}
              </div>
            </div>

            {/* Phone Direct URL */}
            <div className="flex flex-col gap-1 text-xs font-mono">
              <span className="text-zinc-600">DIRECT PHONE URL:</span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={phoneUrl}
                  className="flex-1 py-2 px-3 rounded-lg bg-white border border-zinc-400 text-xs font-mono text-zinc-800 truncate shadow-2xs"
                />
                <button
                  onClick={handleCopyUrl}
                  className="px-3 py-2 rounded-lg bg-zinc-900 hover:bg-black text-white text-xs font-mono flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedUrl ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Test Link in Browser */}
            <a
              href={`/device?code=${pairingCode}`}
              target="_blank"
              rel="noreferrer"
              className="py-1.5 px-3 rounded-lg bg-white hover:bg-zinc-100 border border-zinc-400 text-xs font-mono text-zinc-800 flex items-center justify-center gap-1.5 transition text-center shadow-2xs"
            >
              <ExternalLink className="w-3.5 h-3.5 text-zinc-600" />
              <span>Open Sensing Client in New Tab</span>
            </a>
          </div>
        </div>

        {/* 6 Step-by-Step Instructions */}
        <div className="p-4 rounded-xl border border-zinc-400 bg-white shadow-2xs space-y-2">
          <div className="text-xs font-mono font-bold text-zinc-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            CONNECT IN 6 EASY STEPS:
          </div>
          <ol className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-serif text-zinc-700">
            <li className="flex items-start gap-2">
              <span className="font-mono font-bold text-zinc-900 bg-zinc-200 px-1.5 py-0.5 rounded text-[11px]">1</span>
              <span>Connect phone to the <strong>same Wi-Fi network</strong> as this laptop.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-mono font-bold text-zinc-900 bg-zinc-200 px-1.5 py-0.5 rounded text-[11px]">2</span>
              <span>Scan the QR code using your phone camera.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-mono font-bold text-zinc-900 bg-zinc-200 px-1.5 py-0.5 rounded text-[11px]">3</span>
              <span>Open the Wi-Safe device sensing page.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-mono font-bold text-zinc-900 bg-zinc-200 px-1.5 py-0.5 rounded text-[11px]">4</span>
              <span>Confirm pairing code (pre-filled via QR URL).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-mono font-bold text-zinc-900 bg-zinc-200 px-1.5 py-0.5 rounded text-[11px]">5</span>
              <span>Grant browser motion & orientation permissions if prompted.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-mono font-bold text-zinc-900 bg-zinc-200 px-1.5 py-0.5 rounded text-[11px]">6</span>
              <span>Tap <strong>START SENSING</strong> to begin live stream.</span>
            </li>
          </ol>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-zinc-300 pt-3">
          <span className="text-[11px] font-serif text-zinc-600">
            Wi-Safe AI Sensing Network • Port 3000 • WebSocket Protocol
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-zinc-900 hover:bg-black text-white font-mono text-xs font-bold transition shadow-xs cursor-pointer"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
