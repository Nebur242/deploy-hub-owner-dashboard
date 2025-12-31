import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { AxiosError } from "axios";
import { AuthError, UserCredential } from "firebase/auth";
import {
  authUser,
  createUser,
  firebaseCreateUser,
  firebaseLoginUser,
  firebaseLoginWithGoogle,
  firebaseRegisterWithGoogle,
  firebaseSendPasswordResetEmail,
  firebaseSendValidationEmail,
  checkEmailVerification,
  getUser,
  logout,
  handleGoogleRedirectResult,
} from "../../../services/users";
import { asyncHandler } from "@/utils/functions";
import { AppUser, Status, User } from "@/common/types";
import { LoginDto, RegisterDto } from "@/common/dtos";

export interface AuthInitialState {
  infos: AppUser | null;
  isLoggedIn: boolean;
  authenticate: {
    loading: boolean;
    error: string;
    status: Status;
  };
  login: {
    loading: boolean;
    error: string;
    status: Status;
  };
  register: {
    loading: boolean;
    error: string;
    status: Status;
  };
  googleAuth: {
    loading: boolean;
    error: string;
    status: Status;
  };
  logout: {
    loading: boolean;
    error: string;
    status: Status;
  };
  reset: {
    loading: boolean;
    error: string;
    status: Status;
  };
  verifyEmail: {
    loading: boolean;
    error: string;
    status: Status;
  };
}

const initialState: AuthInitialState = {
  infos: null,
  isLoggedIn: false,
  authenticate: {
    loading: true,
    error: "",
    status: "pending",
  },
  login: {
    loading: false,
    error: "",
    status: "pending",
  },
  register: {
    loading: false,
    error: "",
    status: "pending",
  },
  googleAuth: {
    loading: false,
    error: "",
    status: "pending",
  },
  logout: {
    loading: false,
    error: "",
    status: "pending",
  },
  reset: {
    loading: false,
    error: "",
    status: "pending",
  },
  verifyEmail: {
    loading: false,
    error: "",
    status: "pending",
  },
};

export const resetPassword = createAsyncThunk(
  "auth/reset",
  async (
    {
      email,
      onFailed,
      onSuccess,
    }: { email: string } & {
      onSuccess?: () => void;
      onFailed?: () => void;
    },
    { rejectWithValue, fulfillWithValue }
  ) => {
    const [, firebaseError] = await asyncHandler(
      firebaseSendPasswordResetEmail(email)
    );

    if (firebaseError) {
      if (onFailed) onFailed();
      return rejectWithValue("Something went wrong...");
    }

    if (onSuccess) onSuccess();
    return fulfillWithValue("Sent");
  }
);

export const loginWithGoogle = createAsyncThunk(
  "auth/loginWithGoogle",
  async (
    {
      onSuccess,
      onFailed,
    }: {
      onSuccess?: () => void;
      onFailed?: () => void;
    } = {},
    { rejectWithValue, fulfillWithValue }
  ) => {
    const [firebaseUser, firebaseError] = await asyncHandler<
      UserCredential,
      AuthError
    >(firebaseLoginWithGoogle());

    if (firebaseError || !firebaseUser) {
      // Check if this is a redirect in progress
      if (firebaseError?.message === "REDIRECT_IN_PROGRESS") {
        // Don't call onFailed for redirect, just return a special status
        return rejectWithValue("REDIRECT_IN_PROGRESS");
      }

      if (onFailed) onFailed();
      return rejectWithValue(
        firebaseError?.message || "Google authentication failed"
      );
    }

    const [user, axiosError] = await asyncHandler<
      User,
      AxiosError<{ message: string }>
    >(getUser(firebaseUser.user.uid));

    if (axiosError || !user) {
      if (onFailed) onFailed();
      return rejectWithValue(
        axiosError?.response?.data.message || "User not found"
      );
    }

    if (!user.roles.includes("admin")) {
      if (onFailed) onFailed();
      return rejectWithValue("You are not allowed to login");
    }

    // Create session using the same pattern as email/password auth
    const idToken = await firebaseUser.user.getIdToken();
    const response = await fetch("/api/auth/session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
      const res = await response.json();
      console.log(res);
      if (onFailed) onFailed();
      return rejectWithValue("Session not set");
    }

    if (onSuccess) onSuccess();
    return fulfillWithValue({
      ...user,
      firebase: firebaseUser.user.toJSON() as UserCredential["user"],
    });
  }
);

