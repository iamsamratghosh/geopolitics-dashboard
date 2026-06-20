import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import 'mapbox-gl/dist/mapbox-gl.css';

// ✅ Fix for Mapbox offsetWidth bug
Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
  get: function() {
    return this.clientWidth;
  }
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);