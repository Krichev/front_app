// src/entities/user/index.ts
export { userApi } from './api';
export { userSlice, userActions } from './model';
export type { User, UserProfile, UserStats, UserPreferences } from './model/types';
export { UserCard, UserAvatar } from './ui';

// Re-export API hooks for convenience
export {
    useGetUserProfileQuery,
    useUpdateUserProfileMutation,
    useGetUserStatsQuery,
    useSearchUsersQuery,
    useGetCurrentUserQuery,
    useUploadUserAvatarMutation,
    useFollowUserMutation,
    useUnfollowUserMutation,
    useGetUserFollowersQuery,
    useGetUserFollowingQuery,
} from './api';