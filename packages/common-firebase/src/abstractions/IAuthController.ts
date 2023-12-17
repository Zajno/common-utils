import { IEvent } from '@zajno/common/observing/event';
import type firebase from 'firebase/compat/app';

export type FirebaseUser = firebase.User;

export type AuthUser = {
    uid: string;
    displayName: string | null;

    email: string | null;
    emailVerified: boolean;

    phoneNumber: string | null;

    photoURL: string | null;
};

export type AuthUserWithProviders<T> = T & {
    providers: ReadonlyArray<AuthProviders>,
    currentProvider: AuthProviders | null,
};

export enum AuthProviders {
    None = '',
    EmailLink = 'emaillink',
    EmailAndPassword = 'emailpassword',
    Google = 'google',
    Apple = 'apple',
    DevLogin = 'devLogin',
}

export enum MagicLinkRequestReasons {
    SignIn = 'signin',
    SignUp = 'signup',
    PasswordReset = 'password',
    PasswordChange = 'passwordChange',
    EmailReset = 'email',
}

export interface IAuthController {
    readonly authUser: Readonly<AuthUser> | null;
    readonly initializing: boolean;

    readonly needsCreatePassword: boolean | null;

    readonly magicLinkSucceeded: IEvent<MagicLinkRequestReasons>;

    readonly onPreProcessUser: IEvent<AuthUser>;
    readonly onSignOut: IEvent;

    readonly setPasswordMode: boolean;

    skipPasswordMode(): void;

    getEmailAuthMethod(email: string): Promise<AuthProviders[]>;
    getHasAccount(email: string): Promise<boolean>;

    signInWithEmailLink(email: string, reason: MagicLinkRequestReasons): Promise<void>;
    signInWithEmailPassword(email: string, password: string): Promise<void>;
    createAccountForEmailAndPassword(email: string, password: string): Promise<void>;

    signInWithGoogle(): Promise<boolean>;

    signOut(): Promise<void>;

    updatePassword(password: string, oldPassword?: string): Promise<AuthResult>;

    /** @deprecated Use `updateProfile` instead */
    updatePhotoUrl(photoUrl: string): Promise<void>;
    updateProfile(data: AuthUserUpdate): Promise<void>;
}

export type AuthUserUpdate = Partial<Pick<AuthUser, 'displayName' | 'photoURL'>>;

export type FirebaseError = Error & { code: string };

export type AuthResult = { result: true } | { result: false, error: AuthErrors, original: FirebaseError | null };

export enum AuthErrors {
    Unknown = 0,
    InvalidAuthState,
    WrongPassword,
    NeedsReauthentication,
}
