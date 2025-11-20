import React, { useState, useEffect, useRef } from 'react';
import { audioEngine } from '../services/AudioEngine';
import TunerVisualizer from '../components/TunerVisualizer';
import { NoteInfo, formatNote } from '../utils/musicTheory';
import { Play, Save, RotateCcw, CheckCircle, ArrowDown, ArrowUp, Mic, Hand } from 'lucide-react';

interface VocalRangeProps {
  onSaveRange: (range: { low: string, high: string }) => void;
  savedRange: { low: string, high: string } | null;
}

const VocalRange: React.FC<VocalRangeProps> = ({ onSaveRange, savedRange }) => {
  const [step, setStep] = useState<'intro' | 'testing' | 'result'>('intro');
  const [isListening, setIsListening] = useState(false);
  const [currentNote, setCurrentNote] = useState<NoteInfo | null>(null);
  const [phase, setPhase] = useState<'low' | 'high'>('low');
  
  // Récords temporales
  const [recordLow, setRecordLow] = useState<NoteInfo | null>(null); 
  const [recordHigh, setRecordHigh] = useState<NoteInfo | null>(null);

  const intervalRef = useRef<number | null>(null);
  const stabilityCounter = useRef<number>(0);
  const lastMidiRef = useRef<number | null>(null);

  useEffect(() => {
    return () => stopTest();
  }, []);

  const startTest = async () => {
    try {
      await audioEngine.startMicrophone();
      setIsListening(true);
      setStep('testing');
      setPhase('low');
      setRecordLow(null);
      setRecordHigh(null);
      setCurrentNote(null);
      stabilityCounter.current = 0;
      lastMidiRef.current = null;
      
      intervalRef.current = window.setInterval(() => {
        const note = audioEngine.getPitch();
        setCurrentNote(note);

        if (note) {
          // Lógica de Estabilidad:
          if (note.midi === lastMidiRef.current) {
            stabilityCounter.current++;
          } else {
            stabilityCounter.current = 0;
            lastMidiRef.current = note.midi;
          }

          // Actualización automática de récord con estabilidad moderada (3 frames ~ 150ms)
          // Nota: También permitimos captura manual si la automática falla
          if (stabilityCounter.current > 3) {
             if (phase === 'low') {
                setRecordLow(prev => {
                  if (!prev) return note;
                  return note.midi < prev.midi ? note : prev;
                });
              } else {
                setRecordHigh(prev => {
                  if (!prev) return note;
                  return note.midi > prev.midi ? note : prev;
                });
              }
          }
        } else {
           stabilityCounter.current = 0;
           lastMidiRef.current = null;
        }
      }, 50);
    } catch (e) {
      alert("Necesitamos acceso al micrófono para esta función.");
    }
  };

  const stopTest = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    audioEngine.stopMicrophone();
    setIsListening(false);
  };

  const handlePhaseConfirm = () => {
    // Fallback: Si no hay récord automático pero el usuario está cantando una nota, usamos la nota actual
    const effectiveLow = recordLow || currentNote;
    const effectiveHigh = recordHigh || currentNote;

    if (phase === 'low') {
      if (!effectiveLow) return;
      setRecordLow(effectiveLow); // Asegurar que se guarda si venía de currentNote
      
      // Transición a fase aguda
      setPhase('high');
      stabilityCounter.current = 0;
    } else {
      if (!effectiveHigh) return;
      setRecordHigh(effectiveHigh); // Asegurar que se guarda

      // Finalizar
      stopTest();
      setStep('result');
      
      // Usamos los effective porque el state puede no haberse actualizado aún si era null
      // Nota: Si estamos en fase High, el recordLow ya debería existir.
      
      if (recordLow && effectiveHigh) {
        onSaveRange({
            low: formatNote(recordLow.midi),
            high: formatNote(effectiveHigh.midi)
        });
      } else if (effectiveLow && effectiveHigh) {
         // Caso borde donde ambos se confirman al final
         onSaveRange({
            low: formatNote(effectiveLow.midi),
            high: formatNote(effectiveHigh.midi)
        });
      }
    }
  };

  const manualCapture = () => {
      if (!currentNote) return;
      if (phase === 'low') {
          setRecordLow(currentNote);
      } else {
          setRecordHigh(currentNote);
      }
  };

  const resetPhase = () => {
    if (phase === 'low') setRecordLow(null);
    else setRecordHigh(null);
    stabilityCounter.current = 0;
  };

  const classifyVoice = (low: number, high: number) => {
    const center = (low + high) / 2;
    if (center >= 69) return "Voz Aguda (Tipo Soprano)";
    if (center >= 60) return "Voz Media-Aguda (Tipo Mezzo/Tenor)";
    if (center >= 53) return "Voz Media-Grave (Tipo Barítono)";
    return "Voz Grave (Tipo Bajo/Contralto)";
  };

  // Determinar si el botón de confirmar debe estar habilitado
  const canConfirm = phase === 'low' 
    ? (!!recordLow || !!currentNote) 
    : (!!recordHigh || !!currentNote);

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto animate-fade-in">
      <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
        <div className="w-2 h-8 bg-indigo-500 rounded-full"></div>
        Mi Tesitura
      </h2>

      {step === 'intro' && (
        <div className="bg-slate-900/50 backdrop-blur-lg border border-white/10 rounded-2xl p-8 shadow-2xl">
          <p className="text-slate-300 mb-8 text-lg leading-relaxed">
            Vamos a encontrar tu rango vocal. La prueba tiene dos partes:
          </p>
          <ul className="space-y-4 mb-8 text-slate-300">
             <li className="flex items-center gap-3">
                <div className="bg-indigo-500/20 p-2 rounded-lg text-indigo-400"><ArrowDown /></div>
                <span>1. Cantarás notas cada vez más <strong>graves</strong> hasta tu límite.</span>
             </li>
             <li className="flex items-center gap-3">
                <div className="bg-purple-500/20 p-2 rounded-lg text-purple-400"><ArrowUp /></div>
                <span>2. Cantarás notas cada vez más <strong>agudas</strong> hasta tu límite.</span>
             </li>
          </ul>
          
          {savedRange && (
            <div className="bg-emerald-900/20 p-4 rounded-xl mb-8 border border-emerald-500/30 flex items-center gap-4">
              <CheckCircle className="text-emerald-500" />
              <div>
                <div className="text-sm text-emerald-400 font-bold uppercase">Tesitura Guardada</div>
                <div className="text-white font-mono text-xl">{savedRange.low} - {savedRange.high}</div>
              </div>
            </div>
          )}

          <button 
            onClick={startTest}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg hover:shadow-indigo-500/25 flex items-center justify-center gap-3 text-lg"
          >
            <Mic size={24} fill="currentColor" />
            Iniciar Prueba
          </button>
        </div>
      )}

      {step === 'testing' && (
        <div className="space-y-6">
          {/* Header de Instrucciones */}
          <div className="text-center">
             <span className={`inline-block px-6 py-2 rounded-full font-bold text-sm uppercase tracking-widest shadow-lg mb-4 ${
                phase === 'low' 
                ? 'bg-indigo-500 text-white' 
                : 'bg-purple-500 text-white'
              }`}>
                {phase === 'low' ? 'Fase 1: Extensión Grave' : 'Fase 2: Extensión Aguda'}
             </span>
             <h3 className="text-2xl font-bold text-white mb-2">
                {phase === 'low' ? 'Baja el tono poco a poco' : 'Sube el tono poco a poco'}
             </h3>
             <p className="text-slate-400">
                {phase === 'low' 
                 ? 'Canta una "U" larga bajando hasta que tu voz se rompa.' 
                 : 'Sube con una "U" o "I" hasta tu nota más aguda.'}
             </p>
          </div>

          {/* Visualizador Principal */}
          <div className="bg-black/40 p-6 rounded-3xl border border-white/10 shadow-inner">
              <TunerVisualizer currentNote={currentNote} isListening={isListening} />
          </div>

          {/* Panel de Resultados en Tiempo Real */}
          <div className="grid grid-cols-2 gap-4">
             {/* Tarjeta Nota Actual */}
             <div 
                onClick={manualCapture}
                className="bg-slate-800/50 p-6 rounded-2xl border border-white/5 flex flex-col items-center justify-center active:scale-95 transition-transform cursor-pointer hover:bg-slate-800"
             >
                <span className="text-xs text-slate-500 uppercase font-bold mb-2 tracking-wider">Estás cantando</span>
                <span className={`text-4xl font-mono font-bold ${currentNote ? 'text-white' : 'text-slate-600'}`}>
                   {currentNote ? formatNote(currentNote.midi) : '--'}
                </span>
                {currentNote && (
                    <span className="text-[10px] text-indigo-400 mt-2 border border-indigo-500/30 px-2 py-1 rounded-full">Toca para fijar</span>
                )}
             </div>

             {/* Tarjeta Récord */}
             <div className={`p-6 rounded-2xl border flex flex-col items-center justify-center transition-all ${
                (phase === 'low' ? recordLow : recordHigh)
                ? 'bg-indigo-600 border-indigo-400 shadow-[0_0_30px_rgba(79,70,229,0.3)]'
                : 'bg-slate-800/50 border-slate-700 border-dashed'
             }`}>
                <span className="text-xs text-indigo-200 uppercase font-bold mb-2 tracking-wider">
                   {phase === 'low' ? 'Récord Grave' : 'Récord Agudo'}
                </span>
                <span className="text-4xl font-mono font-bold text-white">
                   {phase === 'low' 
                      ? (recordLow ? formatNote(recordLow.midi) : '--')
                      : (recordHigh ? formatNote(recordHigh.midi) : '--')
                   }
                </span>
             </div>
          </div>

          {/* Botonera de Control */}
          <div className="flex gap-4 pt-4">
             <button 
               onClick={resetPhase}
               className="px-6 py-4 bg-slate-800 text-slate-400 rounded-xl hover:bg-slate-700 hover:text-white transition-colors font-medium"
             >
               <RotateCcw size={20} />
             </button>

             <button 
               onClick={handlePhaseConfirm}
               disabled={!canConfirm}
               className={`flex-1 font-bold py-4 px-6 rounded-xl transition-all shadow-lg flex items-center justify-center gap-3 text-lg ${
                 canConfirm
                 ? 'bg-emerald-500 hover:bg-emerald-400 text-white cursor-pointer'
                 : 'bg-slate-800 text-slate-600 cursor-not-allowed opacity-50'
               }`}
             >
               {(phase === 'low' ? recordLow : recordHigh) 
                 ? (phase === 'low' ? '¡Confirmar Grave!' : '¡Confirmar Agudo!')
                 : 'Canta para confirmar...'
               }
               {canConfirm && <CheckCircle size={24} />}
             </button>
          </div>
        </div>
      )}

      {step === 'result' && recordLow && recordHigh && (
        <div className="bg-slate-900/80 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/10 text-center animate-in fade-in zoom-in duration-300">
          <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/30">
             <Save size={40} className="text-white" />
          </div>
          
          <h3 className="text-3xl font-bold text-white mb-2">¡Tesitura Guardada!</h3>
          <p className="text-slate-400 mb-8">Estos datos se usarán para personalizar tus ejercicios.</p>
          
          <div className="flex justify-center items-center gap-4 md:gap-12 mb-10 bg-white/5 p-6 rounded-2xl">
             <div className="text-center">
                <p className="text-xs text-indigo-400 uppercase font-bold mb-2">Nota Grave</p>
                <p className="text-4xl font-mono font-bold text-white">{formatNote(recordLow.midi)}</p>
             </div>
             <div className="h-12 w-px bg-slate-700"></div>
             <div className="text-center">
                <p className="text-xs text-purple-400 uppercase font-bold mb-2">Nota Aguda</p>
                <p className="text-4xl font-mono font-bold text-white">{formatNote(recordHigh.midi)}</p>
             </div>
          </div>

          <div className="bg-indigo-900/20 p-6 rounded-xl mb-8 border border-indigo-500/20">
            <p className="text-sm text-indigo-300 mb-2 uppercase tracking-widest font-bold">Tu Voz se aproxima a</p>
            <p className="font-bold text-white text-2xl">
              {classifyVoice(recordLow.midi, recordHigh.midi)}
            </p>
          </div>

          <button 
            onClick={() => setStep('intro')}
            className="text-slate-400 hover:text-white font-semibold py-3 px-6 rounded-lg hover:bg-white/5 transition-colors flex items-center gap-2 mx-auto"
          >
            <RotateCcw size={18} />
            Repetir prueba
          </button>
        </div>
      )}
    </div>
  );
};

export default VocalRange;