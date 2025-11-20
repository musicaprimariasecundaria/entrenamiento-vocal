
export const NOTE_NAMES = [
  "Do", "Do#", "Re", "Re#", "Mi", "Fa", "Fa#", "Sol", "Sol#", "La", "La#", "Si"
];

// Escala ajustada al rango solicitado: La2 (45) hasta Mi4 (64)
// Se incluyen notas cromáticas básicas de Do Mayor dentro de ese rango extendido
const C_MAJOR_SCALE = [
    45, 47, // La2, Si2
    48, 50, 52, 53, 55, 57, 59, // Do3 - Si3
    60, 62, 64 // Do4, Re4, Mi4
]; 

export interface NoteInfo {
  frequency: number;
  noteName: string;
  octave: number;
  midi: number;
  centsOff: number;
}

/**
 * Converts a frequency to the nearest musical note information.
 */
export const getNoteFromFrequency = (frequency: number): NoteInfo | null => {
  // Rango amplio para detectar bajos profundos y silbidos
  if (frequency < 50 || frequency > 2000) return null;

  const noteNum = 12 * (Math.log(frequency / 440) / Math.log(2));
  const midi = Math.round(noteNum) + 69;
  
  // Calculate deviation in cents
  const frequencyOfNote = 440 * Math.pow(2, (midi - 69) / 12);
  const centsOff = Math.floor(1200 * Math.log2(frequency / frequencyOfNote));

  const noteName = NOTE_NAMES[midi % 12];
  const octave = Math.floor(midi / 12) - 1;

  return {
    frequency,
    noteName,
    octave,
    midi,
    centsOff
  };
};

export const getFrequencyFromMidi = (midi: number): number => {
  return 440 * Math.pow(2, (midi - 69) / 12);
};

export const formatNote = (midi: number): string => {
  const noteName = NOTE_NAMES[midi % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${noteName}${octave}`;
};

/**
 * Generate a sequence of NATURAL notes with progressive intervals.
 */
export const generateSequence = (length: number, minMidi: number, maxMidi: number): number[] => {
  // Filtrar la escala para que esté dentro del rango del usuario
  const availableNotes = C_MAJOR_SCALE.filter(n => n >= minMidi && n <= maxMidi);
  
  // Fallback seguro si el rango es muy estrecho o erróneo
  if (availableNotes.length === 0) {
    return [48, 50, 52]; // Do3, Re3, Mi3 (Fallback por defecto)
  }

  const sequence: number[] = [];
  
  // Empezar en un punto aleatorio
  let startIndex = Math.floor(Math.random() * availableNotes.length);
  
  sequence.push(availableNotes[startIndex]);
  let currentIndex = startIndex;

  for (let i = 1; i < length; i++) {
    // Movimiento progresivo: Grados conjuntos (1) o terceras (2) máximo.
    const maxJump = 2; 
    
    let jump = Math.floor(Math.random() * maxJump) + 1; 
    const direction = Math.random() > 0.5 ? 1 : -1;
    
    let nextIndex = currentIndex + (direction * jump);

    // Rebote suave si se sale de límites
    if (nextIndex < 0) nextIndex = 1;
    if (nextIndex >= availableNotes.length) nextIndex = availableNotes.length - 2;

    currentIndex = nextIndex;
    sequence.push(availableNotes[currentIndex]);
  }
  
  return sequence;
};
