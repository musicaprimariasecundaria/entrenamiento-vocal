import React from 'react';
import { Info, Droplets, UserCheck, Heart } from 'lucide-react';

const Help: React.FC = () => {
  return (
    <div className="p-6 max-w-4xl mx-auto animate-fade-in">
      <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
        <div className="w-2 h-8 bg-slate-500 rounded-full"></div>
        Ayuda y Consejos
      </h2>

      <div className="grid md:grid-cols-2 gap-6">
        
        <div className="bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-white/10 hover:bg-white/10 transition-colors">
          <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400 mb-4 border border-blue-500/20">
            <UserCheck size={24} />
          </div>
          <h3 className="text-xl font-bold text-white mb-3">Postura Corporal</h3>
          <p className="text-slate-400 leading-relaxed">
            Mantén la espalda recta y los hombros relajados. Imagina un hilo tirando de tu cabeza hacia arriba. Una buena postura libera tu diafragma.
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-white/10 hover:bg-white/10 transition-colors">
          <div className="w-12 h-12 bg-cyan-500/20 rounded-2xl flex items-center justify-center text-cyan-400 mb-4 border border-cyan-500/20">
            <Droplets size={24} />
          </div>
          <h3 className="text-xl font-bold text-white mb-3">Hidratación</h3>
          <p className="text-slate-400 leading-relaxed">
            Tus cuerdas vocales necesitan agua. Bebe pequeños sorbos de agua a temperatura ambiente frecuentemente mientras practicas.
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-white/10 hover:bg-white/10 transition-colors">
          <div className="w-12 h-12 bg-pink-500/20 rounded-2xl flex items-center justify-center text-pink-400 mb-4 border border-pink-500/20">
            <Heart size={24} />
          </div>
          <h3 className="text-xl font-bold text-white mb-3">Descanso</h3>
          <p className="text-slate-400 leading-relaxed">
            La voz se cansa como cualquier músculo. Si sientes ronquera o molestia, guarda silencio y descansa. No susurres, eso cansa más la voz.
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-white/10 hover:bg-white/10 transition-colors">
          <div className="w-12 h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center text-amber-400 mb-4 border border-amber-500/20">
            <Info size={24} />
          </div>
          <h3 className="text-xl font-bold text-white mb-3">Uso de la App</h3>
          <p className="text-slate-400 leading-relaxed">
            Usa auriculares para escuchar mejor las referencias. En las rutinas, espera a que la app te indique que es tu turno.
          </p>
        </div>

      </div>

      <div className="mt-8 bg-slate-900/50 rounded-2xl p-8 border border-white/10">
        <h4 className="font-bold text-white mb-4 text-lg">Guía Rápida</h4>
        <ul className="list-disc list-inside text-slate-400 space-y-3">
          <li><span className="text-indigo-400 font-semibold">Mi Tesitura:</span> Canta fuerte y claro. Usa el botón "¡Esta es mi nota!" si la detección automática oscila mucho.</li>
          <li><span className="text-emerald-400 font-semibold">Rutinas:</span> La barra verde te indica cuánto tiempo debes mantener la nota afinada para aprobar.</li>
        </ul>
      </div>
    </div>
  );
};

export default Help;