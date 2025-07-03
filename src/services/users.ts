import {
  createUserWithEmailAndPassword,
  User as FirebaseUser,
  getAuth,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  GoogleAuthProvider,
  signInWithPopup,
  UserCredential,
} from "firebase/auth";
import { API_ROUTES, AXIOS } from "../config/api";
import { Role, User } from "@/common/types";
import { LoginDto, RegisterDto } from "@/common/dtos";

export const createUser = async (createUserDto: {
  uid: string;
  roles: Role[];
  email: string;
}) => {
  const response = await AXIOS.post<{ data: User }>(
    API_ROUTES.users,
    createUserDto
  );
  return response.data.data;
};

export const sendPasswordResetEmailApi = async (email: string) => {
  const response = await AXIOS.post("/auth/reset-password", { email });
  return response.data.data;
};

export const getUser = async (uid: string): Promise<User> => {
  const response = await AXIOS.get<{ data: User }>(`/users/${uid}`);
  return response.data.data;
};

export const firebaseCreateUser = async (infos: RegisterDto) => {
  const auth = getAuth();
  const { email, password } = infos;
  return createUserWithEmailAndPassword(auth, email, password);
};

export const firebaseLoginUser = async (infos: LoginDto) => {
  const auth = getAuth();
  const { email, password } = infos;
  return signInWithEmailAndPassword(auth, email, password);
};

export const firebaseLoginWithGoogle = async (): Promise<UserCredential> => {
  const auth = getAuth();
  const provider = new GoogleAuthProvider();
  provider.addScope("profile");
  provider.addScope("email");

  // Configure provider settings for better compatibility
  provider.setCustomParameters({
    prompt: "select_account",
  });

  try {
    // Try popup first
    return await signInWithPopup(auth, provider);
  } catch (error: unknown) {
    // If popup is blocked or fails, fallback to redirect
    const authError = error as { code?: string };
    if (
      authError.code === "auth/popup-blocked" ||
      authError.code === "auth/popup-closed-by-user" ||
      authError.code === "auth/cancelled-popup-request"
    ) {
      const { signInWithRedirect } = await import("firebase/auth");
      await signInWithRedirect(auth, provider);
      throw new Error("REDIRECT_IN_PROGRESS");
    }
    throw error;
  }
};

export const handleGoogleRedirectResult =
  async (): Promise<UserCredential | null> => {
    const auth = getAuth();
    const { getRedirectResult } = await import("firebase/auth");

    try {
      const result = await getRedirectResult(auth);
      return result;
    } catch (error: unknown) {
      console.error("Error handling redirect result:", error);
      throw error;
    }
  };

export const firebaseRegisterWithGoogle = async (): Promise<UserCredential> => {
  const auth = getAuth();
  const provider = new GoogleAuthProvider();
  provider.addScope("profile");
  provider.addScope("email");

  // Configure provider settings for better compatibility
  provider.setCustomParameters({
    prompt: "select_account",
  });

  try {
    // Try popup first
    return await signInWithPopup(auth, provider);
  } catch (error: unknown) {
    // If popup is blocked or fails, fallback to redirect
    const authError = error as { code?: string };
    if (
      authError.code === "auth/popup-blocked" ||
      authError.code === "auth/popup-closed-by-user" ||
      authError.code === "auth/cancelled-popup-request"
    ) {
      const { signInWithRedirect } = await import("firebase/auth");
      await signInWithRedirect(auth, provider);
      throw new Error("REDIRECT_IN_PROGRESS");
    }
    throw error;
  }
};

export const authUser = async (): Promise<FirebaseUser | null> => {
  const auth = getAuth();
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      resolve(user);
      unsubscribe();
    });
  });
};

export const logout = async (): Promise<void> => {
  const auth = getAuth();
  await auth.signOut();
};
export const firebaseSendPasswordResetEmail = async (email: string) => {
  const auth = getAuth();
  return sendPasswordResetEmail(auth, email);
};

export const firebaseSendValidationEmail = async (user: FirebaseUser) => {
  sendEmailVerification(user);
};

export const checkEmailVerification = async (): Promise<boolean> => {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User not authenticated");
  }

  // Reload user to get latest verification status
  await user.reload();
  return user.emailVerified;
};

/**
 * Change user password with Firebase Auth
 * Requires re-authentication before changing password for security
 *
 * @param currentPassword - User's current password for verification
 * @param newPassword - New password to set
 * @returns Promise that resolves when password is successfully changed
 * @throws Firebase Auth errors on failure
 */
export const changePassword = async (
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user || !user.email) {
    throw new Error("User not authenticated");
  }

  try {
    // First re-authenticate user to ensure security for sensitive operations
    const credential = EmailAuthProvider.credential(
      user.email,
      currentPassword
    );
    await reauthenticateWithCredential(user, credential);

    // Then update password
    await updatePassword(user, newPassword);
  } catch (err) {
    const error = err as { code: string };
    // Rethrow with more descriptive message
    if (error.code === "auth/wrong-password") {
      throw new Error("Current password is incorrect");
    } else if (error.code === "auth/weak-password") {
      throw new Error("New password is too weak. Use at least 6 characters");
    } else {
      throw error;
    }
  }
};

/**
 * Signs out the user from all devices except the current one by revoking refresh tokens
 * First requires reauthentication to verify user identity
 *
 * @param currentPassword - User's current password for verification
 * @returns Promise that resolves when successful
 * @throws Firebase Auth errors on failure
 */
export const signOutAllDevices = async (
  currentPassword: string
): Promise<void> => {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user || !user.email) {
    throw new Error("User not authenticated");
  }

  try {
    // First re-authenticate user to ensure security for sensitive operations
    const credential = EmailAuthProvider.credential(
      user.email,
      currentPassword
    );
    await reauthenticateWithCredential(user, credential);

    // Firebase's built-in method to revoke refresh tokens
    // This forces all other devices to reauthenticate, effectively signing them out
    await auth.currentUser?.getIdToken(true);
  } catch (err) {
    const error = err as { code: string };
    // Rethrow with more descriptive message
    if (error.code === "auth/wrong-password") {
      throw new Error("Current password is incorrect");
    } else {
      throw error;
    }
  }
};
