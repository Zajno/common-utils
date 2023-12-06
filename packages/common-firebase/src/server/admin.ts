import * as admin from 'firebase-admin';

export const ServiceAccountPath = process.env.GOOGLE_SERVICE_ACCOUNT;
export const ServiceAccountCredential = ServiceAccountPath && admin.credential.cert(ServiceAccountPath);

const Admin = ServiceAccountCredential
    ? admin.initializeApp({
        credential: ServiceAccountCredential,
    })
    : admin.initializeApp();

export const ProjectId = Admin.options.projectId || (Admin.options.credential as any)?.projectId;
export const DefaultCredential = Admin.options.credential;

// eslint-disable-next-line no-console
console.log('[Admin] Initialized with project ID:', ProjectId);

export default Admin;

export {
    admin as AdminLib,
};
