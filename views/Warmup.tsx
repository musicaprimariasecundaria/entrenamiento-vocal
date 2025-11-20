import React, { useState } from 'react';
import { Info, Wind, ArrowUpRight, Waves, BookOpen } from 'lucide-react';

interface Exercise {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  objective: string;
  icon: any;
  color: string;
}

const Warmup: React.FC = () => {
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  const exercises: Exercise[] = [
    {
      id: 1,
      title: "Lip Trill (Vibración Labial)",
      subtitle: "Desbloqueo y flujo de aire",
      description: "Junta los labios suavemente y expulsa aire haciéndolos vibrar (como el sonido de un motor 'Brrr'). Sin forzar la garganta.",
      objective: "Desliza el tono desde tus notas graves a las agudas y vuelve a bajar (Glissando).",
      icon: ArrowUpRight,
      color: "text-orange-400 bg-orange-500/20 border-orange-500/20"
    },
    {
      id: 2,
      title: "Humming (Boca Chiusa)",
      subtitle: "Resonancia y colocación",
      description: "Con la boca cerrada pero los dientes separados, emite una 'Mmm' suave. Debes sentir cosquilleo en los labios y nariz.",
      objective: "Mantén una nota cómoda y siente la vibración en tu 'máscara' facial.",
      icon: Waves,
      color: "text-emerald-400 bg-emerald-500/20 border-emerald-500/20"
    },
    {
      id: 3,
      title: "Sirena Vocal",
      subtitle: "Agilidad y extensión",
      description: "Imita el sonido de una sirena de ambulancia usando la vocal 'U'.",
      objective: "Cubre todo tu rango vocal sin cortes. Si sientes un salto (gallo), hazlo más suave y ligero.",
      icon: Wind,
      color: "text-indigo-400 bg-indigo-500/20 border-indigo-500/20"
    }
  ];

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
             <div className="w-2 h-8 bg-orange-500 rounded-full"></div>
             Pizarra de Calentamiento
          </h2>
          <p className="text-slate-400 text-lg">Guía visual para ejercicios dirigidos por el profesor.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Lista de Ejercicios (Izquierda) */}
        <div className="lg:col-span-5 space-y-4">
          {exercises.map((ex) => (
            <button
              key={ex.id}
              onClick={() => setSelectedExercise(ex)}
              className={`w-full text-left p-5 rounded-2xl border transition-all duration-200 flex items-center gap-4 group ${
                selectedExercise?.id === ex.id 
                ? 'bg-slate-800 border-white/20 shadow-xl scale-[1.02]' 
                : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${ex.color}`}>
                 <ex.icon size={24} />
              </div>
              <div>
                <h3 className={`font-bold text-lg ${selectedExercise?.id === ex.id ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                  {ex.title}
                </h3>
                <p className="text-sm text-slate-500 font-medium">{ex.subtitle}</p>
              </div>
            </button>
          ))}

          <div className="bg-indigo-900/20 p-5 rounded-2xl border border-indigo-500/20 mt-6">
             <div className="flex items-start gap-3">
               <Info className="text-indigo-400 shrink-0 mt-1" size={20} />
               <div className="text-sm text-indigo-200 space-y-2">
                  <p className="font-bold">Nota para el Profesor:</p>
                  <p>Use estas fichas para explicar la técnica y los objetivos antes de comenzar la práctica grupal.</p>
               </div>
             </div>
          </div>
        </div>

        {/* Panel de Detalle (Derecha) */}
        <div className="lg:col-span-7">
          <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-1 shadow-2xl h-full min-h-[400px] flex flex-col">
             {selectedExercise ? (
                <div className="flex flex-col h-full p-6 md:p-8">
                   {/* Cabecera Ejercicio */}
                   <div className="flex items-center gap-4 mb-6 border-b border-white/5 pb-6">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${selectedExercise.color.replace('bg-', 'bg-opacity-50 ')}`}>
                        <selectedExercise.icon size={32} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white">{selectedExercise.title}</h3>
                        <p className="text-slate-400">{selectedExercise.subtitle}</p>
                      </div>
                   </div>

                   {/* Contenido Instruccional */}
                   <div className="space-y-6 flex-grow">
                      <div className="bg-white/5 rounded-xl p-5 border border-white/5">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Técnica</h4>
                        <p className="text-slate-200 text-lg leading-relaxed">
                          {selectedExercise.description}
                        </p>
                      </div>
                      
                      <div className="bg-emerald-900/10 rounded-xl p-5 border border-emerald-500/10">
                        <h4 className="text-xs font-bold text-emerald-500/70 uppercase tracking-widest mb-2">Objetivo del Ejercicio</h4>
                        <p className="text-emerald-100/80 text-lg leading-relaxed font-medium">
                          {selectedExercise.objective}
                        </p>
                      </div>
                   </div>
                </div>
             ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500">
                   <BookOpen size={64} className="mb-4 opacity-20" />
                   <p className="text-xl font-medium text-slate-400">Selecciona un ejercicio</p>
                   <p className="text-sm mt-2 max-w-xs mx-auto">Elige una tarjeta de la izquierda para ver las instrucciones detalladas.</p>
                </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Warmup;