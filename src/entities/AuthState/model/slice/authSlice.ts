import {createSlice, PayloadAction} from '@reduxjs/toolkit';

interface User {
    id: string;
    name: string;
    email: string;
    // ...other user fields
}

interface AuthState {
    accessToken: string | null;
    refreshToken: string | null;
    user: User | null;
}

const initialState: AuthState = {
    accessToken: null,
    refreshToken: null,
    user: null,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setTokens(state, action: PayloadAction<AuthState>) {
            state.accessToken = action.payload.accessToken;
            state.refreshToken = action.payload.refreshToken;
            state.user = action.payload.user;
        },
        logout(state) {
            state.accessToken = null;
            state.refreshToken = null;
            state.user = null;
        },
    },
});

// export const logout = () => async (dispatch: (arg0: { payload: undefined; type: "auth/logout"; }) => void) => {
//     await Keychain.resetGenericPassword(); // Clear Keychain
//     dispatch(authSlice.actions.logout()); // Update Redux state
// };

export const {setTokens, logout} = authSlice.actions;
export default authSlice.reducer;