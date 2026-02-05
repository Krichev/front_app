/**
 * Sample song data for Vibration Quiz testing
 *
 * These songs have distinctive, recognizable rhythm patterns that
 * work well for the "guess the song by vibration" concept.
 *
 * @module features/VibrationQuiz/data/sampleSongs
 */

import type { VibrationSongQuestion, RhythmPatternDTO } from '../model/types';

// ============================================================================ 
// RHYTHM PATTERNS
// ============================================================================ 

/**
 * "We Will Rock You" - Queen
 * Iconic stomp-stomp-clap pattern
 * Pattern: BOOM BOOM CLAP (rest) BOOM BOOM CLAP
 */
const weWillRockYouPattern: RhythmPatternDTO = {
    version: 1,
    onsetTimesMs: [0, 400, 800, 1600, 2000, 2400, 3200],
    intervalsMs: [400, 400, 800, 400, 400, 800],
    estimatedBpm: 81,
    timeSignature: '4/4',
    totalBeats: 7,
    trimmedStartMs: 0,
    trimmedEndMs: 3200,
    originalDurationMs: 3200,
};

/**
 * "Seven Nation Army" - The White Stripes
 * Famous bass riff rhythm
 * Pattern: da-da-da-da DA da daaaa
 */
const sevenNationArmyPattern: RhythmPatternDTO = {
    version: 1,
    onsetTimesMs: [0, 500, 1000, 1500, 2000, 2750, 3500],
    intervalsMs: [500, 500, 500, 500, 750, 750],
    estimatedBpm: 124,
    timeSignature: '4/4',
    totalBeats: 7,
    trimmedStartMs: 0,
    trimmedEndMs: 3500,
    originalDurationMs: 3500,
};

/**
 * "Smoke on the Water" - Deep Purple
 * Classic guitar riff
 * Pattern: da-da-DAAA, da-da-da-DAAA, da-da-DAAA, da-DAAA
 */
const smokeOnTheWaterPattern: RhythmPatternDTO = {
    version: 1,
    onsetTimesMs: [0, 250, 500, 1000, 1250, 1500, 1750, 2250, 2500, 2750, 3250, 3500],
    intervalsMs: [250, 250, 500, 250, 250, 250, 500, 250, 250, 500, 250],
    estimatedBpm: 112,
    timeSignature: '4/4',
    totalBeats: 12,
    trimmedStartMs: 0,
    trimmedEndMs: 3500,
    originalDurationMs: 3500,
};

/**
 * "Another One Bites the Dust" - Queen
 * Funky bass line rhythm
 * Pattern: dun dun dun, da-da-dun-dun, dun dun
 */
const anotherOneBitesTheDustPattern: RhythmPatternDTO = {
    version: 1,
    onsetTimesMs: [0, 250, 500, 1000, 1125, 1250, 1500, 2000, 2250],
    intervalsMs: [250, 250, 500, 125, 125, 250, 500, 250],
    estimatedBpm: 110,
    timeSignature: '4/4',
    totalBeats: 9,
    trimmedStartMs: 0,
    trimmedEndMs: 2250,
    originalDurationMs: 2250,
};

/**
 * "Eye of the Tiger" - Survivor
 * Driving rock rhythm
 * Pattern: da da da, da da daaa, da da da, da da daaa
 */
const eyeOfTheTigerPattern: RhythmPatternDTO = {
    version: 1,
    onsetTimesMs: [0, 200, 400, 800, 1000, 1400, 1800, 2000, 2200, 2600, 2800, 3200],
    intervalsMs: [200, 200, 400, 200, 400, 400, 200, 200, 400, 200, 400],
    estimatedBpm: 108,
    timeSignature: '4/4',
    totalBeats: 12,
    trimmedStartMs: 0,
    trimmedEndMs: 3200,
    originalDurationMs: 3200,
};

/**
 * "Billie Jean" - Michael Jackson
 * Signature drum pattern
 * Pattern: kick-hat-snare-hat (disco beat)
 */
const billieJeanPattern: RhythmPatternDTO = {
    version: 1,
    onsetTimesMs: [0, 250, 500, 750, 1000, 1250, 1500, 1750, 2000],
    intervalsMs: [250, 250, 250, 250, 250, 250, 250, 250],
    estimatedBpm: 117,
    timeSignature: '4/4',
    totalBeats: 9,
    trimmedStartMs: 0,
    trimmedEndMs: 2000,
    originalDurationMs: 2000,
};

/**
 * "Back in Black" - AC/DC
 * Hard rock guitar riff
 */
const backInBlackPattern: RhythmPatternDTO = {
    version: 1,
    onsetTimesMs: [0, 375, 750, 1125, 1500, 2000, 2375, 2750, 3125],
    intervalsMs: [375, 375, 375, 375, 500, 375, 375, 375],
    estimatedBpm: 92,
    timeSignature: '4/4',
    totalBeats: 9,
    trimmedStartMs: 0,
    trimmedEndMs: 3125,
    originalDurationMs: 3125,
};

