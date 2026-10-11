// Export our original illustrated motion coordinates for the GIF renderer.
import {createServer} from 'vite';
import {writeFileSync,mkdirSync} from 'node:fs';
const server=await createServer({server:{middlewareMode:true},appType:'custom'});
try {
 const {guides}=await server.ssrLoadModule('/src/ExerciseDemo.tsx');
 mkdirSync('.workout-assets',{recursive:true});
 writeFileSync('.workout-assets/guides.json',JSON.stringify(guides));
} finally {await server.close()}
