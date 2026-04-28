import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import keycloak from './api';

keycloak.init({ onLoad: 'login-required', checkLoginIframe: false }).then((authenticated) => {
    if (authenticated) {
        ReactDOM.createRoot(document.getElementById('root')!).render(
            <React.StrictMode>
                <BrowserRouter>
                    <App />
                </BrowserRouter>
            </React.StrictMode>
        );
    }
}).catch(() => {
    console.error("Authenticated Failed");
    // Show error UI or retry
});