/**
 * "Superstition" - Stevie Wonder
 * Funky clavinet rhythm
 */
const superstitionPattern: RhythmPatternDTO = {
    version: 1,
    onsetTimesMs: [0, 125, 375, 500, 750, 875, 1000, 1250, 1375, 1500],
    intervalsMs: [125, 250, 125, 250, 125, 125, 250, 125, 125],
    estimatedBpm: 100,
    timeSignature: '4/4',
    totalBeats: 10,
    trimmedStartMs: 0,
    trimmedEndMs: 1500,
    originalDurationMs: 1500,
};

/**
 * "Sweet Child O' Mine" - Guns N' Roses
 * Intro guitar pattern
 */
const sweetChildPattern: RhythmPatternDTO = {
    version: 1,
    onsetTimesMs: [0, 200, 400, 500, 700, 900, 1000, 1200, 1400, 1500, 1700, 1900],
    intervalsMs: [200, 200, 100, 200, 200, 100, 200, 200, 100, 200, 200],
    estimatedBpm: 125,
    timeSignature: '4/4',
    totalBeats: 12,
    trimmedStartMs: 0,
    trimmedEndMs: 1900,
    originalDurationMs: 1900,
};

/**
 * "Stayin' Alive" - Bee Gees
 * Disco beat
 */
const stayinAlivePattern: RhythmPatternDTO = {
    version: 1,
    onsetTimesMs: [0, 290, 580, 870, 1160, 1450, 1740, 2030],
    intervalsMs: [290, 290, 290, 290, 290, 290, 290],
    estimatedBpm: 104,
    timeSignature: '4/4',
    totalBeats: 8,
    trimmedStartMs: 0,
    trimmedEndMs: 2030,
    originalDurationMs: 2030,
};

/**
 * "Under Pressure" - Queen & David Bowie
 * Famous bass line (also sampled in "Ice Ice Baby")
 */
const underPressurePattern: RhythmPatternDTO = {
    version: 1,
    onsetTimesMs: [0, 200, 400, 600, 800, 1000, 1200, 1600],
    intervalsMs: [200, 200, 200, 200, 200, 200, 400],
    estimatedBpm: 116,
    timeSignature: '4/4',
    totalBeats: 8,
    trimmedStartMs: 0,
    trimmedEndMs: 1600,
    originalDurationMs: 1600,
};

/**
 * "Beat It" - Michael Jackson
 * Synth and guitar rhythm
 */
const beatItPattern: RhythmPatternDTO = {
    version: 1,
    onsetTimesMs: [0, 350, 700, 875, 1050, 1400, 1750, 1925, 2100],
    intervalsMs: [350, 350, 175, 175, 350, 350, 175, 175],
    estimatedBpm: 139,
    timeSignature: '4/4',
    totalBeats: 9,
    trimmedStartMs: 0,
    trimmedEndMs: 2100,
    originalDurationMs: 2100,
};

// ============================================================================ 
// SONG QUESTIONS
// ============================================================================ 

