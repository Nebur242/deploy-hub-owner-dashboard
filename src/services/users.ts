import {
  createUserWithEmailAndPassword,
  User as FirebaseUser,
  getAuth,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { API_ROUTES, AXIOS } from "../config/api";
import { Role, User } from "@/common/types";
import { LoginDto, RegisterDto } from "@/common/dtos";

export const createUser = async (createUserDto: {
  uid: string;
  roles: Role[];
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
