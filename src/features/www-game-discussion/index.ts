// src/features/www-game-discussion/index.ts
export { DiscussionPanel } from './ui/DiscussionPanel';
export { DiscussionTimer } from './ui/DiscussionTimer';
export { DiscussionAnalysis } from './ui/DiscussionAnalysis';
export { DiscussionNotes } from './ui/DiscussionNotes';
export { AIHostPanel } from './ui/AIHostPanel';

export { useWWWDiscussion } from './lib/hooks';
export { wwwDiscussionModel } from './model';

export type {
    DiscussionPhase,
    DiscussionState,
    DiscussionAnalysisResult,
    AIHostConfig,
} from './model/types';
