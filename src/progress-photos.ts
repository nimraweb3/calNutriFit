import {cloud} from './backend';
import {dayKey} from './engine';
export const photoBucket='calnutrifit-progress';
export type ProgressPhoto={id:string;user_id:string;path:string;taken_on:string;category:'Front'|'Side'|'Back'|'Custom';note:string;created_at:string;url?:string};
export function validatePhotoMetadata(date:string,note:string,category:string){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date))||new Date(date+'T12:00:00Z').toISOString().slice(0,10)!==date||date>dayKey())throw Error('Choose a valid date up to today.');
 if(note.length>300||!['Front','Side','Back','Custom'].includes(category))throw Error('Check the photo label and note.');
}
export async function preparePhoto(file:File):Promise<Blob>{
 if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024||file.size===0)throw Error('Choose a JPEG, PNG or WebP image up to 5 MB.');
 const bitmap=await createImageBitmap(file);
 try{if(bitmap.width*bitmap.height>40000000)throw Error('Choose a smaller image (under 40 megapixels).');const scale=Math.min(1,1600/Math.max(bitmap.width,bitmap.height)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));const context=canvas.getContext('2d');if(!context)throw Error('This browser cannot prepare the photo.');context.fillStyle='#ffffff';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(bitmap,0,0,canvas.width,canvas.height);return await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('Could not prepare this photo.')),'image/jpeg',.88));}finally{bitmap.close()}
}
export async function listPhotos(userId:string){
 if(!cloud)throw Error('Sign in to view photos.');
 if((import.meta as any).env.VITE_PROGRESS_PHOTOS_ENABLED!=='true')throw Error('Progress photos are coming soon. Private uploads are not available yet.');
 const result=await cloud.from('calnutrifit_progress_photos').select('*').eq('user_id',userId).order('taken_on',{ascending:false});
 if(result.error)throw Error('Private photos are not available yet. Your administrator must finish storage setup.');
 return await Promise.all((result.data as ProgressPhoto[]).map(async p=>{const {data,error}=await cloud!.storage.from(photoBucket).createSignedUrl(p.path,60);return {...p,url:error?undefined:data.signedUrl}}));
}
export async function uploadPhoto(userId:string,file:File,date:string,category:ProgressPhoto['category'],note:string){
 if(!cloud)throw Error('Sign in to add a photo.');validatePhotoMetadata(date,note,category);
 const blob=await preparePhoto(file),id=crypto.randomUUID(),path=`${userId}/${id}.jpg`;
 const upload=await cloud.storage.from(photoBucket).upload(path,blob,{contentType:'image/jpeg',upsert:false});
 if(upload.error)throw Error('Photo not uploaded. Check your connection and private storage setup.');
 const saved=await cloud.from('calnutrifit_progress_photos').insert({id,user_id:userId,path,taken_on:date,category,note}).select('id').single();
 if(saved.error){const cleanup=await cloud.storage.from(photoBucket).remove([path]);throw Error(cleanup.error?'Photo details failed to save and cleanup needs administrator help.':'Photo not saved. Please try again.');}
}
export async function deletePhoto(userId:string,photo:ProgressPhoto){
 if(!cloud||photo.user_id!==userId||photo.path!==`${userId}/${photo.id}.jpg`)throw Error('This photo is not available to this account.');
 const removed=await cloud.storage.from(photoBucket).remove([photo.path]);if(removed.error)throw Error('Photo could not be deleted. Please retry.');
 const row=await cloud.from('calnutrifit_progress_photos').delete().eq('user_id',userId).eq('id',photo.id).select('id').single();if(row.error)throw Error('Image removed; retry deletion to remove its remaining details.');
}
