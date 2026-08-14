// Firebase services disabled per project settings - application relies exclusively on Supabase database
export const db: any = {};
export const auth: any = {};
export const googleAuthProvider: any = {};

export const initAuth = (
  _onAuthSuccess?: (user: any, token: string) => void,
  onAuthFailure?: () => void
) => {
  if (onAuthFailure) onAuthFailure();
  return () => {};
};

export const googleSignIn = async (): Promise<{ user: any; accessToken: string } | null> => {
  return null;
};

export const getAccessToken = async (): Promise<string | null> => {
  return null;
};

export const logout = async () => {};

