// =================================================================
// ATTENZIONE: CONFIGURAZIONE DI FIREBASE
// =================================================================
// Per far funzionare l'applicazione, devi sostituire i valori
// qui sotto con le credenziali del TUO progetto Firebase.
// Puoi trovarle nelle impostazioni del tuo progetto sulla console Firebase.
//
// -> Vai su https://console.firebase.google.com/
// -> Seleziona il tuo progetto
// -> Clicca sull'icona dell'ingranaggio (Impostazioni progetto)
// -> Nella tab "Generali", scorri in basso fino a "Le tue app"
// -> Seleziona la tua app web e troverai l'oggetto "firebaseConfig".
// -> Copia e incolla i valori qui.
//
// IMPORTANTE: Anche se queste chiavi sono per un'app web, evita di
// condividerle in repository pubblici come GitHub.
// =================================================================

// La configurazione della tua app web Firebase
// Per Firebase JS SDK v7.20.0 e successivi, measurementId è opzionale
export const firebaseConfig = {
  apiKey: "INCOLLA_QUI_LA_TUA_API_KEY",
  authDomain: "INCOLLA_QUI_IL_TUO_AUTH_DOMAIN",
  projectId: "INCOLLA_QUI_IL_TUO_PROJECT_ID",
  storageBucket: "INCOLLA_QUI_IL_TUO_STORAGE_BUCKET",
  messagingSenderId: "INCOLLA_QUI_IL_TUO_MESSAGING_SENDER_ID",
  appId: "INCOLLA_QUI_IL_TUO_APP_ID",
  measurementId: "INCOLLA_QUI_IL_TUO_MEASUREMENT_ID" // Questo è opzionale
};
