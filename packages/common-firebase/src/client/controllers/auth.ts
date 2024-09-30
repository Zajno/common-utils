import {
    IAuthController,
    AuthUser,
    AuthUserWithProviders,
    AuthProviders,
    MagicLinkRequestReasons,
    AuthResult,
    AuthErrors,
    AuthUserUpdate,
} from '../../abstractions/IAuthController';
import { makeObservable, observable, runInAction } from 'mobx';
import Firebase from '../firebase';
import { createLogger } from '@zajno/common/logger/index';
import { Event } from '@zajno/common/observing/event';
import { transferFields } from '@zajno/common/fields/transfer';
import { prepareEmail } from '@zajno/common/validation/emails';
import { IStorage } from '@zajno/common/storage';
import { Disposable } from '@zajno/common/functions/disposer';
import { FlagModel, NumberModel } from '@zajno/common-mobx/viewModels/index';
import { assert } from '@zajno/common/functions/assert';
import { truthy } from '@zajno/common/types/arrays';

export type { IAuthController };
export const logger = createLogger('[Auth]');

const AuthProviderIdKey = 'auth:providerid';
const UserSignInEmailStorageKey = 'auth:signin:email';
const MagicLinkReasonKey = 'auth:signin:reason';
const PasswordResetRequestedKey = 'auth:passwordreset';

export abstract class AuthControllerBase<TUser extends AuthUser = AuthUser> extends Disposable implements IAuthController {
    private _authUser: AuthUserWithProviders<TUser> | null = null;

    protected readonly _initializing = new NumberModel(0);

    private _nextProvider: AuthProviders | null = null;
    private readonly _magicLinkSucceeded = new Event<MagicLinkRequestReasons>();

    private readonly _setPasswordMode = new FlagModel(false);

    private readonly _onSignOut = new Event();
    private readonly _onPreProcessUser = new Event<AuthUserWithProviders<TUser>>();

    private readonly _firstInit = new FlagModel(true);

    constructor(forceInitialize = false) {
        super();
        makeObservable<AuthControllerBase<TUser>, '_authUser'>(this, {
            _authUser: observable,
        });

        const initialize = () => this.doInitialization(this.processAuthUser.bind(this), true);
        this.disposer.add(
            Firebase.Instance.auth.onAuthStateChanged(initialize),
        );

        if (forceInitialize) {
            initialize();
        }
    }

    get authUser(): Readonly<AuthUserWithProviders<TUser>> | null { return this._authUser; }
    get initializing() { return this._firstInit.value || !this._initializing.isDefault; }
    get magicLinkSucceeded() { return this._magicLinkSucceeded.expose(); }

    get setPasswordMode() { return this._setPasswordMode.value; }
    get needsCreatePassword(): boolean | null {
        if (!this.authUser || !this.authUser.providers || !this.authUser.currentProvider
            || this.authUser.currentProvider === AuthProviders.Google
            || this.authUser.currentProvider === AuthProviders.DevLogin) {
            return null;
        }

        return !this.authUser.providers.includes(AuthProviders.EmailAndPassword);
    }

    get onPreProcessUser() { return this._onPreProcessUser.expose(); }
    get onSignOut() { return this._onSignOut.expose(); }

    get appleSignInSupported() { return false; }

    abstract get locationUrl(): string;

    protected abstract get Storage(): IStorage;

    get logger() { return logger; }

