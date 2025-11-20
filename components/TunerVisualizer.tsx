import React from 'react';
import { NoteInfo } from '../utils/musicTheory';
import { Mic } from 'lucide-react';

interface TunerVisualizerProps {
  currentNote: NoteInfo | null;
  targetNoteName?: string; 
  isListening: boolean;
}

const TunerVisualizer: React.FC<TunerVisualizerProps> = ({ currentNote, targetNoteName, isListening }) => {
  if (!isListening) {
    return (
      <div className="h-32 w-full bg-slate-800/50 rounded-2xl flex items-center justify-center border-2 border-dashed border-slate-700">
        <div className="text-center text-slate-500">
          <Mic className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>Micrófono inactivo</p>
        </div>
      </div>
    );
  }

  // Si no hay nota detectada (o es silencio), mostrar estado de espera
  if (!currentNote) {
    return (
      <div className="h-32 w-full bg-black/20 rounded-2xl flex items-center justify-center shadow-inner border border-black/10">
        <p className="text-slate-500 animate-pulse font-medium tracking-wider">Escuchando...</p>
      </div>
    );
  }

  const cents = currentNote.centsOff;
  const isGreen = Math.abs(cents) <= 30; // Stricter for visual green
  const isYellow = Math.abs(cents) > 30 && Math.abs(cents) <= 50;
  
  let positionPercent = 50 + (cents); 
  positionPercent = Math.max(5, Math.min(95, positionPercent));

  let colorClass = "bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)] border-red-300";
  if (isGreen) colorClass = "bg-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.8)] border-white";
  else if (isYellow) colorClass = "bg-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.6)] border-yellow-100";

  const displayName = `${currentNote.noteName}${currentNote.octave}`;

  return (
    <div className="bg-slate-950 rounded-2xl p-6 shadow-2xl w-full max-w-md mx-auto border border-slate-800">
      <div className="text-center mb-6">
        <span className="text-7xl font-black text-white tracking-tighter drop-shadow-lg">
          {displayName}
        </span>
        <div className={`text-sm mt-2 font-bold px-3 py-1 rounded-full inline-block ${isGreen ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
          {cents > 0 ? `+${cents}` : cents} cents
        </div>
      </div>

      {/* Gauge */}
      <div className="relative h-6 bg-slate-800 rounded-full w-full overflow-hidden shadow-inner border border-slate-700">
        {/* Center Marker */}
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/30 transform -translate-x-1/2 z-10"></div>
        
        {/* Tolerance Zone */}
        <div className="absolute left-1/2 top-0 bottom-0 w-[30%] bg-emerald-500/10 transform -translate-x-1/2 border-x border-emerald-500/10"></div>

        {/* Indicator */}
        <div 
          className={`absolute top-1 bottom-1 w-4 rounded-full border-2 transform -translate-x-1/2 transition-all duration-100 ease-out ${colorClass} z-20`}
          style={{ left: `${positionPercent}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-slate-500 mt-2 px-1 font-bold uppercase tracking-widest">
        <span>♭ Grave</span>
        <span>Afinado</span>
        <span>Agudo ♯</span>
      </div>
    </div>
  );
};

export default TunerVisualizer;