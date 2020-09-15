// self.addEventListener("push", event => {
//     const data = event.data.json()
//     console.log('new notification', data)
//     const options = {
//         body: data.body
//     }
//     event.waitUntil(
//         self.registration.showNotification(data.title, options)
//     )
// })


importScripts('https://www.gstatic.com/firebasejs/7.18.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/7.18.0/firebase-messaging.js');

firebase.initializeApp({
    apiKey: "AIzaSyC6RoyEOkUOk8t489q4AOanyDvRXvwamDk",
    authDomain: "video-chat-app-39dba.firebaseapp.com",
    databaseURL: "https://video-chat-app-39dba.firebaseio.com",
    projectId: "video-chat-app-39dba",
    storageBucket: "video-chat-app-39dba.appspot.com",
    messagingSenderId: "446682865295",
    appId: "1:446682865295:web:77b9b0c8501f67bb8c5afa"
})

const messaging = firebase.messaging();

messaging.setBackgroundMessageHandler(function(payload) {
    console.log('payload',payload)
    const notificationTitle = 'something'
    const notificationOptions = {
        body: 'whatever'
    }
    return self.registration.showNotification(notificationTitle,
        notificationOptions);
  });

self.addEventListener('notificationclick', (event) => {
    
    if (event.action==='answer') {
        event.waitUntil(self.clients.matchAll().then(function(clientList) {
            if (clientList.length > 0) {
                if (clientList[0].url.includes('chat/')&&!clientList[0].url.includes(event.notification.data.FCM_MSG.data.channelID)) {
                    return self.clients.openWindow(event.notification.data.FCM_MSG.fcmOptions.link)        
                }
                return clientList[0].focus()
            } 
            return self.clients.openWindow(event.notification.data.FCM_MSG.fcmOptions.link)
        }))
        event.notification.close()
    } else {
        event.notification.close()
    }
})
