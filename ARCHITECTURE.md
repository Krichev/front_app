# ARCHITECTURE.md - Mobile App (React Native)

### Section 1: System Overview
"Challenger Mobile App — React Native (TypeScript) client for the Challenger quiz/challenge platform"
- Communicates with: Challenger Backend (REST + WebSocket), MinIO (presigned URL media)
- Rhythm scoring: Calls Karaoke Backend DIRECTLY via `rhythmApi`.
- Other audio scoring: Goes through Challenger Backend (proxied to Karaoke).

### Section 2: Backend API Base URLs
- Configured via `NetworkConfigManager` singleton
- Challenger API: `8080` (dev), `8081` (prod)
- Karaoke API: `8083` (dev), `8084` (prod)
- All calls go through RTK Query with `createBaseQueryWithAuth` (auto-attaches JWT).

### Section 3: Key API Contracts

#### Rhythm & Audio Scoring
- `POST /rhythm/score` & `POST /rhythm/score-audio-file` (direct to Karaoke via rhythmApi)
- Difficulty: `'EASY' | 'MEDIUM' | 'HARD'`, Min Score: `0-100` (default `60`)
- Audio submissions: `POST /quiz/sessions/{id}/rounds/{roundId}/audio-answer` (multipart FormData)
- Multipart: use `{ uri, name, type }` object pattern (no Blob support)

#### Authentication & Sessions
- Auth: `POST /auth/signin` → `{ accessToken, refreshToken, user }`. Token in `react-native-keychain`.
- Quiz Sessions: `POST /quiz/sessions/start`, `POST /quiz/sessions/{id}/complete` (idempotent)
- Question DTO: `answerInputMode`: `'TAP' | 'AUDIO' | 'BOTH'`, `allowReplay`: `boolean`.

#### WebSocket (Multiplayer)
- Endpoint: `{baseUrl}/ws-game` (SockJS), Auth: `Authorization: Bearer {token}`
- Topics: `/topic/room/{roomCode}/state`, `/topic/room/{roomCode}/players`, `/user/queue/personal`

### Section 4: Media / MinIO
- App never talks to MinIO directly. URLs built via `MediaUrlService` from question IDs.
- Never trusts raw `questionMediaUrl` from DTOs. External URLs (YouTube etc.) used directly.

### Section 5: Frontend Architecture Patterns
- FSD layers: `app/` → `screens/` → `features/` → `entities/` → `shared/`
- State: RTK Query for server state, Redux slices for auth/local state
- Cache invalidation: mutations must invalidate `{ type: 'X', id: 'LIST' }` tags
- Navigation: React Navigation (stack + bottom tabs), `RootStackParamList`
- Theming: `createStyles()` + `useAppStyles()` hook
- i18n: `react-i18next` (English + Russian)

### Section 6: Location Quest
- Screens: `QuestDiscovery`, `QuestDetail`, `QuestActive` (Live Tracking)
- RTK Query: `locationQuestApi` (reducerPath: `'locationQuestApi'`)
- WebSocket: `/topic/quest/{id}/progress`, `/user/queue/quest-hints`
- Entity: `src/entities/LocationQuest/`, Widget: `src/widgets/QuestMap/`
- GPS: `@react-native-community/geolocation` (foreground tracking)
- Endpoints (9): `/location-quests/` (discover, join, start, arrive, complete, location-update, progress, abandon)

### Section 7: Key Gotchas
- Hermes seals route params objects — destructuring missing optional props throws ReferenceError
- Backend returns `Long` IDs as numbers — frontend treats them as `string | number`
- Presigned URLs expire — never store them in AsyncStorage or persist in state
