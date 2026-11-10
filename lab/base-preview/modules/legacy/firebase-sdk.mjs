// Official browser ESM modules, pinned together. No import/initialization at page load.
export const FIREBASE_VERSION='13.1.0';
export async function loadFirebaseSdk(){
 const [app,auth,firestore]=await Promise.all([
  import('https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js'),
  import('https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js'),
  import('https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore-lite.js')
 ]);
 return {app,auth,firestore};
}
