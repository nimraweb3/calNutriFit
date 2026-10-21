import {WebGLRenderer, Scene, PerspectiveCamera, TorusGeometry, MeshBasicMaterial, Mesh, Group} from 'three';

/** Decorative only: never blocks the text or sample journal. */
export function mountHeroScene(host: HTMLElement): () => void {
  let renderer: WebGLRenderer;
  try { renderer = new WebGLRenderer({alpha:true, antialias:false, powerPreference:'low-power'}); }
  catch { return () => {}; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.25));
  host.append(renderer.domElement);
  const scene=new Scene(), camera=new PerspectiveCamera(40,1,.1,20), group=new Group();
  camera.position.z=5;
  scene.add(group);
  const geometry=new TorusGeometry(2.05,.012,6,96);
  const materials=[0x2ac089,0x9abf92,0xc6a96b].map(color=>new MeshBasicMaterial({color,transparent:true,opacity:.42}));
  materials.forEach((material,index)=>{const ring=new Mesh(geometry,material);ring.rotation.set(index*.65,.55+index*.5,index*.4);group.add(ring)});
  const resize=()=>{const {width,height}=host.getBoundingClientRect();if(!width||!height)return;renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix()};
  const sizes=new ResizeObserver(resize);sizes.observe(host);resize();
  let frame=0,last=0,visible=true,disposed=false;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const tick=(time:number)=>{if(disposed)return;frame=requestAnimationFrame(tick);if(time-last<33)return;last=time;group.rotation.z=Math.sin(time*.00012)*.12;group.rotation.y=Math.sin(time*.00016)*.3;renderer.render(scene,camera)};
  const sync=()=>{cancelAnimationFrame(frame);if(!disposed&&visible&&!document.hidden&&!reduced.matches)frame=requestAnimationFrame(tick)};
  const view=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;sync()});view.observe(host);
  document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',sync);sync();
  return()=>{disposed=true;cancelAnimationFrame(frame);sizes.disconnect();view.disconnect();document.removeEventListener('visibilitychange',sync);reduced.removeEventListener('change',sync);geometry.dispose();materials.forEach(m=>m.dispose());renderer.dispose();renderer.domElement.remove()};
}
