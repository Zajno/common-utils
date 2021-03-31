import * as admin from 'firebase-admin';

export const ServiceAccountPath = process.env.GOOGLE_SERVICE_ACCOUNT;
export const ServiceAccountCredential = ServiceAccountPath && admin.credential.cert(ServiceAccountPath);

const app = ServiceAccountCredential
    ? admin.initializeApp({
        credential: ServiceAccountCredential,
    })
    : admin.initializeApp();

export const ProjectId = app.options.projectId;
export const DefaultCredential = app.options.credential;

export default app;

export {
    admin as AdminLib,
};
