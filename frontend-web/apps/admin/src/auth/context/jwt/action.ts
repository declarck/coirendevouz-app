import axios, { endpoints } from 'src/lib/axios';

import { setSession } from './utils';

// ----------------------------------------------------------------------

export type SignInParams = {
  email: string;
  password: string;
};

export type SignUpParams = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
};

/** Django `RegisterSerializer` ile uyumlu; kayıt JWT dönmez — ardından giriş yapılır. */
export type RegisterAccountParams = {
  email: string;
  password: string;
  full_name: string;
  phone: string;
  role: 'customer' | 'business_admin' | 'staff';
};

/** **************************************
 * Sign in
 *************************************** */
export const signInWithPassword = async ({ email, password }: SignInParams): Promise<void> => {
  try {
    const params = { email, password };

    const res = await axios.post(endpoints.auth.signIn, params);

    const accessToken = res.data.access ?? res.data.accessToken;
    const refreshToken = res.data.refresh as string | undefined;

    if (!accessToken) {
      throw new Error('Access token not found in response');
    }

    await setSession(accessToken, refreshToken ?? null);
  } catch (error) {
    console.error('Error during sign in:', error);
    throw error;
  }
};

/** **************************************
 * Register (herhangi bir rol) + oturum aç
 *************************************** */
export const registerAccount = async (params: RegisterAccountParams): Promise<void> => {
  try {
    await axios.post(endpoints.auth.signUp, {
      email: params.email,
      password: params.password,
      full_name: params.full_name,
      phone: params.phone,
      role: params.role,
    });
    await signInWithPassword({ email: params.email, password: params.password });
  } catch (error) {
    console.error('Error during register:', error);
    throw error;
  }
};

/** **************************************
 * Sign up (müşteri — ad/soyad birleştirilir)
 *************************************** */
export const signUp = async ({
  email,
  password,
  firstName,
  lastName,
}: SignUpParams): Promise<void> => {
  const full_name = `${firstName} ${lastName}`.trim();
  await registerAccount({
    email,
    password,
    full_name: full_name || email,
    phone: '',
    role: 'customer',
  });
};

/** **************************************
 * Sign out
 *************************************** */
export const signOut = async (): Promise<void> => {
  try {
    await setSession(null);
  } catch (error) {
    console.error('Error during sign out:', error);
    throw error;
  }
};
