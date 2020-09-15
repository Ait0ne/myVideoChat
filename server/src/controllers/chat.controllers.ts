import User, { IUser } from '../models/user.model';
import Channel, {IMessage, IChannel} from '../models/channel.model';
import {Types} from 'mongoose';
import {Socket} from 'socket.io';
import Token, {IToken} from '../models/token.models';
// import webpush from 'web-push';
import {firebaseApp} from '../server';
import firebaseAdmin from 'firebase-admin';

// webpush.setVapidDetails(<string>process.env.WEB_PUSH_CONTACT, <string>process.env.VAPID_PUBLIC_KEY, <string>process.env.VAPID_PRIVATE_KEY)



const sendPushNotification = (channel:IChannel, receivingUserID:string) => {
    console.log('start push')
    Token.findOne({user: receivingUserID}).populate('user')
    .then((token:any) => {
        if (token) {
            console.log('found token')
            const channelName = token.user.channels.find((c:any) => c.channelID.toString()===channel._id.toString() ).name
            const pushMessage:firebaseAdmin.messaging.Message = {
                "token": `${token.pushNotificationToken}`,
                "notification": {
                    "title": `${channelName}`,
                    "body": `${channel.lastMessage.text}`
                },
                "data": {
                    "channelID": `${channel._id}`
                },
                "webpush": {
                    "headers": {
                        "Urgency": "high"
                    },
                    "fcmOptions": {
                        "link": `https://fathomless-fjord-74738.herokuapp.com/chat/${channel._id}`
                    },
                    "notification": {
                        "body": `${channel.lastMessage.text}`,
                        "icon": '/avatar.png',
                        "requireInteraction": true,
                        'vibrate': [100,50,100,50,100]
                    }
                },
                "android": {
                    'priority': "high",
                    'notification': {
                        'priority':"max",
                        'vibrateTimingsMillis': [100,50,100,50,100]
                    }
                }
            }
            // const payload = JSON.stringify({
            //         "title": `${channelName}`,
            //         "body": `${channel.lastMessage.text}`,
            //         "data": {
            //             "createdAt": `${channel.lastMessage.createdAt}`
            //         }

            // })
            // webpush.sendNotification(token.pushNotificationToken, payload)
            firebaseApp.messaging().send(pushMessage)
            .then(result=> {
                console.log(result)
            })
        }
    })
}

const notifyAboutCall = (channelID:string, senderID:string) => {
    Channel.findById(channelID)
    .then(channel => {
        if (channel) {
            const receivingUserId = channel.members.find(id => id.toString()!==senderID)
            Token.findOne({user:receivingUserId}).populate('user')
            .then((token:any)=> {
                if (token) {
                    console.log('found token for call')
                    const channelName = token.user.channels.find((c:any) => c.channelID.toString()===channel._id.toString() ).name
                    const pushMessage:firebaseAdmin.messaging.Message = {
                        "token": `${token.pushNotificationToken}`,
                        "notification": {
                            "title": `You got a call from ${channelName}`,
                        },
                        "data": {
                            "channelID": `${channel._id}`
                        },
                        "webpush": {
                            "headers": {
                                "Urgency": "high"
                            },
                            "fcmOptions": {
                                "link": `https://fathomless-fjord-74738.herokuapp.com/chat/${channel._id}?userID=${senderID}`
                            },
                            "notification": {
                                "icon": '/avatar.png',
                                "requireInteraction": true,
                                'vibrate': [100,50,100,50,100,50,100,50,100,50,100,50,100,50,100,50,100,50,100,50],
                                "actions": [
                                    {
                                        "action": 'answer',
                                        "title": 'Answer'
                                    },
                                    {
                                        "action": 'decline',
                                        "title": 'Decline'
                                    }
                                ]
                            }
                        },
                        "android": {
                            'priority': "high",
                            'notification': {
                                'priority':"max",
                                'vibrateTimingsMillis': [100,50,100,50,100,50,100,50,100,50,100,50,100,50,100,50,100,50,100,50]
                            }
                        }
                    }
                    firebaseApp.messaging().send(pushMessage)
                }
            })
        }
    })
}




export const allowAccessToChannel = (channelID:string, userID:string) => {
    return Channel.find({$and : [{members: userID}, {_id: channelID}]})
    .then(channel => {
        if (channel) {
            return true
        } 
        return false
    })
}


