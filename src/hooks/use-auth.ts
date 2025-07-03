import { useAppSelector } from "@/store/hooks";

export function useAuth() {
  const authState = useAppSelector((state) => state.auth);

  return {
    isLoggedIn: authState.isLoggedIn,
    user: authState.infos,
    isLoading: authState.authenticate.loading || authState.login.loading,
    error: authState.authenticate.error || authState.login.error,
  };
}
