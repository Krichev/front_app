// src/entities/user/index.ts
export {userApi} from './api';
export {userSlice, userActions} from './model';
export type {User, UserProfile, UserStats} from './model/types';
export {UserCard} from './ui/user-card';
export {UserAvatar} from './ui/user-avatar';

// Re-export API hooks for convenience
export {
    useGetUserProfileQuery,
    useUpdateUserProfileMutation,
    useGetUserStatsQuery,
    useSearchUsersQuery,
} from './api';