    protected async processAuthUser() {
        const authUser = Firebase.Instance.auth.currentUser;

        const methods = authUser?.email && await this.getEmailAuthMethod(authUser.email);

        let provider: AuthProviders | null;
        if (!authUser) {
            provider = null;
        } else if (this._nextProvider) {
            // logger.log('NEXT PROVIDER ====>', this._nextProvider);
            provider = this._nextProvider;
            this._nextProvider = null;
            await this.Storage.setValue(AuthProviderIdKey, provider);
        } else {
            provider = (await this.Storage.getValue(AuthProviderIdKey) || '') as AuthProviders;
        }

        logger.log('Initializing with user:', authUser?.email, '; provider =', provider, '; uid =', authUser?.uid);

        const signedIn = !this._authUser && authUser;
        const result = this.createAuthUser() as AuthUserWithProviders<TUser>;
        if (result) {
            result.providers = methods || [];
            result.currentProvider = provider;
        }

        await this._onPreProcessUser.triggerAsync(result);

        runInAction(() => this._authUser = result);

        if (signedIn) {
            const createPassword = this.needsCreatePassword;
            const resetPassword = provider === AuthProviders.EmailLink && (await this.Storage.getValue(PasswordResetRequestedKey)) === 'true';
            if (createPassword || resetPassword) {
                logger.log('Setting _setPasswordMode = true createPassword =', createPassword, 'resetPassword =', resetPassword);
                this._setPasswordMode.setTrue();
            }
        }
    }

    protected createAuthUser(): TUser {
        const authUser = Firebase.Instance.auth.currentUser;

        const result: AuthUser | null = authUser ? {
            uid: authUser.uid,
            displayName: authUser.displayName,
            email: authUser.email,
            emailVerified: authUser.emailVerified,
            phoneNumber: authUser.phoneNumber,
            photoURL: authUser.photoURL,
        } : null;

        return result as TUser;
    }

    protected forceEnableSetPasswordMode() {
        this._setPasswordMode.setTrue();
    }

    public skipPasswordMode(): void {
        this._setPasswordMode.setFalse();
        this.Storage.removeValue(PasswordResetRequestedKey);
    }

    protected setNextProvider(p: AuthProviders) {
        logger.log('next provider =>', p);
        this._nextProvider = p;
    }

    async getEmailAuthMethod(email: string | null): Promise<AuthProviders[]> {
        const methods = email && typeof email === 'string' && await Firebase.Instance.auth.fetchSignInMethodsForEmail(email);
        const results = (methods || []).map(m => {
            switch (m) {
                case Firebase.Instance.types.FirebaseAuth.EmailAuthProvider.EMAIL_PASSWORD_SIGN_IN_METHOD: {
                    return AuthProviders.EmailAndPassword;
                }

                case Firebase.Instance.types.FirebaseAuth.EmailAuthProvider.EMAIL_LINK_SIGN_IN_METHOD: {
                    return AuthProviders.EmailLink;
                }

                case Firebase.Instance.types.FirebaseAuth.GoogleAuthProvider.PROVIDER_ID: {
                    return AuthProviders.Google;
                }

                default: {
                    return null;
                }
            }
        }).filter(truthy);

        if (results.length === 0) {
            logger.log('No auth methods for email', email, '; existing are:', methods);
        }

        return results;
    }

    async getHasAccount(email: string): Promise<boolean> {
        const methods = await this.getEmailAuthMethod(email);
        return methods.length > 0;
    }

