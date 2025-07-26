// src/entities/group/index.ts
export { groupApi } from './api';
export { groupSlice, groupActions } from './model/slice';
export type {
    Group,
    GroupMember,
    GroupType,
    GroupPrivacy,
    GroupRole,
    CreateGroupRequest,
    GroupFilters,
    JoinGroupRequest,
} from './model/types';
export { GroupCard } from './ui/group-card';

// Re-export API hooks
export {
    useGetGroupsQuery,
    useGetGroupByIdQuery,
    useGetUserGroupsQuery,
    useCreateGroupMutation,
    useUpdateGroupMutation,
    useDeleteGroupMutation,
    useJoinGroupMutation,
    useLeaveGroupMutation,
    useGetGroupMembersQuery,
    useUpdateMemberRoleMutation,
    useRemoveMemberMutation,
    useSearchGroupsQuery,
} from './api';