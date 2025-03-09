// types.ts

// types.ts

export interface DifficultyLevel {
    name: string;
    bpmRange: [number, number];
    timingWindow: number;
    icon: string;
}

export interface Rhythm {
    name: string;
    beatsPerMeasure: number;
    noteValue: number; // e.g., 4 for quarter notes, 8 for eighth notes
    icon: string;
}


