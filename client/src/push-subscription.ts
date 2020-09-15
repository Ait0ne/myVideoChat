import {socket} from './App';

const urlBased64ToUnit8Array = (key:string) => {
    const padding = "=".repeat((4 - key.length % 4) % 4)
    
    const base64 = (key + padding).replace(/\-/g, "+").replace(/_/g, "/")
    
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
} 

const convertedVapidKey = urlBased64ToUnit8Array('BAJ94n392gAIZP-2qJ-kyUkCpKuCtmU_U8CkTwZoYmIbFMnDlX-hy91vXUdtex8MFD-aU7OiqTbahOCBXUwMSlw')

const sendSubscription = (subscription:PushSubscription, userId:string) => {
    socket.emit('setPushNotificationToken', subscription, userId)
}

export const subscribeUser = (userID:string) => {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready
        .then(registration => {
            if (!registration.pushManager) {
                console.log('Push manager unavailable')
                return 
            }
            registration.pushManager.getSubscription()
            .then((subscription) => {
                if (subscription === null) {
                    registration.pushManager.subscribe({
                        applicationServerKey: convertedVapidKey,
                        userVisibleOnly: true
                    })
                    .then((newSubscription) => {
                        sendSubscription(newSubscription, userID)
                    })
                    .catch(err => {
                        if (Notification.permission !=="granted") {
                            console.log('no permission ')
                        } else {
                            console.log(err)
                        }
                    })
                } else {
                    sendSubscription(subscription, userID)
                }
            })
            .catch(err => console.log(err))
        })
    }
}