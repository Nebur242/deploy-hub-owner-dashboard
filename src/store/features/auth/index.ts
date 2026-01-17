import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { AxiosError } from "axios";
import { AuthError, UserCredential } from "firebase/auth";
import {
  authUser,
  firebaseSignInWithCustomToken,
  getUser,
  logout,
  requestCode,
  verifyCode,
  loginWithVerification,
  registerOwnerWithVerification,
  DeveloperType,
} from "../../../services/users";
import { asyncHandler } from "@/utils/functions";
import { AppUser, hasRole, Status, User } from "@/common/types";
import { authService } from "@/services/auth-service";

export interface AuthInitialState {
  infos: AppUser | null;
  isLoggedIn: boolean;
  // OTP flow state
  otpEmail: string | null;
  otpType: "login" | "register" | null;
  verificationToken: string | null;
  authenticate: {
    loading: boolean;
    error: string;
    status: Status;
  };
  logout: {
    loading: boolean;
    error: string;
    status: Status;
  };
  // OTP flow states
  requestCode: {
    loading: boolean;
    error: string;
    status: Status;
  };
  verifyCode: {
    loading: boolean;
    error: string;
    status: Status;
  };
  loginWithOtp: {
    loading: boolean;
    error: string;
    status: Status;
  };
  registerWithOtp: {
    loading: boolean;
    error: string;
    status: Status;
  };
}

const initialState: AuthInitialState = {
  infos: null,
  isLoggedIn: false,
  otpEmail: null,
  otpType: null,
  verificationToken: null,
  authenticate: {
    loading: true,
    error: "",
    status: "pending",
  },
  logout: {
    loading: false,
    error: "",
    status: "pending",
  },
  requestCode: {
    loading: false,
    error: "",
    status: "pending",
  },
  verifyCode: {
    loading: false,
    error: "",
    status: "pending",
  },
  loginWithOtp: {
    loading: false,
    error: "",
    status: "pending",
  },
  registerWithOtp: {
    loading: false,
    error: "",
    status: "pending",
  },
};

// ============================================
// OTP-based authentication thunks
// ============================================

export const requestOtpCode = createAsyncThunk(
  "auth/requestOtpCode",
  async (
    {
      email,
      purpose,
      onSuccess,
      onFailed,
    }: {
      email: string;
      purpose: "login" | "register";
      onSuccess?: () => void;
      onFailed?: () => void;
    },
    { rejectWithValue, fulfillWithValue },
  ) => {
    try {
      await requestCode(email, purpose);
      if (onSuccess) onSuccess();
      return fulfillWithValue({ email, purpose });
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      if (onFailed) onFailed();
      return rejectWithValue(
        axiosError?.response?.data?.message ||
          "Failed to send verification code",
      );
    }
  },
);

export const verifyOtpCode = createAsyncThunk(
  "auth/verifyOtpCode",
  async (
    {
      email,
      code,
      purpose,
      onSuccess,
      onFailed,
    }: {
      email: string;
      code: string;
      purpose: "login" | "register";
      onSuccess?: (verificationToken: string) => void;
      onFailed?: () => void;
    },
    { rejectWithValue, fulfillWithValue },
  ) => {
    try {
      const response = await verifyCode(email, code, purpose);
      if (onSuccess) onSuccess(response.verificationToken);
      return fulfillWithValue({
        verificationToken: response.verificationToken,
        email,
        purpose,
      });
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      if (onFailed) onFailed();
      return rejectWithValue(
        axiosError?.response?.data?.message || "Invalid or expired code",
      );
    }
  },
);

export const loginOwnerWithOtp = createAsyncThunk(
  "auth/loginOwnerWithOtp",
  async (
    {
      email,
      verificationToken,
      onSuccess,
      onFailed,
    }: {
      email: string;
      verificationToken: string;
      onSuccess?: () => void;
      onFailed?: () => void;
    },
    { rejectWithValue, fulfillWithValue },
  ) => {
    try {
      // Call backend to login with verification token
      const response = await loginWithVerification(email, verificationToken);

      // Sign in to Firebase with custom token
      const firebaseUser = await firebaseSignInWithCustomToken(response.token);

      // Set session cookie
      const idToken = await firebaseUser.user.getIdToken(true);

      // Save token to cache immediately so subsequent API calls can use it
      authService.setToken(idToken);

      const sessionResponse = await fetch("/api/auth/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken }),
      });

      if (!sessionResponse.ok) {
        if (onFailed) onFailed();
        return rejectWithValue("Failed to create session");
      }

      // Get user from backend - pass token directly to avoid race condition
      const user = await getUser(firebaseUser.user.uid, idToken);

      // Verify user has owner role
      if (!hasRole(user.roles, "owner") && !hasRole(user.roles, "admin")) {
        if (onFailed) onFailed();
        return rejectWithValue("You are not registered as an owner");
      }

      if (onSuccess) onSuccess();
      return fulfillWithValue({
        ...user,
        firebase: firebaseUser.user.toJSON() as UserCredential["user"],
      });
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      if (onFailed) onFailed();
      return rejectWithValue(
        axiosError?.response?.data?.message || "Login failed",
      );
    }
  },
);