export const createChannel = (username:string, id: string):Promise<void|{exists:boolean,id:string|undefined, channel: string|undefined, initialUser:IUser|undefined, user:IUser|undefined}> => {
    return User.findOne({username:username})
    .then(user => {
        if (!user) {
            return Promise.reject('user does not exist')
        } 
        let existingChannel = user.channels.find((channel) => {
            return channel.connectedUser.toString() === id
        })
        if (existingChannel)  return ({exists:true, channel:undefined, id:existingChannel.channelID, initialUser: undefined, user:undefined})
        const createdChannel = new Channel({
            members: [Types.ObjectId(user._id), Types.ObjectId(id)]
        })
        return createdChannel.save()
        .then((channel) => {
            console.log(channel)
            return User.findById(id)
            .then(initialUser => {
                if (!initialUser) return Promise.reject('user does not exist')
                initialUser.channels = [...initialUser.channels, {
                    channelID:channel._id,
                    name: user.username,
                    connectedUser: user._id
                }]
                user.channels = [...user.channels, {
                    channelID:channel._id,
                    name: initialUser.username,
                    connectedUser: initialUser._id
                }]
                const newChannel:any = {
                    members:channel.members,
                    _id: channel._id,
                    messages: channel.messages,
                    name: initialUser.username, 
                }
                return Promise.all([initialUser.save(), user.save()])
                .then((users) => {
                    console.log(users)
                    return ({exists:false, channel: newChannel, id: user._id, initialUser:users[0], user: users[1]})
                })
            })
        })
        .catch(err => console.log(err))
        
    })
}

export const getChannels = (id:string|null) => {
    if (!id) {
        return Promise.reject('no channels')
    }
    return User.findById(id).select('channels.channelID channels.name').populate('channels.channelID')
    .then(user => {
        if (!user) {
            return Promise.reject('no channels')
        }
        return user.channels.map((channel) => {
            const newChannel = {...channel.channelID._doc, name: channel.name}
            return newChannel
        })
    })
    .catch(() => Promise.reject('no channels'))
} 

export const addMessage = (message:IMessage, channelID:string, socket:Socket) => {
    Channel.findById(channelID)
    .then(channel => {
        if (!channel) {
            socket.emit('failedToSend')
        } else {
            const newMessage:IMessage = {
                userId: Types.ObjectId(<string>message.userId),
                text: message.text,
                createdAt: message.createdAt

            }
            channel.messages.push(newMessage)
            channel.lastMessage = newMessage
            const receivingUserID = channel.members.find((member) => {
                return member.toString() !==message.userId
            })
            if (channel.newMessages) {
                channel.newMessages.set(receivingUserID.toString(), true)
            } else {
                let newMessages = new Map();
                newMessages.set(receivingUserID.toString(), true)
                channel.newMessages=newMessages
            }
            channel.save()
            .then((newChannel) => {
                sendPushNotification(newChannel, receivingUserID.toString())
                socket.to(channelID).emit('newMessage', {message, channelID: channel._id})
            })
            .catch((err)=> {
                console.log(err)
                socket.emit('failedToSend')
            })
        }
    })
}


export const sendMessages = (userId:string, channelID: string, socket: Socket) => {
    Channel.findById(channelID)
    .then(channel => {
        if (!channel) {
            socket.emit('unauthorized')
        } else {
            User.findById(userId)
            .then(user => {
                if (!user) {
                    socket.emit('unauthorized')
                } else {
                    const channelName = user.channels.find(c => {
                        return c.channelID.toString()===channel._id.toString()
                    }).name
                    socket.emit('messages', channel.messages, channelName)
                }
            })
            .catch(() => {
                socket.emit('messages', [], '')
            })
        }

    })
}

export const setNewMessagesToFalse = ({channelID, userID}:{channelID:string, userID:string}) => {
    console.log(channelID, userID)
    Channel.findById(channelID)
    .then((channel) => {
        console.log(channel)
        if (channel?.newMessages) {
            channel?.newMessages.set(userID, false)
            channel?.save()
        }
    })
    .catch(err => console.log(err))
}


export const callUser = (offer:RTCSessionDescriptionInit|string, channelID:string, socket:Socket) => {
    socket.to(channelID).emit('incomingCall', offer, channelID)
    notifyAboutCall(channelID, <string>offer)
}

export const makeAnswer = (answer: RTCSessionDescriptionInit, channelID:string, socket:Socket) => {
    console.log(answer, channelID)
    socket.to(channelID).emit('answerMade', answer, channelID)
}

export const sendIceCandidate = (candidate: RTCIceCandidate, channelID:string, socket:Socket) => {
    console.log('newIceCandidate')
    socket.to(channelID).emit("receivedNewIceCandidate", candidate)
}

export const hangUp = (channelId:string, socket:Socket) => {
    socket.to(channelId).emit('initiatedHangUp')
}

export const addPushNotificationToken = (token: string | undefined, userID:string) => {
    if (token) {
        Token.findOne({user: userID})
        .then((tokenFound) => {
            if (tokenFound) {
                tokenFound.pushNotificationToken = token
                tokenFound.save()
            } else {
                const newToken:IToken = new Token({
                    user: Types.ObjectId(userID),
                    pushNotificationToken: token,
                })
                newToken.save()
            }

        })
        .catch((err) => {
            console.log(err)
        })
    }
}



const getChannel = () => {

}


export default getChannel;