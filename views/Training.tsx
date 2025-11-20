
import React, { useState, useEffect, useRef } from 'react';
import { audioEngine } from '../services/AudioEngine';
import { generateSequence, formatNote, getFrequencyFromMidi, NoteInfo } from '../utils/musicTheory';
import { RefreshCw, Trophy, Volume2, Play, ArrowRight, Mic, Clock } from 'lucide-react';

interface TrainingProps {
  savedRange: { low: string, high: string } | null;
}

type ExerciseState = 'setup' | 'playing' | 'waiting_for_silence' | 'listening' | 'feedback';

const Training: React.FC<TrainingProps> = ({ savedRange }) => {
  const [gameState, setGameState] = useState<ExerciseState>('setup');
  const [level, setLevel] = useState(2);
  const [sequence, setSequence] = useState<number[]>([]);
  
  // REF CRITICA: Mantiene la secuencia actualizada dentro de los closures (setInterval/setTimeout)
  // Soluciona el bug donde la segunda rutina validaba contra las notas de la primera.
  const sequenceRef = useRef<number[]>([]);

  const [currentPlayIndex, setCurrentPlayIndex] = useState(-1);
  
  const [userNoteIndex, setUserNoteIndex] = useState(0); 
  const [results, setResults] = useState<{target: number, sung: number | null, cents: number | null, success: boolean}[]>([]);
  const [currentNote, setCurrentNote] = useState<NoteInfo | null>(null);
  
  // UI State for progress bar
  const [progressScore, setProgressScore] = useState(0); 
  
  // Refs for logic loops (avoids closure staleness and side-effect issues)
  const currentScoreRef = useRef(0);
  const detectionTimerRef = useRef<number | null>(null);
  const listeningStartTimeRef = useRef<number>(0);

  const [bestStreak, setBestStreak] = useState(() => {
    return parseInt(localStorage.getItem('vocalTrainer_streak') || '0');
  });

  useEffect(() => {
    return () => stopAll();
  }, []);

  const stopAll = () => {
    if (detectionTimerRef.current) clearInterval(detectionTimerRef.current);
    audioEngine.stopMicrophone();
  };

  const generateRoutine = () => {
    // Rango amplio para asegurar variedad: La2 (45) hasta Mi4 (64)
    let minMidi = 45; 
    let maxMidi = 64; 
    
    const newSequence = generateSequence(level, minMidi, maxMidi);
    setSequence(newSequence);
    sequenceRef.current = newSequence; // Actualizamos la referencia inmediatamente

    setResults(newSequence.map(n => ({ target: n, sung: null, cents: null, success: false })));
    setGameState('playing');
    playSequence(newSequence);
  };

  const playSequence = async (seq: number[]) => {
    stopAll();
    await audioEngine.initialize();
    setCurrentPlayIndex(-1);

    let i = 0;
    const playNext = () => {
      if (i >= seq.length) {
        setCurrentPlayIndex(-1);
        setGameState('waiting_for_silence');
        setTimeout(() => {
           setGameState('listening');
           startListening();
        }, 1500); 
        return;
      }
      setCurrentPlayIndex(i);
      const freq = getFrequencyFromMidi(seq[i]);
      audioEngine.playTone(freq, 0.8); 
      i++;
      setTimeout(playNext, 1200); 
    };
    
    setTimeout(playNext, 500);
  };

  const startListening = async () => {
    try {
      await audioEngine.startMicrophone();
      setUserNoteIndex(0);
      currentScoreRef.current = 0;
      setProgressScore(0);
      startNoteDetectionCycle(0);
    } catch (e) {
      alert("Error micrófono");
    }
  };

  const startNoteDetectionCycle = (index: number) => {
    // Usamos sequenceRef.current para asegurar que leemos la secuencia de la rutina ACTUAL
    // y no una versión "stale" (vieja) capturada por el closure.
    const currentSeq = sequenceRef.current;

    if (index >= currentSeq.length) {
      finishRoutine();
      return;
    }

    if (detectionTimerRef.current) clearInterval(detectionTimerRef.current);

    setUserNoteIndex(index);
    
    // Reset Score for new note
    currentScoreRef.current = 0;
    setProgressScore(0); 
    
    const targetMidi = currentSeq[index]; // Leemos del Ref
    const WARMUP_MS = 500; 
    
    const now = Date.now();
    listeningStartTimeRef.current = now + WARMUP_MS;

    const SCORE_TARGET = 100;
    // AUMENTADO: Hacemos la barra más rápida. 
    // 10 puntos cada 50ms = 500ms (0.5s) para completar.
    const SCORE_INCREMENT = 10; 

    detectionTimerRef.current = window.setInterval(() => {
      const currentTime = Date.now();
      if (currentTime < listeningStartTimeRef.current) return;

      const detected = audioEngine.getPitch();
      setCurrentNote(detected);

      if (detected) {
        // LÓGICA DE TOLERANCIA DE OCTAVA
        const midiDiff = Math.abs(detected.midi - targetMidi);
        const isOctaveMatch = midiDiff % 12 === 0; 
        
        // Tolerancia amplia (80 cents) para asegurar que detecte si el usuario afina razonablemente
        const isTuned = Math.abs(detected.centsOff) <= 80;

        if (isOctaveMatch && isTuned) {
           // ACUMULACIÓN POSITIVA (Logic Score)
           currentScoreRef.current += SCORE_INCREMENT;
           
           // Actualizar UI
           const visualScore = Math.min(SCORE_TARGET, currentScoreRef.current);
           setProgressScore(visualScore);

           // Verificar Éxito
           if (currentScoreRef.current >= SCORE_TARGET) {
             handleSuccess(index, detected);
           }
        }
      }
      // Si desafina, el score se mantiene (pausa), no baja.
    }, 50);
  };

  const handleSuccess = (index: number, note: NoteInfo) => {
    // DETENER INMEDIATAMENTE el timer para evitar múltiples llamadas
    if (detectionTimerRef.current) {
        clearInterval(detectionTimerRef.current);
        detectionTimerRef.current = null;
    }
    
    setResults(prev => {
      const copy = [...prev];
      // Usamos sequenceRef.current para asegurar consistencia
      const target = sequenceRef.current[index] || 0;
      copy[index] = { target: target, sung: note.midi, cents: note.centsOff, success: true };
      return copy;
    });

    // Sonido de éxito inmediato
    audioEngine.playTone(880, 0.1); 
    
    // Pequeña pausa antes de la siguiente nota
    setTimeout(() => {
      startNoteDetectionCycle(index + 1);
    }, 500);
  };

  const finishRoutine = () => {
    audioEngine.stopMicrophone();
    setCurrentNote(null);
    setGameState('feedback');
  };
  
  useEffect(() => {
    if (gameState === 'feedback') {
      const successCount = results.filter(r => r.success).length;
      if (successCount === sequence.length && sequence.length > 0) {
        const newStreak = bestStreak + 1;
        setBestStreak(newStreak);
        localStorage.setItem('vocalTrainer_streak', newStreak.toString());
      }
    }
  }, [gameState, sequence.length, bestStreak, results]);


  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
           <div className="w-2 h-8 bg-emerald-500 rounded-full"></div>
           Entrenamiento
        </h2>
        <div className="flex items-center gap-2 bg-yellow-500/10 px-4 py-2 rounded-full border border-yellow-500/20 text-yellow-400">
          <Trophy size={16} />
          <span className="font-bold text-sm">Racha: {bestStreak}</span>
        </div>
      </div>

      {gameState === 'setup' && (
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-white/10">
          <p className="text-slate-300 mb-8 text-lg">
            Escucha la melodía y repite cada nota a tu ritmo.
          </p>

          <div className="bg-indigo-900/30 p-4 rounded-xl border border-indigo-500/30 mb-8 flex gap-4 items-start">
             <Clock className="text-indigo-400 shrink-0 mt-1" />
             <div>
               <p className="text-white font-bold">Importante:</p>
               <p className="text-indigo-200 text-sm mt-1">
                 Cuando aciertes la nota, <strong className="text-white underline">mantén el sonido unos segundos</strong> hasta que la barra lateral se llene por completo.
               </p>
             </div>
          </div>
          
          <div className="mb-8">
            <label className="block text-sm font-bold text-slate-400 mb-4 uppercase tracking-wider">Dificultad (Número de Notas)</label>
            <div className="grid grid-cols-4 gap-4">
              {[2, 3, 4, 5].map(lvl => (
                <button
                  key={lvl}
                  onClick={() => setLevel(lvl)}
                  className={`py-4 rounded-xl border transition-all font-bold text-lg ${
                    level === lvl 
                    ? 'border-indigo-500 bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.3)]' 
                    : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={generateRoutine}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-3 text-lg transition-all"
          >
            <Play size={24} fill="currentColor" />
            Generar Rutina
          </button>
        </div>
      )}

      {gameState !== 'setup' && (
        <div className="space-y-8">
          
          {/* Sequence Visualizer */}
          <div className="flex justify-center gap-3 md:gap-6 mb-8 flex-wrap">
            {sequence.map((midi, idx) => {
              let statusColor = "bg-white/5 border-white/10 text-slate-500";
              let scale = "scale-100";
              let content = formatNote(midi);

              if (gameState === 'playing') {
                if (idx === currentPlayIndex) {
                  statusColor = "bg-indigo-500 border-indigo-400 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)]";
                  scale = "scale-110 -translate-y-2";
                }
              } else if (gameState === 'waiting_for_silence') {
                  statusColor = "bg-slate-700 border-slate-600 text-slate-400";
              } else if (gameState === 'listening') {
                 if (idx === userNoteIndex) {
                    statusColor = "bg-white border-white text-indigo-900 shadow-[0_0_30px_rgba(255,255,255,0.2)]";
                    scale = "scale-110 -translate-y-2";
                 } else if (idx < userNoteIndex) {
                    const res = results[idx];
                    if (res && res.success) statusColor = "bg-emerald-500 border-emerald-400 text-white";
                    else statusColor = "bg-red-500 border-red-400 text-white";
                 }
              } else if (gameState === 'feedback') {
                 const res = results[idx];
                 if (res && res.success) statusColor = "bg-emerald-500 border-emerald-400 text-white";
                 else statusColor = "bg-red-500 border-red-400 text-white";
              }

              return (
                <div 
                  key={idx} 
                  className={`w-20 h-24 md:w-24 md:h-28 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all duration-300 ${statusColor} ${scale} shadow-lg relative overflow-hidden`}
                >
                  <span className="text-2xl md:text-3xl font-bold">{content}</span>
                  {gameState === 'playing' && idx === currentPlayIndex && (
                     <div className="opacity-70">
                        <Volume2 size={16} className="animate-pulse" />
                     </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Main Interaction Area */}
          <div className="bg-slate-900/50 backdrop-blur-md rounded-3xl p-8 border border-white/10 shadow-2xl min-h-[300px] flex flex-col items-center justify-center relative overflow-hidden">
            
            {gameState === 'playing' && (
              <div className="text-center">
                <div className="w-24 h-24 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                   <Volume2 className="w-12 h-12 text-indigo-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Escucha atentamente...</h3>
                <p className="text-slate-400">Memoriza la afinación.</p>
              </div>
            )}

            {gameState === 'waiting_for_silence' && (
              <div className="text-center animate-bounce">
                 <p className="text-xl font-bold text-slate-300">¡Prepárate!</p>
              </div>
            )}

            {gameState === 'listening' && (
              <div className="w-full flex flex-col items-center animate-fade-in">
                <div className="mb-6 flex items-center gap-2 bg-indigo-500/20 px-6 py-2 rounded-full border border-indigo-500/30">
                    <Mic className="text-indigo-400 animate-pulse" size={20} />
                    <h3 className="text-xl font-bold text-indigo-100">¡Canta cuando quieras!</h3>
                </div>

                <div className="w-full flex gap-8 items-center justify-center max-w-2xl">
                    {/* Panel Karaoke */}
                    <div className="flex-grow relative h-64 bg-slate-800/80 rounded-2xl border border-slate-700 overflow-hidden shadow-inner">
                        {/* Lineas de referencia */}
                        <div className="absolute w-full h-px bg-slate-600 top-1/4 border-t border-dashed border-slate-600 opacity-50"></div>
                        <div className="absolute w-full h-px bg-slate-600 bottom-1/4 border-t border-dashed border-slate-600 opacity-50"></div>
                        
                        {/* ZONA OBJETIVO (CENTRO) */}
                        <div className={`absolute w-full h-1/4 top-[37.5%] border-y-2 transition-colors duration-200 flex items-center justify-center ${progressScore > 5 ? 'bg-emerald-500/20 border-emerald-500/50' : 'bg-slate-700/50 border-white/20'}`}>
                            <span className="text-4xl font-black text-white opacity-90 drop-shadow-lg">
                                {formatNote(sequence[userNoteIndex])}
                            </span>
                        </div>

                        {/* Instrucción de MANTENER (Sólo visible cuando la nota es correcta) */}
                        {currentNote && (() => {
                             const target = sequenceRef.current[userNoteIndex];
                             // Use ref or safe fallback, though sequence state should match ref by now in render
                             const midiDiff = Math.abs(currentNote.midi - (target || 0));
                             return (midiDiff % 12 === 0 && Math.abs(currentNote.centsOff) <= 80);
                        })() && (
                           <div className="absolute bottom-4 left-0 right-0 text-center z-10 pointer-events-none">
                              <span className="text-emerald-400 font-bold text-sm uppercase tracking-widest animate-pulse bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">
                                 ¡Mantén el tono!
                              </span>
                           </div>
                        )}

                        {/* Cursor del Usuario (Burbuja) */}
                        {currentNote ? (
                            (() => {
                                const targetMidi = sequence[userNoteIndex];
                                
                                // Lógica de Anclaje Visual (Visual Snap)
                                const midiDiff = Math.abs(currentNote.midi - targetMidi);
                                const isOctaveMatch = midiDiff % 12 === 0;
                                const isTuned = Math.abs(currentNote.centsOff) <= 80;

                                let diff = 0;

                                if (isOctaveMatch && isTuned) {
                                    // ANCLAJE: Si es la nota correcta, diff = 0 (Centro perfecto)
                                    diff = 0;
                                } else {
                                    // Calcular distancia visual aproximada
                                    let adjustedTarget = targetMidi;
                                    // Ajustar octava más cercana para visualización
                                    while (adjustedTarget < currentNote.midi - 6) adjustedTarget += 12;
                                    while (adjustedTarget > currentNote.midi + 6) adjustedTarget -= 12;
                                    
                                    diff = ((currentNote.midi - adjustedTarget) * 100) + currentNote.centsOff;
                                }
                                
                                let percent = 50 - (diff / 200) * 100; // Sensibilidad visual reducida para estabilidad
                                percent = Math.max(10, Math.min(90, percent));
                                
                                const isSuccess = isOctaveMatch && isTuned;

                                return (
                                    <div 
                                        className={`absolute left-4 right-4 h-12 rounded-full border-4 transition-all duration-200 shadow-[0_0_20px_currentColor] flex items-center justify-center ${isSuccess ? 'bg-emerald-400 border-white text-emerald-900 scale-105' : 'bg-yellow-400 border-yellow-200 text-yellow-900'}`}
                                        style={{ top: `${percent}%`, transform: 'translateY(-50%)' }}
                                    >
                                        <span className="font-bold text-xs">{isSuccess ? '¡MUY BIEN!' : (diff > 0 ? 'Alto' : 'Bajo')}</span>
                                    </div>
                                )
                            })()
                        ) : (
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-slate-500 text-sm animate-pulse">
                                Canta ahora...
                            </div>
                        )}
                    </div>

                    {/* Barra de progreso lateral (SCORE) */}
                    <div className="h-64 w-6 bg-slate-800 rounded-full overflow-hidden border border-slate-700 relative shadow-inner">
                        <div 
                            className="absolute bottom-0 w-full bg-gradient-to-t from-emerald-600 to-emerald-400 transition-all duration-75 ease-linear"
                            style={{ height: `${progressScore}%` }} 
                        ></div>
                    </div>
                </div>
              </div>
            )}

            {gameState === 'feedback' && (
              <div className="text-center w-full animate-fade-in">
                 <div className="mb-6">
                    <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400 animate-bounce"><Trophy size={48} /></div>
                 </div>
                 <h3 className="text-3xl font-bold text-white mb-2">
                   ¡Rutina Completada! 🎉
                 </h3>
                 <p className="text-slate-400 mb-8 text-lg">
                   Has superado todas las notas.
                 </p>
                 
                 <div className="flex gap-4 max-w-md mx-auto">
                   <button 
                     onClick={() => playSequence(sequence)} 
                     className="flex-1 bg-white/10 hover:bg-white/20 text-white font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                   >
                     <Volume2 size={20} /> Repetir
                   </button>
                   <button 
                     onClick={() => setGameState('setup')}
                     className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-4 rounded-xl shadow-lg hover:shadow-indigo-500/25 transition-all flex items-center justify-center gap-2"
                   >
                     Siguiente <ArrowRight size={20} />
                   </button>
                 </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Training;
