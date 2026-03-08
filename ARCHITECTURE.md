# ARCHITECTURE.md - Mobile App (React Native)

### Section 1: System Overview
"Challenger Mobile App — React Native (TypeScript) client for the Challenger quiz/challenge platform"
- Communicates with: Challenger Backend (REST + WebSocket), MinIO (presigned URL media)
- Does NOT talk to Karaoke Backend directly — all audio scoring goes through Challenger

### Section 2: Backend API Base URL
- Configured via `NetworkConfigManager` singleton
- Dev: `http://<dev-machine-ip>:8080`
- Prod: `https://challenge-app.net/api` (or direct `http://<VPS_IP>:8081`)
- All API calls go through RTK Query with `createBaseQueryWithAuth` (auto-attaches JWT, handles refresh)

### Section 3: Key API Contracts

#### Authentication
- `POST /auth/signup` → `{ username, email, password }`
- `POST /auth/signin` → `{ username, password }` → `{ accessToken, refreshToken, user }`
- Tokens stored in `react-native-keychain`
- Auto-refresh via RTK Query baseQuery interceptor

#### Quiz Sessions (core game loop)
- `POST /quiz/sessions/start` → `StartQuizSessionRequest` → `QuizSessionDTO`
- `GET /quiz/sessions/{id}` → `QuizSessionDTO`
- `GET /quiz/sessions/{id}/rounds` → `QuizRound[]`
- `POST /quiz/sessions/{id}/rounds/{roundId}/answer` → `SubmitRoundAnswerRequest`
- `POST /quiz/sessions/{id}/complete` → `QuizSessionDTO` (idempotent)
- `POST /quiz/sessions/{id}/pause` → `PauseQuizSessionRequest`
- `POST /quiz/sessions/{id}/resume`

#### Quiz Question DTO
- `answerInputMode`: `'TAP' | 'AUDIO' | 'BOTH'` (default `'BOTH'`)
- `allowReplay`: `boolean` (default `true`)
- `maxReplays`: `number` (default `3`, `0` = unlimited)
- `audioChallengeType`: `'RHYTHM_CREATION' | 'RHYTHM_REPEAT' | 'SOUND_MATCH' | 'SINGING'`
- `minimumScorePercentage`: `number` (default `60`)
- `rhythmBpm`: `number` (optional)
- `rhythmTimeSignature`: `string` (optional)

#### Audio Submissions (through Challenger, not Karaoke)
- `POST /quiz/sessions/{id}/rounds/{roundId}/audio-answer` — multipart FormData
- React Native FormData: use `{ uri, name, type }` object pattern (no Blob support)
- JSON parts sent as strings in FormData, parsed manually on backend
- Scoring is async: submit → poll status → get results

#### Challenges
- `GET /challenges` → `ApiChallenge[]`
- `POST /challenges/quiz` → `CreateQuizChallengeRequest`
- `GET /challenges/{id}/questions`
- `POST /challenges/{id}/access/grant` (private challenges)

#### WebSocket (Multiplayer)
- Endpoint: `{baseUrl}/ws-game` (SockJS)
- Auth: `Authorization: Bearer {token}` in STOMP connect headers
- Room topics:
  - `/topic/room/{roomCode}/state` → `GameState`
  - `/topic/room/{roomCode}/players` → `{ players: RoomPlayer[] }`
  - `/topic/room/{roomCode}/answers` → answer updates
  - `/user/queue/personal` → personal messages
- Send: `/app/room/{roomCode}/join`, `/app/room/{roomCode}/action`

### Section 4: Media / MinIO
- App never talks to MinIO directly
- All media URLs come as presigned URLs from backend DTOs
- URLs are time-limited — do not cache or persist them
- Media types: images, audio, video (all served as presigned MinIO URLs)

### Section 5: Port Conventions
| Service        | Dev Port | Prod Port |
|----------------|----------|-----------|
| Challenger API | 8080     | 8081      |
| WebSocket      | 8080     | 8081      |

### Section 6: Frontend Architecture Patterns
- FSD layers: `app/` → `screens/` → `features/` → `entities/` → `shared/`
- State: RTK Query for server state, Redux slices for auth/local state
- Cache invalidation: mutations must invalidate `{ type: 'X', id: 'LIST' }` tags
- Navigation: React Navigation (stack + bottom tabs), `RootStackParamList`
- Theming: `createStyles()` + `useAppStyles()` hook
- i18n: `react-i18next` (English + Russian)
- Custom hooks for business logic: `useWWWGameController`, `useWWWGameState`, `useCountdownTimer`
- `useCallback` for all handler functions passed as props

### Section 7: Key Gotchas
- React Native FormData does NOT support Blob — use `{ uri, name, type }` objects
- Hermes seals route params objects — destructuring missing optional props throws ReferenceError
- Backend returns `Long` IDs as numbers — frontend treats them as `string | number`
- Presigned URLs expire — never store them in AsyncStorage or persist in state
- Backend `completeQuizSession` is idempotent — safe to call multiple times