export const registerWithGoogle = createAsyncThunk(
  "auth/registerWithGoogle",
  async (
    {
      onSuccess,
      onFailed,
    }: {
      onSuccess?: () => void;
      onFailed?: () => void;
    } = {},
    { rejectWithValue, fulfillWithValue }
  ) => {
    const [firebaseUser, firebaseError] = await asyncHandler<
      UserCredential,
      AuthError
    >(firebaseRegisterWithGoogle());

    if (firebaseError || !firebaseUser) {
      // Check if this is a redirect in progress
      if (firebaseError?.message === "REDIRECT_IN_PROGRESS") {
        // Don't call onFailed for redirect, just return a special status
        return rejectWithValue("REDIRECT_IN_PROGRESS");
      }

      if (onFailed) onFailed();
      return rejectWithValue(
        firebaseError?.message || "Google authentication failed"
      );
    }

    // Check if user already exists in our system
    const [existingUser] = await asyncHandler<
      User,
      AxiosError<{ message: string }>
    >(getUser(firebaseUser.user.uid));

    if (existingUser) {
      // User already exists, proceed with login flow
      if (!existingUser.roles.includes("admin")) {
        if (onFailed) onFailed();
        return rejectWithValue("You are not allowed to register");
      }

      // Create session using the same pattern as email/password auth
      const idToken = await firebaseUser.user.getIdToken();
      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        const res = await response.json();
        console.log(res);
        if (onFailed) onFailed();
        return rejectWithValue("Session not set");
      }

      if (onSuccess) onSuccess();
      return fulfillWithValue({
        ...existingUser,
        firebase: firebaseUser.user.toJSON() as UserCredential["user"],
      });
    }

    // Create new user in our system
    const [user, axiosError] = await asyncHandler<
      User,
      AxiosError<{ message: string }>
    >(
      createUser({
        uid: firebaseUser.user.uid,
        roles: ["admin"],
        email: firebaseUser.user.email || "",
      })
    );

    if (axiosError || !user) {
      console.log(axiosError);
      await firebaseUser.user.delete();
      if (onFailed) onFailed();
      return rejectWithValue(
        axiosError?.response?.data.message || "User creation failed"
      );
    }

    // Create session using the same pattern as email/password auth
    const idToken = await firebaseUser.user.getIdToken();
    const response = await fetch("/api/auth/session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
      const res = await response.json();
      console.log(res);
      if (onFailed) onFailed();
      return rejectWithValue("Session not set");
    }

    if (onSuccess) onSuccess();
    return fulfillWithValue({
      ...user,
      firebase: firebaseUser.user.toJSON() as UserCredential["user"],
    });
  }
);