export const registerOwnerWithOtp = createAsyncThunk(
  "auth/registerOwnerWithOtp",
  async (
    {
      email,
      verification_token,
      first_name,
      last_name,
      company_name,
      developer_type,
      country,
      website_url,
      github_url,
      terms_accepted,
      onSuccess,
      onFailed,
    }: {
      email: string;
      verification_token: string;
      first_name: string;
      last_name: string;
      company_name?: string;
      developer_type: DeveloperType;
      country: string;
      website_url?: string;
      github_url: string;
      terms_accepted: boolean;
      onSuccess?: () => void;
      onFailed?: () => void;
    },
    { rejectWithValue, fulfillWithValue },
  ) => {
    try {
      // Register owner with backend
      const response = await registerOwnerWithVerification({
        email,
        verification_token,
        first_name,
        last_name,
        company_name,
        developer_type,
        country,
        website_url,
        github_url,
        terms_accepted,
      });

      // Sign in to Firebase with custom token
      const firebaseUser = await firebaseSignInWithCustomToken(response.token);

      // Set session cookie
      const idToken = await firebaseUser.user.getIdToken(true);

      // Save token to cache immediately so subsequent API calls can use it
      authService.setToken(idToken);

      const sessionResponse = await fetch("/api/auth/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken }),
      });

      if (!sessionResponse.ok) {
        if (onFailed) onFailed();
        return rejectWithValue("Failed to create session");
      }

      // Get user from backend - pass token directly to avoid race condition
      const user = await getUser(firebaseUser.user.uid, idToken);

      return fulfillWithValue({
        ...user,
        firebase: firebaseUser.user.toJSON() as UserCredential["user"],
      });
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      return rejectWithValue(
        axiosError?.response?.data?.message || "Registration failed",
      );
    }
  },
);

export const authenticateUser = createAsyncThunk(
  "auth/authenticate",
  async (_, { rejectWithValue, fulfillWithValue }) => {
    const [firebaseUser, firebaseError] = await asyncHandler<
      UserCredential["user"] | null,
      AuthError
    >(authUser());

    if (firebaseError || !firebaseUser) {
      return rejectWithValue(
        firebaseError?.message || "Firebase register error",
      );
    }

    const [userInfos, axiosError] = await asyncHandler<
      User,
      AxiosError<{ message: string }>
    >(getUser(firebaseUser.uid));

    if (axiosError || !userInfos) {
      console.log(axiosError);
      return rejectWithValue(
        axiosError?.response?.data.message || "Axios error",
      );
    }

    // For the owner dashboard, allow either owner or admin roles
    if (
      !hasRole(userInfos.roles, "owner") &&
      !hasRole(userInfos.roles, "admin")
    ) {
      // await firebaseUser.user.delete();
      return rejectWithValue("You are not allowed to login");
    }

    return fulfillWithValue({
      ...userInfos,
      firebase: firebaseUser.toJSON() as UserCredential["user"],
    });
  },
);

