import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { AxiosError } from "axios";
import { AuthError, UserCredential } from "firebase/auth";
import {
  CreateUserDto,
  LoginUserDto,
  Status,
  User,
} from "../../../common/type";
import "../../../config/firebase";
import {
  authUser,
  createUser,
  firebaseCreateUser,
  firebaseLoginUser,
  firebaseSendPasswordResetEmail,
  firebaseSendValidationEmail,
  getUser,
  logout,
} from "../../../services/users";
import { asyncHandler } from "@/utils/functions";

export interface AuthInitialState {
  infos: User | null;
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

export const registerUser = createAsyncThunk(
  "auth/register",
  async (
    registerDto: CreateUserDto & {
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
      })
    );

    if (axiosError || !user) {
      console.log(axiosError);
      await firebaseUser.user.delete();
      return rejectWithValue(axiosError?.message || "Axios error");
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
      rejectWithValue("Session not set");
    }

    return fulfillWithValue(user);
  }
);

export const loginUser = createAsyncThunk(
  "auth/login",
  async (
    loginDto: LoginUserDto & {
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
      console.log(firebaseError);
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
      return rejectWithValue(axiosError?.message || "Axios error");
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
      rejectWithValue("Session not set");
    }

    return fulfillWithValue(user);
  }
);

export const authenticateUser = createAsyncThunk(
  "auth/authenticate",
  async (_, { rejectWithValue, fulfillWithValue }) => {
    try {
      const response = await authUser();
      if (!response) throw new Error("User not connected");
      const userInfos = await getUser(response.uid);
      return fulfillWithValue(userInfos);
    } catch (error) {
      const err = error as Error;
      console.log(err);
      return rejectWithValue(err.message || "User not found");
    }
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
      .addCase(registerUser.fulfilled, (state: AuthInitialState, action) => {
        state.register.loading = false;
        state.register.error = "";
        state.register.status = "success";
        state.infos = action.payload;
        state.isLoggedIn = true;
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
      });
  },
});

const { reducer } = authSlice;
export default reducer;