export const handleGoogleAuthRedirect = createAsyncThunk(
  "auth/handleGoogleAuthRedirect",
  async (
    {
      isRegister = false,
      onSuccess,
      onFailed,
    }: {
      isRegister?: boolean;
      onSuccess?: () => void;
      onFailed?: () => void;
    } = {},
    { rejectWithValue, fulfillWithValue }
  ) => {
    const [redirectResult, redirectError] = await asyncHandler<
      UserCredential | null,
      AuthError
    >(handleGoogleRedirectResult());

    if (redirectError) {
      if (onFailed) onFailed();
      return rejectWithValue(redirectError.message || "Redirect failed");
    }

    if (!redirectResult) {
      // No redirect result means no redirect was in progress
      return fulfillWithValue(null);
    }

    const firebaseUser = redirectResult;

    if (isRegister) {
      // Handle register flow
      const [existingUser] = await asyncHandler<
        User,
        AxiosError<{ message: string }>
      >(getUser(firebaseUser.user.uid));

      if (existingUser) {
        // User already exists, log them in
        if (!existingUser.roles.includes("admin")) {
          if (onFailed) onFailed();
          return rejectWithValue("You are not allowed to login");
        }

        const idToken = await firebaseUser.user.getIdToken();
        const response = await fetch("/api/auth/session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ idToken }),
        });

        if (!response.ok) {
          if (onFailed) onFailed();
          return rejectWithValue("Session not set");
        }

        if (onSuccess) onSuccess();
        return fulfillWithValue({
          ...existingUser,
          firebase: firebaseUser.user.toJSON() as UserCredential["user"],
        });
      }

      // Create new user
      const [user, axiosError] = await asyncHandler<
        User,
        AxiosError<{ message: string }>
      >(
        createUser({
          uid: firebaseUser.user.uid,
          roles: ["admin"],
          email: firebaseUser.user.email || "",
        })
      );

      if (axiosError || !user) {
        await firebaseUser.user.delete();
        if (onFailed) onFailed();
        return rejectWithValue(
          axiosError?.response?.data.message || "User creation failed"
        );
      }

      const idToken = await firebaseUser.user.getIdToken();
      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        if (onFailed) onFailed();
        return rejectWithValue("Session not set");
      }

      if (onSuccess) onSuccess();
      return fulfillWithValue({
        ...user,
        firebase: firebaseUser.user.toJSON() as UserCredential["user"],
      });
    } else {
      // Handle login flow
      const [user, axiosError] = await asyncHandler<
        User,
        AxiosError<{ message: string }>
      >(getUser(firebaseUser.user.uid));

      if (axiosError || !user) {
        if (onFailed) onFailed();
        return rejectWithValue(
          axiosError?.response?.data.message || "User not found"
        );
      }

      if (!user.roles.includes("admin")) {
        if (onFailed) onFailed();
        return rejectWithValue("You are not allowed to login");
      }

      const idToken = await firebaseUser.user.getIdToken();
      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        if (onFailed) onFailed();
        return rejectWithValue("Session not set");
      }

      if (onSuccess) onSuccess();
      return fulfillWithValue({
        ...user,
        firebase: firebaseUser.user.toJSON() as UserCredential["user"],
      });
    }
  }
);

export const verifyEmailStatus = createAsyncThunk(
  "auth/verifyEmailStatus",
  async (_, { rejectWithValue, fulfillWithValue }) => {
    const [isVerified, error] = await asyncHandler(checkEmailVerification());

    if (error) {
      return rejectWithValue("Unable to check email verification status");
    }

    return fulfillWithValue(isVerified);
  }
);

export const registerUser = createAsyncThunk(
  "auth/register",
  async (
    registerDto: RegisterDto & {
      onSuccess?: () => void;
      onFailed?: () => void;
    },
    { rejectWithValue, fulfillWithValue }
  ) => {
    const [firebaseUser, firebaseError] = await asyncHandler<
      UserCredential,
      AuthError
    >(firebaseCreateUser(registerDto));

    if (firebaseError || !firebaseUser) {
      console.log(firebaseError);
      return rejectWithValue(
        firebaseError?.message || "Firebase register error"
      );
    }

    await firebaseSendValidationEmail(firebaseUser.user);

    const [user, axiosError] = await asyncHandler<
      User,
      AxiosError<{ message: string }>
    >(
      createUser({
        uid: firebaseUser.user.uid,
        roles: ["admin"],
        email: firebaseUser.user.email || "",
      })
    );

    if (axiosError || !user) {
      console.log(axiosError);
      await firebaseUser.user.delete();
      return rejectWithValue(
        axiosError?.response?.data.message || "Axios error"
      );
    }

    const idToken = await firebaseUser.user.getIdToken();
    const response = await fetch("/api/auth/session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
      const res = await response.json();
      console.log(res);
      if (registerDto.onFailed) registerDto.onFailed();
      return rejectWithValue("Session not set");
    }

    if (registerDto.onSuccess) registerDto.onSuccess();
    return fulfillWithValue({
      ...user,
      firebase: firebaseUser.user.toJSON() as UserCredential["user"],
    });
  }
);

