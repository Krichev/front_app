// src/shared/ui/GameComponents/index.ts
// Export game-specific UI components with clear naming

// Core game components
export { Timer as GameTimer } from '../Timer/Timer'
export { PlayerSelector as GamePlayerSelector } from '../PlayerSelector/PlayerSelector'
export { DifficultySelector as GameDifficultySelector } from '../DifficultySelector/DifficultySelector'
export { TeamMemberList as GameTeamMemberList } from '../TeamMemberList/TeamMemberList'
export { SourceSelector as GameSourceSelector } from '../SourceSelector/SourceSelector'

// Progress and feedback components
export { ProgressBar as GameProgressBar } from '../ProgressBar/ProgressBar'
export { Badge as GameBadge } from '../Badge/Badge'

// Form components for games
export { Toggle as GameToggle } from '../Toggle/Toggle'
export { Button as GameButton } from '../Button/Button'
export { Input as GameInput } from '../Input/Input'

// Layout components
export { Card as GameCard } from '../Card/Card'
export { Modal as GameModal } from '../Modal/Modal'

// State components
export { LoadingState as GameLoadingState } from '../LoadingState/LoadingState'
export { ErrorState as GameErrorState } from '../ErrorState/ErrorState'

// Re-export types for convenience
export type { Difficulty } from '../DifficultySelector/DifficultySelector'
export type { SourceType } from '../SourceSelector/SourceSelector'