export const logoutUser = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue, fulfillWithValue }) => {
    try {
      await logout();
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user: {} }),
      });

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      return fulfillWithValue(null);
    } catch (err) {
      console.log("error", err);
      const error = err as AuthError;
      return rejectWithValue(error?.message || "Error");
    }
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearOtpState: (state) => {
      state.otpEmail = null;
      state.otpType = null;
      state.verificationToken = null;
      state.requestCode = { loading: false, error: "", status: "pending" };
      state.verifyCode = { loading: false, error: "", status: "pending" };
      state.loginWithOtp = { loading: false, error: "", status: "pending" };
      state.registerWithOtp = { loading: false, error: "", status: "pending" };
    },
    restoreOtpState: (
      state,
      action: {
        payload: {
          email: string;
          verificationToken: string;
          type: "login" | "register";
        };
      },
    ) => {
      state.otpEmail = action.payload.email;
      state.verificationToken = action.payload.verificationToken;
      state.otpType = action.payload.type;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(authenticateUser.pending, (state: AuthInitialState) => {
        state.authenticate.loading = true;
        state.authenticate.error = "";
        state.authenticate.status = "pending";
      })
      .addCase(
        authenticateUser.fulfilled,
        (state: AuthInitialState, action) => {
          state.authenticate.loading = false;
          state.authenticate.error = "";
          state.authenticate.status = "success";
          state.infos = action.payload;
          state.isLoggedIn = true;
        },
      )
      .addCase(authenticateUser.rejected, (state: AuthInitialState, action) => {
        state.authenticate.loading = false;
        state.authenticate.error = action.payload as string;
        state.authenticate.status = "error";
      })
      .addCase(logoutUser.pending, (state: AuthInitialState) => {
        state.logout.loading = true;
        state.logout.error = "";
        state.logout.status = "pending";
      })
      .addCase(logoutUser.fulfilled, (state: AuthInitialState) => {
        state.logout.loading = false;
        state.logout.error = "";
        state.logout.status = "success";
        state.infos = null;
        state.isLoggedIn = false;
      })
      .addCase(logoutUser.rejected, (state: AuthInitialState, action) => {
        state.logout.loading = false;
        state.logout.error = action.payload as string;
        state.logout.status = "error";
      })
      // OTP flow reducers
      .addCase(requestOtpCode.pending, (state: AuthInitialState) => {
        state.requestCode.loading = true;
        state.requestCode.error = "";
        state.requestCode.status = "pending";
      })
      .addCase(requestOtpCode.fulfilled, (state: AuthInitialState, action) => {
        state.requestCode.loading = false;
        state.requestCode.error = "";
        state.requestCode.status = "success";
        state.otpEmail = action.payload.email;
        state.otpType = action.payload.purpose;
      })
      .addCase(requestOtpCode.rejected, (state: AuthInitialState, action) => {
        state.requestCode.loading = false;
        state.requestCode.error = action.payload as string;
        state.requestCode.status = "error";
      })
      .addCase(verifyOtpCode.pending, (state: AuthInitialState) => {
        state.verifyCode.loading = true;
        state.verifyCode.error = "";
        state.verifyCode.status = "pending";
      })
      .addCase(verifyOtpCode.fulfilled, (state: AuthInitialState, action) => {
        state.verifyCode.loading = false;
        state.verifyCode.error = "";
        state.verifyCode.status = "success";
        state.verificationToken = action.payload.verificationToken;
      })
      .addCase(verifyOtpCode.rejected, (state: AuthInitialState, action) => {
        state.verifyCode.loading = false;
        state.verifyCode.error = action.payload as string;
        state.verifyCode.status = "error";
      })
      .addCase(loginOwnerWithOtp.pending, (state: AuthInitialState) => {
        state.loginWithOtp.loading = true;
        state.loginWithOtp.error = "";
        state.loginWithOtp.status = "pending";
      })
      .addCase(
        loginOwnerWithOtp.fulfilled,
        (state: AuthInitialState, action) => {
          state.loginWithOtp.loading = false;
          state.loginWithOtp.error = "";
          state.loginWithOtp.status = "success";
          state.infos = action.payload;
          state.isLoggedIn = true;
          // Clear OTP state after successful login
          state.otpEmail = null;
          state.otpType = null;
          state.verificationToken = null;
        },
      )
      .addCase(
        loginOwnerWithOtp.rejected,
        (state: AuthInitialState, action) => {
          state.loginWithOtp.loading = false;
          state.loginWithOtp.error = action.payload as string;
          state.loginWithOtp.status = "error";
        },
      )
      .addCase(registerOwnerWithOtp.pending, (state: AuthInitialState) => {
        state.registerWithOtp.loading = true;
        state.registerWithOtp.error = "";
        state.registerWithOtp.status = "pending";
      })
      .addCase(
        registerOwnerWithOtp.fulfilled,
        (state: AuthInitialState, action) => {
          state.registerWithOtp.loading = false;
          state.registerWithOtp.error = "";
          state.registerWithOtp.status = "success";
          state.infos = action.payload;
          state.isLoggedIn = true;
          // Clear OTP state after successful registration
          state.otpEmail = null;
          state.otpType = null;
          state.verificationToken = null;
        },
      )
      .addCase(
        registerOwnerWithOtp.rejected,
        (state: AuthInitialState, action) => {
          state.registerWithOtp.loading = false;
          state.registerWithOtp.error = action.payload as string;
          state.registerWithOtp.status = "error";
        },
      );
  },
});

export const { clearOtpState, restoreOtpState } = authSlice.actions;
const { reducer } = authSlice;
export default reducer;
