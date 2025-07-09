// src/entities/group/model/Slice.ts
import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import type {Group, GroupMember} from './types';

interface GroupState {
    userGroups: Group[];
    currentGroup: Group | null;
    currentGroupMembers: GroupMember[];
    isLoading: boolean;
    error: string | null;
}

const initialState: GroupState = {
    userGroups: [],
    currentGroup: null,
    currentGroupMembers: [],
    isLoading: false,
    error: null,
};

export const groupSlice = createSlice({
    name: 'group',
    initialState,
    reducers: {
        setUserGroups: (state, action: PayloadAction<Group[]>) => {
            state.userGroups = action.payload;
        },
        addUserGroup: (state, action: PayloadAction<Group>) => {
            state.userGroups.push(action.payload);
        },
        removeUserGroup: (state, action: PayloadAction<string>) => {
            state.userGroups = state.userGroups.filter(g => g.id !== action.payload);
        },
        setCurrentGroup: (state, action: PayloadAction<Group | null>) => {
            state.currentGroup = action.payload;
        },
        updateCurrentGroup: (state, action: PayloadAction<Partial<Group>>) => {
            if (state.currentGroup) {
                state.currentGroup = { ...state.currentGroup, ...action.payload };
            }
        },
        setCurrentGroupMembers: (state, action: PayloadAction<GroupMember[]>) => {
            state.currentGroupMembers = action.payload;
        },
        addGroupMember: (state, action: PayloadAction<GroupMember>) => {
            state.currentGroupMembers.push(action.payload);
            if (state.currentGroup) {
                state.currentGroup.memberCount += 1;
            }
        },
        removeGroupMember: (state, action: PayloadAction<string>) => {
            state.currentGroupMembers = state.currentGroupMembers.filter(m => m.userId !== action.payload);
            if (state.currentGroup) {
                state.currentGroup.memberCount -= 1;
            }
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },
    },
});

export const groupActions = groupSlice.actions;
export const groupReducer = groupSlice.reducer;
