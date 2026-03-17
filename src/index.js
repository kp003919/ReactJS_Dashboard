import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { Buffer } from "buffer";
import process from "process";
import App from './App';
import reportWebVitals from './reportWebVitals';

// Polyfills for Buffer and process to support MQTT over WebSockets in React
// These are required because the MQTT library relies on Node.js core modules
window.Buffer = Buffer;
window.process = process;

// Render the main App component into the root div
// Create root and render App

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
