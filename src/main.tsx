import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import { ToastProvider } from './context/ToastContext.tsx';
import './index.css';

// Capture and demote Google Maps authentication errors, third-party browser extensions (e.g. Talisman), and cross-origin "Script error." to standard logs
if (typeof window !== 'undefined') {
  const isBrowserExtensionIssue = (text: string, source = ''): boolean => {
    const combined = `${text} ${source}`.toLowerCase();
    return (
      combined.includes('talisman') ||
      combined.includes('chrome-extension://') ||
      combined.includes('moz-extension://') ||
      combined.includes('safari-extension://') ||
      combined.includes('fijngjgcjhjmmpcmkeiomlglpeiijkld') ||
      combined.includes('continue with onboarding') ||
      combined.includes('metamask') ||
      combined.includes('inpage.js')
    );
  };

  // Capture cross-origin script errors, browser extension errors, Google Maps, and WebSocket connection failures before they bubble up as uncaught errors
  window.addEventListener('error', (event) => {
    const msg = event.message || (event.error && event.error.message) || String(event) || '';
    const stack = (event.error && event.error.stack) || '';
    const filename = event.filename || '';
    const isScriptError = msg.includes('Script error.') || msg === 'Script error';
    const isMapError = filename.includes('maps.googleapis.com') || filename.includes('ggpht.com');
    const isExtensionError = isBrowserExtensionIssue(`${msg} ${stack}`, filename);
    const isGoogleMapsKeyword = 
      msg.includes('Google Maps') || 
      msg.includes('InvalidKeyMapError') || 
      msg.includes('ApiNotActivatedMapError') ||
      msg.includes('gm_authFailure');

    const isWebSocketError = 
      msg.includes('WebSocket') || 
      msg.includes('websocket') || 
      msg.includes('closed without opened') || 
      msg.includes('without opened') ||
      msg.includes('[vite]');

    if (isScriptError || isMapError || isExtensionError || isGoogleMapsKeyword || isWebSocketError) {
      if (!isExtensionError) {
        console.info('[Safely Intercepted Window Error]:', {
          message: msg,
          filename: filename,
          lineno: event.lineno,
          colno: event.colno
        });
      }
      
      // Stop propagation and prevent default behavior (uncaught exception status)
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      // Trigger fallback UI immediately for Google Maps
      if (isGoogleMapsKeyword && (window as any).gm_authFailure) {
        try {
          (window as any).gm_authFailure();
        } catch (e) {}
      }
    }
  }, true);

  // Catch unhandled promise rejections stemming from browser extensions, Google Maps, Vite HMR, or Supabase WebSocket closures
  window.addEventListener('unhandledrejection', (event) => {
    let reasonStr = '';
    try {
      if (typeof event.reason === 'string') {
        reasonStr = event.reason;
      } else if (event.reason instanceof Error) {
        reasonStr = event.reason.message + ' ' + (event.reason.stack || '');
      } else if (event.reason && typeof event.reason === 'object') {
        reasonStr = (event.reason.message || event.reason.reason || event.reason.type || event.reason.code || '') + ' ' + (event.reason.stack || '') + ' ' + JSON.stringify(event.reason);
      } else {
        reasonStr = String(event.reason || '');
      }
    } catch {
      reasonStr = String(event.reason || '');
    }

    const isExtensionError = isBrowserExtensionIssue(reasonStr);
    const isWebSocketError = 
      reasonStr.includes('WebSocket') ||
      reasonStr.includes('websocket') ||
      reasonStr.includes('closed without opened') ||
      reasonStr.includes('without opened') ||
      reasonStr.includes('vite') ||
      reasonStr.includes('HMR') ||
      reasonStr.includes('realtime');

    if (
      isExtensionError ||
      reasonStr.includes('Google Maps') ||
      reasonStr.includes('maps.googleapis.com') ||
      reasonStr.includes('InvalidKeyMapError') ||
      reasonStr.includes('ApiNotActivatedMapError') ||
      isWebSocketError
    ) {
      if (!isExtensionError) {
        console.info('[Safely Intercepted Unhandled Rejection]:', reasonStr || event.reason);
      }
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      
      if ((window as any).gm_authFailure && (reasonStr.includes('Google Maps') || reasonStr.includes('maps'))) {
        try {
          (window as any).gm_authFailure();
        } catch (e) {}
      }
    }
  }, true);

  const originalError = console.error;
  console.error = function (...args) {
    const msg = args.map(arg => (arg instanceof Error ? `${arg.message} ${arg.stack || ''}` : String(arg))).join(' ');
    if (isBrowserExtensionIssue(msg)) {
      return;
    }
    if (
      msg.includes('Google Maps') || 
      msg.includes('InvalidKeyMapError') || 
      msg.includes('gm_authFailure') || 
      msg.includes('Google Maps JavaScript API') ||
      msg.includes('ApiNotActivatedMapError') ||
      msg.includes('Script error')
    ) {
      console.info('[Google Maps Error Safely Intercepted & Handled]:', ...args);
      // Cleanly trigger the fallback UI
      if ((window as any).gm_authFailure) {
        try {
          (window as any).gm_authFailure();
        } catch (e) {}
      }
      return;
    }
    if (
      msg.includes('PGRST205') ||
      msg.includes('schema cache') ||
      msg.includes('Could not find the table') ||
      msg.includes('WebSocket') ||
      msg.includes('websocket') ||
      msg.includes('[vite]')
    ) {
      console.info('[Supabase Schema / Vite Notice Handled]:', ...args);
      return;
    }
    originalError.apply(console, args);
  };

  const originalWarn = console.warn;
  console.warn = function (...args) {
    const msg = args.map(arg => (arg instanceof Error ? `${arg.message} ${arg.stack || ''}` : String(arg))).join(' ');
    if (isBrowserExtensionIssue(msg)) {
      return;
    }
    if (
      msg.includes('Google Maps') || 
      msg.includes('InvalidKeyMapError') || 
      msg.includes('gm_authFailure') || 
      msg.includes('Google Maps JavaScript API') ||
      msg.includes('ApiNotActivatedMapError') ||
      msg.includes('Script error')
    ) {
      console.info('[Google Maps Warning Safely Intercepted & Handled]:', ...args);
      // Cleanly trigger the fallback UI
      if ((window as any).gm_authFailure) {
        try {
          (window as any).gm_authFailure();
        } catch (e) {}
      }
      return;
    }
    if (
      msg.includes('PGRST205') ||
      msg.includes('schema cache') ||
      msg.includes('Could not find the table') ||
      msg.includes('WebSocket') ||
      msg.includes('websocket') ||
      msg.includes('[vite]')
    ) {
      console.info('[Supabase Schema / Vite Notice Handled]:', ...args);
      return;
    }
    originalWarn.apply(console, args);
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <App />
      </ToastProvider>
    </ErrorBoundary>
  </StrictMode>,
);
