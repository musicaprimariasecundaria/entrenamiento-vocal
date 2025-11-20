import React, { useState, useEffect } from 'react';
import { Music, Activity, HelpCircle, Mic2, Menu, X, Flame } from 'lucide-react';
import VocalRange from './views/VocalRange';
import Training from './views/Training';
import Help from './views/Help';
import Warmup from './views/Warmup';

type View = 'home' | 'range' | 'warmup' | 'training' | 'help';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('home');
  const [savedRange, setSavedRange] = useState<{low: string, high: string} | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('vocalTrainer_range');
    if (stored) {
      setSavedRange(JSON.parse(stored));
    }
  }, []);

  const handleSaveRange = (range: { low: string, high: string }) => {
    setSavedRange(range);
    localStorage.setItem('vocalTrainer_range', JSON.stringify(range));
  };

  const NavItem = ({ view, label, icon: Icon }: { view: View, label: string, icon: any }) => (
    <button
      onClick={() => {
        setCurrentView(view);
        setMobileMenuOpen(false);
      }}
      className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 text-sm md:text-base font-medium ${
        currentView === view 
          ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]' 
          : 'text-slate-400 hover:text-white hover:bg-white/10'
      }`}
    >
      <Icon size={18} />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-md sticky top-0 z-50 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white cursor-pointer group" onClick={() => setCurrentView('home')}>
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-2 rounded-xl shadow-lg group-hover:scale-105 transition-transform">
              <Music size={24} />
            </div>
            <h1 className="text-lg md:text-xl font-bold tracking-tight hidden xs:block bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              Entrenador Vocal
            </h1>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex gap-2">
            <NavItem view="home" label="Inicio" icon={Music} />
            <NavItem view="range" label="Mi Tesitura" icon={Mic2} />
            <NavItem view="warmup" label="Calentamiento" icon={Flame} />
            <NavItem view="training" label="Rutinas" icon={Activity} />
            <NavItem view="help" label="Ayuda" icon={HelpCircle} />
          </nav>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 text-slate-300 hover:bg-white/10 rounded-lg"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 w-full bg-slate-900 border-b border-white/10 shadow-2xl py-4 px-4 flex flex-col gap-2 animate-in slide-in-from-top-2">
            <NavItem view="home" label="Inicio" icon={Music} />
            <NavItem view="range" label="Mi Tesitura" icon={Mic2} />
            <NavItem view="warmup" label="Calentamiento" icon={Flame} />
            <NavItem view="training" label="Rutinas" icon={Activity} />
            <NavItem view="help" label="Ayuda" icon={HelpCircle} />
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-grow w-full max-w-6xl mx-auto py-8 px-4 md:px-8">
        {currentView === 'home' && (
          <div className="text-center py-12 md:py-20 max-w-4xl mx-auto animate-fade-in">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold tracking-wide uppercase mb-6">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
              v 2.0 Dark Mode
            </div>
            <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight leading-tight">
              Domina tu voz, <br/>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                mejora tu oído musical.
              </span>
            </h2>
            <p className="text-lg text-slate-400 mb-12 leading-relaxed max-w-2xl mx-auto">
              Herramienta profesional y gratuita para estudiantes de música. Descubre tu rango real, entrena tu afinación y calienta tu voz con ejercicios interactivos.
            </p>
            
            <div className="grid sm:grid-cols-3 gap-6">
              <div 
                onClick={() => setCurrentView('range')}
                className="bg-white/5 backdrop-blur-sm p-8 rounded-3xl border border-white/10 hover:border-indigo-500/50 cursor-pointer transition-all group hover:-translate-y-1 hover:bg-white/10"
              >
                <div className="w-14 h-14 bg-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform border border-indigo-500/20">
                  <Mic2 size={28} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Tesitura</h3>
                <p className="text-slate-400 text-sm">Mide tu rango vocal exacto en graves y agudos.</p>
              </div>

              <div 
                onClick={() => setCurrentView('warmup')}
                className="bg-white/5 backdrop-blur-sm p-8 rounded-3xl border border-white/10 hover:border-orange-500/50 cursor-pointer transition-all group hover:-translate-y-1 hover:bg-white/10"
              >
                <div className="w-14 h-14 bg-orange-500/20 text-orange-400 rounded-2xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform border border-orange-500/20">
                  <Flame size={28} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Calentamiento</h3>
                <p className="text-slate-400 text-sm">Ejercicios de sirenas y vibración para cuidar tu voz.</p>
              </div>

              <div 
                onClick={() => setCurrentView('training')}
                className="bg-white/5 backdrop-blur-sm p-8 rounded-3xl border border-white/10 hover:border-emerald-500/50 cursor-pointer transition-all group hover:-translate-y-1 hover:bg-white/10"
              >
                <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform border border-emerald-500/20">
                  <Activity size={28} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Rutinas</h3>
                <p className="text-slate-400 text-sm">Juegos auditivos con feedback en tiempo real.</p>
              </div>
            </div>
          </div>
        )}

        {currentView === 'range' && (
          <VocalRange onSaveRange={handleSaveRange} savedRange={savedRange} />
        )}

        {currentView === 'training' && (
          <Training savedRange={savedRange} />
        )}

        {currentView === 'warmup' && (
          <Warmup />
        )}

        {currentView === 'help' && (
          <Help />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 mt-auto">
        <div className="max-w-5xl mx-auto px-4 text-center text-slate-500 text-sm">
          <p className="font-medium">Entrenador Vocal Interactivo</p>
          <p className="mt-1 opacity-50">Desarrollado para Educación Musical</p>
        </div>
      </footer>
    </div>
  );
};

export default App;