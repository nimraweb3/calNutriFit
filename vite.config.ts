import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({plugins:[react()],build:{rolldownOptions:{output:{manualChunks(id){
 if(id.includes('node_modules/@supabase/'))return 'auth';
 if(/node_modules\/(recharts|d3-|victory-)/.test(id))return 'charts';
 if(/node_modules\/(react|react-dom|react-router|react-router-dom)\//.test(id))return 'vendor';
}}}}});
