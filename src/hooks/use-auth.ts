import { useAppSelector } from "@/store/hooks";

export function useAuth() {
  const authState = useAppSelector((state) => state.auth);

  return {
    isLoggedIn: authState.isLoggedIn,
    user: authState.infos,
    isLoading: authState.authenticate.loading || authState.loginWithOtp.loading,
    error: authState.authenticate.error || authState.loginWithOtp.error,
  };
}
