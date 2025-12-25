
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './global.css';

// Suppress "Download the React DevTools" message
if (typeof window !== 'undefined' && !(window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ = { isDisabled: true };
}

console.info("%c[Engine] React Chassis Booted.", "color: #3b82f6; font-weight: bold;");

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
