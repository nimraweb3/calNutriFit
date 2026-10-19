import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// Let Vite keep shared React code separate from dynamically imported chart panels.
// Manual chart chunks previously pulled shared React code into the initial preload graph.
export default defineConfig({ plugins: [react()] });
