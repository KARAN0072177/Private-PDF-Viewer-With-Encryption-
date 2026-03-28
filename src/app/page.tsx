"use client";

import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from "react";
import dynamic from 'next/dynamic';
import { SecureFetch } from "@/lib/privacy/secure-fetch";
import { TrafficObfuscator } from "@/lib/privacy/traffic-obfuscator";
import { KeyManager } from "@/lib/encryption/key-manager";
import { Shield, Lock, Unlock, FileText, AlertTriangle, Fingerprint, Activity, Cpu, Server, ChevronRight, Zap, Eye, EyeOff, Clock, CheckCircle2, XCircle } from "lucide-react";

// Lazy load heavy components
const SecurityMetrics = dynamic(() => Promise.resolve(({ metrics }: any) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
    {metrics.map((metric: any, idx: number) => (
      <div key={idx} className="metric-card group">
        <div className="flex items-center gap-2 mb-2">
          <metric.icon className="w-4 h-4 text-gray-400 group-hover:text-green-400 transition-colors" />
          <span className="text-xs text-gray-400">{metric.label}</span>
        </div>
        <div className={`text-sm font-mono font-bold ${metric.color}`}>
          {metric.value}
        </div>
      </div>
    ))}
  </div>
)), { ssr: false, loading: () => <div className="h-24 animate-pulse bg-gray-800 rounded-lg" /> });

// Optimized PDF Viewer with lazy loading
const PDFViewer = dynamic(() => Promise.resolve(({ src, onLoad }: any) => (
  <iframe
    src={src}
    className="w-full h-[70vh] rounded-b-xl"
    onLoad={onLoad}
    title="Secure Document Viewer"
    loading="lazy"
  />
)), {
  ssr: false, loading: () => (
    <div className="w-full h-[70vh] bg-gray-900/50 rounded-xl flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block w-12 h-12 border-3 border-green-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-400 font-mono text-sm">Decrypting secure document...</p>
      </div>
    </div>
  )
});

// Types
interface Metric {
  icon: any;
  label: string;
  value: string;
  color: string;
}

interface LogEntry {
  id: number;
  time: string;
  action: string;
  file: string;
  status: string;
  severity?: 'info' | 'warning' | 'error';
}

