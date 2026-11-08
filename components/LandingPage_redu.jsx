// components/LandingPage.jsx (Next.js / React Web)
import React from 'react';
import { 
  ArrowRight, 
  Download, 
  Globe, 
  ShieldCheck, 
  TrendingUp, 
  Smartphone, 
  Lock,
  Layers
} from 'lucide-react';

export default function LandingPage({ onLaunchWebApp }) {
  const handleDownloadApk = () => {
    // Replace with your hosted APK URL or Play Store link
    const apkUrl = "/downloads/westcott-reserve.apk";
    const link = document.createElement("a");
    link.href = apkUrl;
    link.setAttribute("download", "WestcottReserve.apk");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-white flex flex-col font-sans selection:bg-[#7052FF] selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 backdrop-blur-md sticky top-0 z-50 bg-[#0F172A]/90">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#7052FF] flex items-center justify-center font-extrabold text-xl shadow-lg shadow-[#7052FF]/30">
              WR
            </div>
            <span className="text-xl font-extrabold tracking-tight">Westcott Reserve</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleDownloadApk}
              className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-sm font-semibold transition-all"
            >
              <Download className="w-4 h-4 text-[#7052FF]" />
              Android APK
            </button>
            <button
              onClick={onLaunchWebApp}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7052FF] hover:bg-[#5e3ffd] text-sm font-bold shadow-lg shadow-[#7052FF]/25 transition-all"
            >
              Log In Web
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Cover Page Section */}
      <section className="relative overflow-hidden pt-16 pb-24 lg:pt-24 lg:pb-32">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#7052FF]/15 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs font-bold uppercase tracking-wider mb-6">
              <Lock className="w-3.5 h-3.5" /> Next-Gen Mobile & Web Banking Simulator
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6">
              Smart Financial Engineering on <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7052FF] to-purple-400">Web & Android.</span>
            </h1>

            <p className="text-lg text-slate-400 max-w-2xl mx-auto lg:mx-0 mb-10 leading-relaxed">
              Experience seamless cross-platform asset simulation. Manage target vaults, track multi-currency balances, and execute instant transactions anywhere.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <button
                onClick={onLaunchWebApp}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#7052FF] hover:bg-[#5e3ffd] font-bold text-base shadow-xl shadow-[#7052FF]/30 flex items-center justify-center gap-3 transition-all"
              >
                Open Web Console
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                onClick={handleDownloadApk}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 font-bold text-base flex items-center justify-center gap-3 transition-all"
              >
                <Smartphone className="w-5 h-5 text-purple-400" />
                Download Android App
              </button>
            </div>

            <p className="text-xs text-slate-500 mt-4">
              * Android APK v1.0.0 • No device permissions required • Safe Sandbox Environment
            </p>
          </div>

          {/* Optimized Web UI Showcase Preview */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-[340px] rounded-[40px] border-[8px] border-slate-800 bg-slate-900 shadow-2xl p-4 overflow-hidden">
              <div className="w-32 h-4 bg-slate-800 rounded-full mx-auto mb-6" />
              
              {/* Card Preview Mockup */}
              <div className="bg-[#1E1938] rounded-2xl p-5 border border-purple-900/50 mb-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs text-slate-400">Main Balance</span>
                  <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-md font-mono">
                    WR-88492019
                  </span>
                </div>
                <div className="text-3xl font-extrabold text-white mb-6">$250,000.00</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-800/60 rounded-xl py-2.5 text-center text-xs font-bold text-slate-200">
                    Receive ↙
                  </div>
                  <div className="bg-[#7052FF] rounded-xl py-2.5 text-center text-xs font-bold text-white">
                    Send ↗
                  </div>
                </div>
              </div>

              {/* Quick Action Row */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[
                  { name: 'Stocks', color: 'text-purple-400' },
                  { name: 'Pay Bills', color: 'text-amber-400' },
                  { name: 'Savings', color: 'text-pink-400' },
                  { name: 'Global', color: 'text-emerald-400' },
                ].map((item) => (
                  <div key={item.name} className="bg-slate-800/40 rounded-xl p-2.5 text-center border border-slate-800">
                    <div className={`w-7 h-7 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold ${item.color}`}>
                      ★
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 font-medium">{item.name}</div>
                  </div>
                ))}
              </div>

              <div className="bg-slate-800/30 rounded-2xl p-4 border border-slate-800">
                <div className="flex justify-between items-center text-xs font-bold mb-2">
                  <span>Recent Activity</span>
                  <span className="text-[#7052FF]">See All</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-800/60 text-xs">
                    <div>
                      <div className="font-semibold">Direct Transfer</div>
                      <div className="text-[10px] text-slate-500">Completed</div>
                    </div>
                    <span className="text-emerald-400 font-bold">+$1,000.00</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Optimized Features Section */}
      <section className="py-20 border-t border-slate-800/60 bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold tracking-tight mb-4">Optimized For Every Screen</h2>
            <p className="text-slate-400 text-sm">
              Whether on desktop, tablet, or mobile native Android, access real-time financial tracking with full high-density responsive support.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-900/80 border border-slate-800 p-8 rounded-3xl hover:border-[#7052FF]/50 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-[#7052FF] flex items-center justify-center mb-6">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold mb-2">Sabistok Trading</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Simulate equities, index allocations, and portfolio tracking with zero financial risk.
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-8 rounded-3xl hover:border-emerald-500/50 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-6">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold mb-2">Global Currency Vaults</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Hold and manage virtual USD, EUR, and GBP balances with instant conversion insights.
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-8 rounded-3xl hover:border-amber-500/50 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-6">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold mb-2">Zero-Permission Privacy</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Built strictly clean. No device scanning, location tracking, or background storage access.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 py-10 bg-[#0A0F1D]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#7052FF] flex items-center justify-center font-bold text-sm">
              WR
            </div>
            <span className="text-sm font-bold text-slate-300">Westcott Reserve Platform</span>
          </div>

          <p className="text-xs text-slate-500 text-center md:text-left">
            © 2026 Westcott Reserve. Educational & prototype demonstration application.
          </p>

          <div className="flex items-center gap-4 text-xs font-semibold text-slate-400">
            <button onClick={onLaunchWebApp} className="hover:text-white transition-colors">Web Console</button>
            <span>•</span>
            <button onClick={handleDownloadApk} className="hover:text-white transition-colors">Android Download</button>
          </div>
        </div>
      </footer>
    </div>
  );
}