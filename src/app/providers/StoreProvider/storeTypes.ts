// Break circular dependency by defining auth state shape independently
export interface AuthStateForApi {
    accessToken: string | null;
    refreshToken: string | null;
}

export interface RootStateForApi {
    auth: AuthStateForApi;
}
