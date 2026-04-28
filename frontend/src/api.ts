import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
    url: window.location.origin.replace(':3000', ':8080'), // Dynamic Keycloak URL
    realm: 'master',
    clientId: 'admin-cli', // Default for dev, usually 'ztna-frontend'
});

export default keycloak;

export const apiFetch = async (url: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers);

    if (keycloak.token) {
        headers.set('Authorization', `Bearer ${keycloak.token}`);
    }

    const response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
        // Token might be expired, Keycloak-js usually handles refresh
        // but for a hard 401, we might need to redirect
        keycloak.login();
    }

    return response;
};