export default function Home() {
  // State Management
  const [pdf, setPdf] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [locked, setLocked] = useState(true);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [securityLevel, setSecurityLevel] = useState("SECURE");
  const [activeTab, setActiveTab] = useState("viewer");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [privacyLevel, setPrivacyLevel] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('HIGH');
  const [time, setTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      setTime(new Date().toLocaleTimeString());
    };

    updateTime(); // initial
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  // Security Metrics with useMemo for performance
  const metrics = useMemo<Metric[]>(() => [
    { icon: Shield, label: "ENCRYPTION", value: "AES-256-GCM", color: "text-green-400" },
    { icon: Activity, label: "STATUS", value: securityLevel, color: "text-blue-400" },
    { icon: Cpu, label: "FIREWALL", value: "ACTIVE", color: "text-purple-400" },
    { icon: Server, label: "SESSION", value: "SECURE", color: "text-cyan-400" }
  ], [securityLevel]);

  // Documents list with metadata
  const documents = useMemo(() => [
    { file: "/api/pdf/p1.pdf", label: "CONFIDENTIAL_A", level: "TOP SECRET", size: "2.4 MB", lastAccessed: "2024-01-15" },
    { file: "/api/pdf/p2.pdf", label: "CONFIDENTIAL_B", level: "CLASSIFIED", size: "1.8 MB", lastAccessed: "2024-01-14" },
    { file: "/api/pdf/p3.pdf", label: "CONFIDENTIAL_C", level: "RESTRICTED", size: "3.1 MB", lastAccessed: "2024-01-13" }
  ], []);

  // Add log entry
  const addLogEntry = useCallback((action: string, file: string, status: string, severity: 'info' | 'warning' | 'error' = 'info') => {
    const newLog: LogEntry = {
      id: Date.now(),
      time: new Date().toLocaleTimeString(),
      action,
      file,
      status,
      severity
    };
    setLogs(prev => [newLog, ...prev].slice(0, 50)); // Keep last 50 logs
  }, []);

  // Load PDF with logging
  const loadPDF = useCallback((file: string, label: string) => {

      console.log("LOADING:", file); // 👈 ADD THIS

    setLoading(true);
    setPdf(file);
    addLogEntry('DOCUMENT_ACCESS', label, 'LOADING', 'info');

    // Simulate loading delay for better UX
    setTimeout(() => {
      addLogEntry('DOCUMENT_ACCESS', label, 'SUCCESS', 'info');
    }, 500);
  }, [addLogEntry]);

  useEffect(() => {
    const initPrivacy = async () => {
      // Initialize key manager
      const keyManager = KeyManager.getInstance();
      await keyManager.initSession();

      // Start noise generation for traffic obfuscation
      TrafficObfuscator.startNoiseGeneration();

      // Set privacy level
      setPrivacyLevel('HIGH');
    };

    initPrivacy();

    return () => {
      // Cleanup
      TrafficObfuscator.stopNoiseGeneration();
    };
  }, []);

const handleUnlock = useCallback(async () => {
  if (!input || isSubmitting) return;

  setIsSubmitting(true);
  setError("AUTHENTICATING...");
  setAttempts(prev => prev + 1);

  try {
    const data = await SecureFetch.post('/api/unlock', {
      passcode: input,
      timestamp: Date.now(),
      nonce: crypto.randomUUID(),
    });

    if (data.success) {
      setLocked(false);
      setError("");
      setAttempts(0);
      addLogEntry('AUTHENTICATION', 'SYSTEM', 'SUCCESS', 'info');
    } else {
      setError(`❌ ACCESS DENIED - Attempt ${attempts + 1}/3`);
      addLogEntry('AUTHENTICATION', 'SYSTEM', 'FAILED', 'error');
    }

  } catch (err) {
    console.error(err); // 👈 ADD THIS
    setError("🌐 NETWORK SECURITY BREACH");
  } finally {
    setIsSubmitting(false);
    setInput("");
  }
}, [input, isSubmitting, attempts, SecureFetch, addLogEntry]);

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!locked && e.ctrlKey && e.key === 'l') {
        setLocked(true);
        addLogEntry('SESSION', 'SYSTEM', 'LOCKED', 'warning');
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [locked, addLogEntry]);

  // Animated security level
  useEffect(() => {
    if (!locked) {
      const interval = setInterval(() => {
        setSecurityLevel(prev =>
          prev === "SECURE" ? "ENCRYPTED" :
            prev === "ENCRYPTED" ? "MONITORING" : "SECURE"
        );
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [locked]);

  // Add privacy status component
  const PrivacyStatus = () => (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-gray-900/90 backdrop-blur-lg rounded-lg p-3 text-xs font-mono border border-green-500/30">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-3 h-3 text-green-500" />
          <span className="text-green-400">PRIVACY LEVEL: {privacyLevel}</span>
        </div>
        <div className="space-y-1 text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
            <span>AES-256 Encryption</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
            <span>Traffic Obfuscation</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
            <span>DNS over HTTPS</span>
          </div>
        </div>
      </div>
    </div>
  );

  // LOCK SCREEN
  if (locked) {
    return (

      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black relative overflow-hidden">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width=%2260%22%20height=%2260%22%20xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cdefs%3E%3Cpattern%20id=%22grid%22%20width=%2260%22%20height=%2260%22%20patternUnits=%22userSpaceOnUse%22%3E%3Cpath%20d=%22M%2060%200%20L%200%200%200%2060%22%20fill=%22none%22%20stroke=%22rgba(0,255,0,0.03)%22%20stroke-width=%221%22/%3E%3C/pattern%3E%3C/defs%3E%3Crect%20width=%22100%25%22%20height=%22100%25%22%20fill=%22url(%23grid)%22/%3E%3C/svg%3E')] opacity-20"></div>

        {/* Animated Glow Effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/5 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse-slow delay-1000"></div>

        <main className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <div className="w-full max-w-md animate-fade-in-up">
            {/* Header with Animation */}
            <div className="text-center mb-8 animate-slide-down">
              <div className="inline-flex items-center justify-center p-4 bg-red-500/10 rounded-full mb-6 border border-red-500/30 animate-pulse-glow">
                <Lock className="w-10 h-10 text-red-500 animate-pulse" />
              </div>
              <h1 className="text-5xl font-mono font-bold bg-gradient-to-r from-red-500 via-orange-500 to-red-500 bg-clip-text text-transparent bg-300% animate-gradient-x mb-3">
                SECURE ACCESS
              </h1>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-400 font-mono">
                <Shield className="w-3 h-3 animate-pulse" />
                <span>ENCRYPTED CHANNEL • TLS 1.3</span>
              </div>
            </div>

            {/* Security Card with Glassmorphism */}
            <div className="glass-card rounded-xl p-8 animate-scale-in">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 font-mono">SECURITY PROTOCOL</span>
                  <span className="text-xs text-green-500 font-mono animate-pulse">ACTIVE</span>
                </div>
                <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full w-3/4 bg-gradient-to-r from-green-500 to-green-400 rounded-full animate-shimmer"></div>
                </div>
              </div>

              <p className="text-center text-sm text-gray-400 font-mono mb-6">
                ENTER AUTHENTICATION CODE
              </p>

              <div className="space-y-4">
                <div className="relative group">
                  <Fingerprint className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-green-500 transition-colors" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleUnlock()}
                    className="w-full px-10 py-3 bg-black/50 border border-gray-700 rounded-lg outline-none text-green-400 font-mono focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                    placeholder="••••••••"
                    autoFocus
                    disabled={isSubmitting}
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-green-500 transition-colors"
                    type="button"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <button
                  onClick={handleUnlock}
                  disabled={isSubmitting}
                  className="cursor-pointer w-full py-3 bg-gradient-to-r from-green-600 to-green-700 rounded-lg font-mono font-bold hover:from-green-500 hover:to-green-600 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        AUTHENTICATING...
                      </>
                    ) : (
                      <>
                        <Unlock className="w-4 h-4 group-hover:animate-bounce" />
                        AUTHENTICATE
                      </>
                    )}
                  </span>
                </button>

                {error && (
                  <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg animate-shake">
                    <p className="text-red-500 text-sm font-mono text-center">{error}</p>
                  </div>
                )}

                <div className="pt-4 text-center border-t border-gray-800">
                  <div className="flex items-center justify-center gap-4 text-xs text-gray-600 font-mono">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{time}</span>
                    </div>
                    <div className="w-1 h-1 bg-gray-700 rounded-full"></div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span>SECURE</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // MAIN APP
  return (

    <>

      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black">
        {/* Navigation Bar with Glassmorphism */}
        <nav className="sticky top-0 z-50 border-b border-gray-800 bg-gray-900/80 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3 group cursor-pointer">
                <Shield className="w-6 h-6 text-green-500 group-hover:rotate-12 transition-transform" />
                <span className="font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-cyan-400 bg-300% animate-gradient-x">
                  CYBERVAULT • SECURE VIEWER
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-xs font-mono">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse-ring"></div>
                  <span className="text-gray-400">SECURE SESSION</span>
                </div>
                <button
                  onClick={() => {
                    setLocked(true);
                    addLogEntry('SESSION', 'SYSTEM', 'LOCKED', 'warning');
                  }}
                  className="px-3 py-1 text-xs font-mono bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/20 hover:border-red-500/50 transition-all cursor-pointer hover:scale-105 active:scale-95"
                >
                  LOCK
                </button>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Security Metrics Dashboard */}
          <Suspense fallback={<div className="h-24 animate-pulse bg-gray-800 rounded-lg" />}>
            <SecurityMetrics metrics={metrics} />
          </Suspense>

          {/* Tab Navigation */}
          <div className="flex gap-2 mb-6 border-b border-gray-800">
            {[
              { id: "viewer", label: "DOCUMENT VIEWER", icon: FileText },
              { id: "logs", label: "ACCESS LOGS", icon: Activity },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group flex items-center gap-2 px-4 py-2 font-mono text-sm transition-all cursor-pointer ${activeTab === tab.id
                  ? "border-b-2 border-green-500 text-green-400"
                  : "text-gray-500 hover:text-gray-300 hover:border-b-2 hover:border-gray-700"
                  }`}
              >
                <tab.icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${activeTab === tab.id ? "text-green-400" : ""
                  }`} />
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "viewer" && (
            <>
              {/* Document Selection */}
              <div className="mb-6">
                <h2 className="text-sm font-mono text-gray-400 mb-3 flex items-center gap-2">
                  <Server className="w-4 h-4" />
                  SECURE DOCUMENT VAULT
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {documents.map((doc, i) => (
                    <button
                      key={i}
                      onClick={() => loadPDF(doc.file, doc.label)}
                      className="group relative overflow-hidden bg-gray-900/50 border border-gray-800 rounded-lg p-5 hover:border-green-500/50 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-green-500/0 via-green-500/0 to-green-500/0 group-hover:from-green-500/5 group-hover:via-green-500/5 transition-all duration-500"></div>
                      <div className="relative">
                        <div className="flex items-center justify-between mb-3">
                          <div className="p-2 bg-green-500/10 rounded-lg group-hover:bg-green-500/20 transition-colors">
                            <FileText className="w-5 h-5 text-green-500" />
                          </div>
                          <span className="text-xs font-mono text-red-500 animate-pulse-glow">{doc.level}</span>
                        </div>
                        <p className="font-mono text-base font-bold mb-1 group-hover:text-green-400 transition-colors">
                          {doc.label}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-gray-500 font-mono mt-2">
                          <span>{doc.size}</span>
                          <span>•</span>
                          <span>AES-256</span>
                        </div>
                      </div>
                      <ChevronRight className="absolute right-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-600 group-hover:text-green-500 group-hover:translate-x-1 transition-all" />
                    </button>
                  ))}
                </div>
              </div>

              {/* PDF Viewer with Lazy Loading */}
              {pdf && (
                <div className="glass-card rounded-xl overflow-hidden animate-fade-in-up">
                  <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-900/50">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-500 animate-pulse" />
                      <span className="text-xs font-mono text-gray-400">SECURE VIEWER • ENCRYPTED CHANNEL</span>
                    </div>
                    {loading && (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-xs text-gray-400">DECRYPTING...</span>
                      </div>
                    )}
                  </div>
                  <Suspense fallback={
                    <div className="w-full h-[70vh] bg-gray-900/50 flex items-center justify-center">
                      <div className="text-center">
                        <div className="inline-block w-12 h-12 border-3 border-green-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-gray-400 font-mono text-sm">Loading secure document...</p>
                      </div>
                    </div>
                  }>
                    <PDFViewer src={pdf} onLoad={() => setLoading(false)} />
                  </Suspense>
                </div>
              )}

              {!pdf && (
                <div className="text-center py-20 bg-gray-900/30 border border-gray-800 rounded-xl animate-fade-in">
                  <div className="inline-block p-4 bg-gray-800/50 rounded-full mb-4">
                    <Shield className="w-12 h-12 text-gray-600" />
                  </div>
                  <p className="text-gray-500 font-mono text-lg">NO DOCUMENT SELECTED</p>
                  <p className="text-xs text-gray-600 mt-2">SELECT A SECURE DOCUMENT FROM THE VAULT ABOVE</p>
                </div>
              )}
            </>
          )}

          {activeTab === "logs" && (
            <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-6 animate-fade-in">
              <div className="space-y-2">
                {logs.length === 0 ? (
                  <div className="text-center py-12">
                    <Activity className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                    <p className="text-gray-500 font-mono">No access logs available</p>
                  </div>
                ) : (
                  logs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center gap-4 p-3 bg-black/30 rounded-lg font-mono text-sm hover:bg-black/50 transition-all group cursor-default animate-slide-in"
                    >
                      <span className="text-gray-500 w-20">{log.time}</span>
                      <span className={`w-32 ${log.severity === 'error' ? 'text-red-400' :
                        log.severity === 'warning' ? 'text-yellow-400' :
                          'text-cyan-400'
                        }`}>
                        {log.action}
                      </span>
                      <span className="text-gray-400 flex-1">{log.file}</span>
                      <span className={`flex items-center gap-1 ${log.status === 'SUCCESS' ? 'text-green-400' :
                        log.status === 'FAILED' ? 'text-red-400' :
                          'text-yellow-400'
                        }`}>
                        {log.status === 'SUCCESS' ? <CheckCircle2 className="w-3 h-3" /> :
                          log.status === 'FAILED' ? <XCircle className="w-3 h-3" /> :
                            <AlertTriangle className="w-3 h-3" />}
                        {log.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>


          )}

        </main>

        <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        
        @keyframes gradient-x {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        
        @keyframes pulse-ring {
          0% {
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4);
          }
          70% {
            box-shadow: 0 0 0 6px rgba(34, 197, 94, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
          }
        }
        
        @keyframes shake {
          0%, 100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-5px);
          }
          75% {
            transform: translateX(5px);
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out;
        }
        
        .animate-slide-down {
          animation: slide-down 0.5s ease-out;
        }
        
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
        
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 3s ease infinite;
        }
        
        .animate-pulse-ring {
          animation: pulse-ring 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
        
        .animate-pulse-slow {
          animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        .animate-pulse-glow {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          box-shadow: 0 0 10px rgba(34, 197, 94, 0.3);
        }
        
        .glass-card {
          background: rgba(17, 24, 39, 0.7);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(75, 85, 99, 0.3);
        }
        
        .metric-card {
          background: rgba(17, 24, 39, 0.5);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(75, 85, 99, 0.3);
          transition: all 0.3s ease;
          cursor: default;
        }
        
        .metric-card:hover {
          border-color: rgba(34, 197, 94, 0.5);
          transform: translateY(-2px);
          background: rgba(17, 24, 39, 0.7);
        }
        
        .bg-300\\% {
          background-size: 300% 300%;
        }
        
        .delay-1000 {
          animation-delay: 1s;
        }
        
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
        
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
      </div>

      <PrivacyStatus />
    </>
  );
}