export const loginUser = createAsyncThunk(
  "auth/login",
  async (
    loginDto: LoginDto & {
      onSuccess?: () => void;
      onFailed?: () => void;
    },
    { rejectWithValue, fulfillWithValue }
  ) => {
    const [firebaseUser, firebaseError] = await asyncHandler<
      UserCredential,
      AuthError
    >(firebaseLoginUser(loginDto));

    if (firebaseError || !firebaseUser) {
      return rejectWithValue(
        firebaseError?.message || "Firebase register error"
      );
    }

    const [user, axiosError] = await asyncHandler<
      User,
      AxiosError<{ message: string }>
    >(getUser(firebaseUser.user.uid));

    if (axiosError || !user) {
      console.log(axiosError);
      return rejectWithValue(
        axiosError?.response?.data.message || "Axios error"
      );
    }

    if (!user.roles.includes("admin")) {
      // await firebaseUser.user.delete();
      return rejectWithValue("You are not allowed to login");
    }

    const idToken = await firebaseUser.user.getIdToken();
    const response = await fetch("/api/auth/session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
      const res = await response.json();
      console.log(res);
      if (loginDto.onFailed) loginDto.onFailed();
      return rejectWithValue("Session not set");
    }

    if (loginDto.onSuccess) loginDto.onSuccess();
    return fulfillWithValue({
      ...user,
      firebase: firebaseUser.user.toJSON() as UserCredential["user"],
    });
  }
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
        firebaseError?.message || "Firebase register error"
      );
    }

    const [userInfos, axiosError] = await asyncHandler<
      User,
      AxiosError<{ message: string }>
    >(getUser(firebaseUser.uid));

    if (axiosError || !userInfos) {
      console.log(axiosError);
      return rejectWithValue(
        axiosError?.response?.data.message || "Axios error"
      );
    }

    if (!userInfos.roles.includes("admin")) {
      // await firebaseUser.user.delete();
      return rejectWithValue("You are not allowed to login");
    }

    return fulfillWithValue({
      ...userInfos,
      firebase: firebaseUser.toJSON() as UserCredential["user"],
    });
  }
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
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {},
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
        }
      )
      .addCase(authenticateUser.rejected, (state: AuthInitialState, action) => {
        state.authenticate.loading = false;
        state.authenticate.error = action.payload as string;
        state.authenticate.status = "error";
      })
      .addCase(loginUser.pending, (state: AuthInitialState) => {
        state.login.loading = true;
        state.login.error = "";
        state.login.status = "pending";
      })
      .addCase(loginUser.fulfilled, (state: AuthInitialState, action) => {
        state.login.loading = false;
        state.login.error = "";
        state.login.status = "success";
        state.infos = action.payload;
        state.isLoggedIn = true;
      })
      .addCase(loginUser.rejected, (state: AuthInitialState, action) => {
        state.login.loading = false;
        state.login.error = action.payload as string;
        state.login.status = "error";
      })
      .addCase(registerUser.pending, (state: AuthInitialState) => {
        state.register.loading = true;
        state.register.error = "";
        state.register.status = "pending";
      })
      .addCase(registerUser.fulfilled, (state: AuthInitialState) => {
        state.register.loading = false;
        state.register.error = "";
        state.register.status = "success";
        // Don't set user as logged in until email is verified
        // state.infos = action.payload;
        // state.isLoggedIn = true;
      })
      .addCase(registerUser.rejected, (state: AuthInitialState, action) => {
        state.register.loading = false;
        state.register.error = action.payload as string;
        state.register.status = "error";
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
      .addCase(loginWithGoogle.pending, (state: AuthInitialState) => {
        state.googleAuth.loading = true;
        state.googleAuth.error = "";
        state.googleAuth.status = "pending";
      })
      .addCase(loginWithGoogle.fulfilled, (state: AuthInitialState, action) => {
        state.googleAuth.loading = false;
        state.googleAuth.error = "";
        state.googleAuth.status = "success";
        state.infos = action.payload;
        state.isLoggedIn = true;
      })
      .addCase(loginWithGoogle.rejected, (state: AuthInitialState, action) => {
        state.googleAuth.loading = false;
        state.googleAuth.error = action.payload as string;
        state.googleAuth.status = "error";
      })
      .addCase(registerWithGoogle.pending, (state: AuthInitialState) => {
        state.googleAuth.loading = true;
        state.googleAuth.error = "";
        state.googleAuth.status = "pending";
      })
      .addCase(
        registerWithGoogle.fulfilled,
        (state: AuthInitialState, action) => {
          state.googleAuth.loading = false;
          state.googleAuth.error = "";
          state.googleAuth.status = "success";
          state.infos = action.payload;
          state.isLoggedIn = true;
        }
      )
      .addCase(
        registerWithGoogle.rejected,
        (state: AuthInitialState, action) => {
          state.googleAuth.loading = false;
          state.googleAuth.error = action.payload as string;
          state.googleAuth.status = "error";
        }
      )
      .addCase(handleGoogleAuthRedirect.pending, (state: AuthInitialState) => {
        state.googleAuth.loading = true;
        state.googleAuth.error = "";
        state.googleAuth.status = "pending";
      })
      .addCase(
        handleGoogleAuthRedirect.fulfilled,
        (state: AuthInitialState, action) => {
          state.googleAuth.loading = false;
          state.googleAuth.error = "";

          if (action.payload) {
            // Redirect result was processed successfully
            state.googleAuth.status = "success";
            state.infos = action.payload;
            state.isLoggedIn = true;
          } else {
            // No redirect result means no redirect was in progress
            state.googleAuth.status = "pending";
          }
        }
      )
      .addCase(
        handleGoogleAuthRedirect.rejected,
        (state: AuthInitialState, action) => {
          state.googleAuth.loading = false;
          state.googleAuth.error = action.payload as string;
          state.googleAuth.status = "error";
        }
      )
      .addCase(resetPassword.pending, (state: AuthInitialState) => {
        state.reset.loading = true;
        state.reset.error = "";
        state.reset.status = "pending";
      })
      .addCase(resetPassword.fulfilled, (state: AuthInitialState) => {
        state.reset.loading = false;
        state.reset.error = "";
        state.reset.status = "success";
      })
      .addCase(resetPassword.rejected, (state: AuthInitialState, action) => {
        state.reset.loading = false;
        state.reset.error = action.payload as string;
        state.reset.status = "error";
      })
      .addCase(verifyEmailStatus.pending, (state: AuthInitialState) => {
        state.verifyEmail.loading = true;
        state.verifyEmail.error = "";
        state.verifyEmail.status = "pending";
      })
      .addCase(
        verifyEmailStatus.fulfilled,
        (state: AuthInitialState, action) => {
          state.verifyEmail.loading = false;
          state.verifyEmail.error = "";
          state.verifyEmail.status = "success";
          // Update the user's email verification status in Firebase info
          if (state.infos && state.infos.firebase) {
            state.infos = {
              ...state.infos,
              firebase: {
                ...state.infos.firebase,
                emailVerified: action.payload,
              },
            } as AppUser;
          }
        }
      )
      .addCase(
        verifyEmailStatus.rejected,
        (state: AuthInitialState, action) => {
          state.verifyEmail.loading = false;
          state.verifyEmail.error = action.payload as string;
          state.verifyEmail.status = "error";
        }
      );
  },
});

const { reducer } = authSlice;
export default reducer;