    public signInWithEmailLink(email: string, reason: MagicLinkRequestReasons) {
        return this.sendMagicLinkRequest(email, reason);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected async sendMagicLinkRequest(emailInput: string, reason: MagicLinkRequestReasons, displayName?: string) {
        const email = prepareEmail(emailInput);
        logger.log('sendMagicLinkRequest', email, reason);

        // don't use Promise.all here – it crashes Expo
        await this.Storage.setValue(UserSignInEmailStorageKey, email);
        await this.Storage.setValue(MagicLinkReasonKey, reason || 'empty');
        await this.Storage.removeValue(PasswordResetRequestedKey);

        await Firebase.Instance.auth.sendSignInLinkToEmail(email, {
            url: this.locationUrl,
        });
    }

    protected async processEmailLink(): Promise<{ result?: true, error?: 'invalidLink' | 'noemail' | Error, email?: string }> {
        let email = await this.Storage.getValue(UserSignInEmailStorageKey);
        const url = this.locationUrl;
        try {
            if (!Firebase.Instance.auth.isSignInWithEmailLink(url)) {
                logger.log('Current path is not sign in link:', url);
                return { error: 'invalidLink' };
            }

            email = prepareEmail(email);
            if (!email) {
                logger.log('User was not performing a sign in');
                return { error: 'noemail' };
            }

            this.setNextProvider(AuthProviders.EmailLink);
            await Firebase.Instance.auth.signInWithEmailLink(email, url);

            const reason = await this.Storage.getValue(MagicLinkReasonKey) as MagicLinkRequestReasons;
            this.logger.log('processEmailLink reason =', reason);
            if (reason === MagicLinkRequestReasons.PasswordReset) {
                await this.Storage.setValue(PasswordResetRequestedKey, 'true');
                this._setPasswordMode.setTrue();
            }

            await this.Storage.removeValue(MagicLinkReasonKey);
            await this.Storage.removeValue(UserSignInEmailStorageKey);

            this.logger.log('processEmailLink succeed with reason =', reason);
            this._magicLinkSucceeded.trigger(reason);

            return { result: true };

        } catch (err) {
            this.setNextProvider(AuthProviders.None);
            logger.error('Failed to perform a sign in for user:', email, '; Error:', err);
            return {
                error: err as Error,
                email: email || undefined,
            };
        }
    }

    async signInWithEmailPassword(email: string, password: string): Promise<void> {
        const e = prepareEmail(email);

        try {
            this.setNextProvider(AuthProviders.EmailAndPassword);
            await Firebase.Instance.auth.signInWithEmailAndPassword(e, password);
            await this.Storage.removeValue(PasswordResetRequestedKey);
        } catch (err) {
            this.setNextProvider(AuthProviders.None);
            throw err;
        }
    }

    async createAccountForEmailAndPassword(email: string, password: string): Promise<void> {
        const e = prepareEmail(email);
        logger.log('Creating an account for ', e);
        try {
            this.setNextProvider(AuthProviders.EmailAndPassword);
            await Firebase.Instance.auth.createUserWithEmailAndPassword(e, password);
        } catch (err) {
            this.setNextProvider(AuthProviders.None);
            throw err;
        }
    }

    async updatePassword(password: string, oldPassword?: string): Promise<AuthResult> {
        const authUser = Firebase.Instance.auth.currentUser;
        if (!authUser) {
            return { result: false, error: AuthErrors.InvalidAuthState, original: null };
        }

        try {
            await authUser.updatePassword(password);
            logger.log('password updated successfully!!');
            assert(!!this._authUser, 'authUser is null');
            this._authUser.providers = await this.getEmailAuthMethod(authUser.email);
            this._setPasswordMode.setFalse();
            await this.Storage.removeValue(PasswordResetRequestedKey);

            return { result: true };
        } catch (err) {
            const e1 = err as Error & { code: string };
            logger.log('failed to update password:', e1.code);
            if (e1.code === 'auth/requires-recent-login') {
                if (oldPassword) {
                    const email = this.authUser?.email;
                    assert(!!email, 'email is null');
                    const cred = Firebase.Instance.types.FirebaseAuth.EmailAuthProvider.credential(email, oldPassword);
                    try {
                        logger.log('re-authenticating with email/password for', email);
                        await authUser.reauthenticateWithCredential(cred);
                    } catch (err2) {
                        const e2 = err as Error & { code: string };
                        logger.log('failed to re-authenticate, ERROR:', err2);
                        return {
                            result: false,
                            error: e2.code === 'auth/wrong-password'
                                ? AuthErrors.WrongPassword
                                : AuthErrors.InvalidAuthState,
                            original: e2,
                        };
                    }

                    return await this.updatePassword(password);
                }

                return {
                    result: false,
                    error: AuthErrors.NeedsReAuthentication,
                    original: e1,
                };
            } else {
                throw err;
            }
        }
    }

    protected doGoogleSignIn() {
        const provider = new Firebase.Instance.types.FirebaseAuth.GoogleAuthProvider();
        return Firebase.Instance.auth.signInWithPopup(provider);
    }

    async signInWithGoogle(): Promise<boolean> {
        try {
            this.setNextProvider(AuthProviders.Google);

            const result = await this.doGoogleSignIn();
            if (!result) {
                logger.warn('Google SignIn: no result (probably canceled)');
                this.setNextProvider(AuthProviders.None);
                return false;
            }

            logger.log('Google: Successfully signed in with user', result.user?.email);

            // not necessary to init because onAuthStateChanged should be triggered
            // await this.init();
            return true;
        } catch (err) {
            const e1 = err as Error & { code: string, email: string };
            this.setNextProvider(AuthProviders.None);

            // tslint:disable-next-line: triple-equals
            if (e1.code == '-3' || (e1.message && e1.message.includes('error -3'))) {
                logger.log('Cancel sign in with google');
                return false;
            }

            logger.warn('Google Sign in error:', e1.message, err);

            // Handle Errors here.
            const errorCode: string = e1.code;
            // const errorMessage = e1.message;
            // The email of the user's account used.
            const email = e1.email;
            // The firebase.auth.AuthCredential type that was used.
            // const credential = e1.credential;

            if (errorCode === 'auth/account-exists-with-different-credential') {
                // Construct the email link credential from the current URL.
                const emailCredential = Firebase.Instance.types.FirebaseAuth.EmailAuthProvider.credentialWithLink(
                    email, this.locationUrl);

                // Link the credential to the current user.
                try {
                    const currentUser = Firebase.Instance.auth.currentUser;
                    assert(!!currentUser, 'currentUser is null');
                    await currentUser.linkWithCredential(emailCredential);
                    // The provider is now successfully linked.
                    // The phone user can now sign in with their phone number or email.
                    return false;

                } catch (_innerErr) {
                    // Some error occurred.
                }
            }
            throw err;
        }
    }

    async signOut() {
        logger.log('Signing out...');
        await this.doInitialization(async () => {
            try {
                this._setPasswordMode.setFalse();

                await this._onSignOut.triggerAsync();

                await this.servicesSignOut();

                await this.Storage.removeValue(AuthProviderIdKey);
                await this.Storage.removeValue(MagicLinkReasonKey);

                await Firebase.Instance.auth.signOut();
            } catch (err) {
                logger.warn('Failed to sign out!');
                // eslint-disable-next-line no-console
                console.error(err);
                throw err;
            }
        });
    }

    protected abstract googleSignOut(): Promise<void>;

    protected async servicesSignOut() {
        await this.googleSignOut();
    }

    updatePhotoUrl(photoUrl: string): Promise<void> {
        return this.updateProfile({ photoURL: photoUrl });
    }

    async updateProfile(data: AuthUserUpdate): Promise<void> {
        const currentAuthUser = this._authUser;
        assert(!!currentAuthUser, 'currentAuthUser is null');

        const diff: typeof data = {};
        if (!transferFields.changed(data, currentAuthUser, diff, 'displayName', 'photoURL')) {
            return;
        }

        const currentUser = Firebase.Instance.auth.currentUser;
        assert(!!currentUser, 'FB currentUser is null');
        await currentUser.updateProfile(diff);

        runInAction(() => {
            assert(!!this._authUser, '_authUser is null');
            this._authUser.photoURL = currentUser.photoURL;
            this._authUser.displayName = currentUser.displayName;
        });
        logger.log('AuthUser profile updated:', this._authUser);
    }


    protected async doInitialization<T>(cb: () => Promise<T>, useFirstInit = false): Promise<T> {
        try {
            this._initializing.increment(1);
            const res = await cb();
            return res;
        } finally {
            this._initializing.decrement(1);
            if (useFirstInit) {
                this._firstInit.setFalse();
            }
        }
    }
}