export const SAMPLE_SONGS: VibrationSongQuestion[] = [
    {
        id: 'we-will-rock-you',
        songTitle: 'We Will Rock You',
        artist: 'Queen',
        rhythmPattern: weWillRockYouPattern,
        difficulty: 'EASY',
        category: 'Classic Rock',
        wrongAnswers: ['We Are the Champions', 'Bohemian Rhapsody', 'Another One Bites the Dust'],
        hint: 'Stadium anthem with a stomp-stomp-clap',
        year: 1977,
    },
    {
        id: 'seven-nation-army',
        songTitle: 'Seven Nation Army',
        artist: 'The White Stripes',
        rhythmPattern: sevenNationArmyPattern,
        difficulty: 'EASY',
        category: 'Alternative Rock',
        wrongAnswers: ['Fell in Love with a Girl', 'Icky Thump', 'Hardest Button to Button'],
        hint: 'Often chanted at sports events',
        year: 2003,
    },
    {
        id: 'smoke-on-the-water',
        songTitle: 'Smoke on the Water',
        artist: 'Deep Purple',
        rhythmPattern: smokeOnTheWaterPattern,
        difficulty: 'EASY',
        category: 'Classic Rock',
        wrongAnswers: ['Highway Star', 'Black Night', 'Hush'],
        hint: 'First riff every guitarist learns',
        year: 1972,
    },
    {
        id: 'another-one-bites-the-dust',
        songTitle: 'Another One Bites the Dust',
        artist: 'Queen',
        rhythmPattern: anotherOneBitesTheDustPattern,
        difficulty: 'MEDIUM',
        category: 'Disco/Rock',
        wrongAnswers: ['Under Pressure', 'Crazy Little Thing Called Love', 'Radio Ga Ga'],
        hint: 'Funky bass line that inspired many samples',
        year: 1980,
    },
    {
        id: 'eye-of-the-tiger',
        songTitle: 'Eye of the Tiger',
        artist: 'Survivor',
        rhythmPattern: eyeOfTheTigerPattern,
        difficulty: 'MEDIUM',
        category: 'Rock',
        wrongAnswers: ['The Final Countdown', 'Jump', 'Livin\' on a Prayer'],
        hint: 'Theme from a boxing movie',
        year: 1982,
    },
    {
        id: 'billie-jean',
        songTitle: 'Billie Jean',
        artist: 'Michael Jackson',
        rhythmPattern: billieJeanPattern,
        difficulty: 'MEDIUM',
        category: 'Pop',
        wrongAnswers: ['Beat It', 'Thriller', 'Bad'],
        hint: 'She says the kid is his son',
        year: 1982,
    },
    {
        id: 'back-in-black',
        songTitle: 'Back in Black',
        artist: 'AC/DC',
        rhythmPattern: backInBlackPattern,
        difficulty: 'MEDIUM',
        category: 'Hard Rock',
        wrongAnswers: ['Highway to Hell', 'Thunderstruck', 'T.N.T.'],
        hint: 'Named after their signature outfit color',
        year: 1980,
    },
    {
        id: 'superstition',
        songTitle: 'Superstition',
        artist: 'Stevie Wonder',
        rhythmPattern: superstitionPattern,
        difficulty: 'HARD',
        category: 'Funk/Soul',
        wrongAnswers: ['Higher Ground', 'Sir Duke', 'I Wish'],
        hint: 'Don\'t walk under a ladder',
        year: 1972,
    },
    {
        id: 'sweet-child-o-mine',
        songTitle: 'Sweet Child O\' Mine',
        artist: 'Guns N\' Roses',
        rhythmPattern: sweetChildPattern,
        difficulty: 'HARD',
        category: 'Hard Rock',
        wrongAnswers: ['Paradise City', 'Welcome to the Jungle', 'November Rain'],
        hint: 'Has a famous circular guitar intro',
        year: 1987,
    },
    {
        id: 'stayin-alive',
        songTitle: 'Stayin\' Alive',
        artist: 'Bee Gees',
        rhythmPattern: stayinAlivePattern,
        difficulty: 'MEDIUM',
        category: 'Disco',
        wrongAnswers: ['Night Fever', 'How Deep Is Your Love', 'Jive Talkin\''],
        hint: 'Used for CPR rhythm training',
        year: 1977,
    },
    {
        id: 'under-pressure',
        songTitle: 'Under Pressure',
        artist: 'Queen & David Bowie',
        rhythmPattern: underPressurePattern,
        difficulty: 'HARD',
        category: 'Rock',
        wrongAnswers: ['Ice Ice Baby', 'Let\'s Dance', 'Radio Ga Ga'],
        hint: 'Collaboration between two legends, later sampled',
        year: 1981,
    },
    {
        id: 'beat-it',
        songTitle: 'Beat It',
        artist: 'Michael Jackson',
        rhythmPattern: beatItPattern,
        difficulty: 'HARD',
        category: 'Pop/Rock',
        wrongAnswers: ['Billie Jean', 'Smooth Criminal', 'Wanna Be Startin\' Somethin\''],
        hint: 'Features a famous guitar solo by Eddie Van Halen',
        year: 1982,
    },
];

// ============================================================================ 
// HELPER FUNCTIONS
// ============================================================================ 

/**
 * Get songs filtered by difficulty
 */
export function getSongsByDifficulty(
    difficulty: 'EASY' | 'MEDIUM' | 'HARD'
): VibrationSongQuestion[] {
    return SAMPLE_SONGS.filter((song) => song.difficulty === difficulty);
}

/**
 * Get songs filtered by category
 */
export function getSongsByCategory(category: string): VibrationSongQuestion[] {
    return SAMPLE_SONGS.filter((song) => song.category === category);
}

/**
 * Get unique categories from all songs
 */
export function getCategories(): string[] {
    const categories = new Set(SAMPLE_SONGS.map((song) => song.category).filter(Boolean));
    return Array.from(categories) as string[];
}

/**
 * Get random selection of songs for a game
 *
 * @param count - Number of songs to select
 * @param difficulty - Optional difficulty filter
 * @param categories - Optional category filter
 * @returns Shuffled array of selected songs
 */
export function getRandomSongs(
    count: number,
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD',
    categories?: string[]
): VibrationSongQuestion[] {
    let pool = [...SAMPLE_SONGS];

    // Filter by difficulty if specified
    if (difficulty) {
        pool = pool.filter((song) => song.difficulty === difficulty);
    }

    // Filter by categories if specified
    if (categories && categories.length > 0) {
        pool = pool.filter((song) => song.category && categories.includes(song.category));
    }

    // Shuffle the pool
    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    // Return requested count (or all if count > pool size)
    return pool.slice(0, Math.min(count, pool.length));
}

export default SAMPLE_SONGS;
