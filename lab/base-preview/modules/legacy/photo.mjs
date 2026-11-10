import {DraftError} from './store.mjs';
export function photoFromDataURL(url){
 if(!url)return null;const match=/^data:image\/jpeg;base64,([A-Za-z0-9+/=\s]+)$/.exec(url);if(!match)throw new DraftError('photo');
 let binary;try{binary=atob(match[1])}catch{throw new DraftError('photo');}const bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));
 if(bytes.length<3||bytes[0]!==255||bytes[1]!==216||bytes[2]!==255)throw new DraftError('photo');
 let width,height,offset=2;
 while(offset+3<bytes.length){if(bytes[offset++]!==255)throw new DraftError('photo');let marker=bytes[offset++];while(marker===255)marker=bytes[offset++];if(marker===0xd9||marker===0xda)break;const length=(bytes[offset]<<8)|bytes[offset+1];if(length<2||offset+length>bytes.length)throw new DraftError('photo');if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)){height=(bytes[offset+3]<<8)|bytes[offset+4];width=(bytes[offset+5]<<8)|bytes[offset+6];break;}offset+=length;}
 if(!(width>0&&height>0))throw new DraftError('photo');
 return {blob:new Blob([bytes],{type:'image/jpeg'}),width,height};
}
export async function photoToDataURL(photo){if(!photo)return '';const bytes=new Uint8Array(await photo.blob.arrayBuffer());let s='';for(const b of bytes)s+=String.fromCharCode(b);return 'data:image/jpeg;base64,'+btoa(s);}
export function imageDimensions(width,height){if(!(width>0&&height>0))throw new DraftError('photo');const scale=Math.min(1,1000/Math.max(width,height));return {width:Math.max(1,Math.round(width*scale)),height:Math.max(1,Math.round(height*scale))};}
export function createPhotoLoader({isCurrent,apply,state,makeImage=()=>new Image(),makeCanvas=()=>document.createElement('canvas'),urls=URL}){
 let generation=0;
 return {cancel(){generation++;},async select(file,context){
  const serial=++generation;if(!file?.type?.startsWith('image/')){state('error');return false;}state('loading');
  const image=makeImage(),url=urls.createObjectURL(file);
  return new Promise(resolve=>{
   const finish=(ok)=>{urls.revokeObjectURL(url);resolve(ok)};
   image.onerror=()=>{if(serial===generation&&isCurrent(context))state('error');finish(false);};
   image.onload=()=>{
    if(serial!==generation||!isCurrent(context)){finish(false);return;}
    try{const size=imageDimensions(image.naturalWidth||image.width,image.naturalHeight||image.height),canvas=makeCanvas();canvas.width=size.width;canvas.height=size.height;const ctx=canvas.getContext('2d');if(!ctx)throw new DraftError('photo');ctx.drawImage(image,0,0,canvas.width,canvas.height);const result=canvas.toDataURL('image/jpeg',0.75);const photo=photoFromDataURL(result);photo.width=size.width;photo.height=size.height;
     if(serial!==generation||!isCurrent(context)){finish(false);return;}apply(result,photo);state('ready');finish(true);
    }catch{if(serial===generation&&isCurrent(context))state('error');finish(false);}
   };image.src=url;
  });
 }};
}
