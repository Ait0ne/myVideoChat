import firebase from 'firebase/app';
import 'firebase/messaging';


const firebaseConfig = {
    apiKey: "AIzaSyC6RoyEOkUOk8t489q4AOanyDvRXvwamDk",
    authDomain: "video-chat-app-39dba.firebaseapp.com",
    databaseURL: "https://video-chat-app-39dba.firebaseio.com",
    projectId: "video-chat-app-39dba",
    storageBucket: "video-chat-app-39dba.appspot.com",
    messagingSenderId: "446682865295",
    appId: "1:446682865295:web:77b9b0c8501f67bb8c5afa"
  }



if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig)
}
export const messaging = firebase.messaging();
messaging.usePublicVapidKey('BDhajXLRZqEAWCuRKku0gwFpMXyePA4HBuqsH6KFmcD9FTmOAKD7cgYOy07iUWUTVII61vRKFs6TpiqbYJDq2S0')

navigator.serviceWorker.ready.then(registration=> {
  messaging.useServiceWorker(registration)
})





export default firebase;