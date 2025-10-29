// Configuraci¢n de Firebase 
// Se carga desde variables de entorno 
 
try { 
  if (typeof firebase !== 'undefined') { 
    const firebaseConfig = { 
      apiKey: process.env.REACT_APP_FIREBASE_API_KEY, 
      authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN, 
      projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID, 
      storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET, 
      messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID, 
      appId: process.env.REACT_APP_FIREBASE_APP_ID 
    }; 
 
    // Inicializar Firebase solo si no est  inicializado 
    if (!firebase.apps.length) { 
      firebase.initializeApp(firebaseConfig); 
    } 
 
    console.log('Firebase inicializado correctamente'); 
  } 
} catch (error) { 
  console.error('Error inicializando Firebase:', error); 
} 
