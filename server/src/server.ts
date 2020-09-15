import express from 'express';
import SocketIo from 'socket.io';
import cors from 'cors';
import http from 'http';
import { json, urlencoded } from 'body-parser';
import mongoose from 'mongoose';
import morgan from 'morgan';
import AuthRouter from './routes/auth';
import firebaseAdmin from 'firebase-admin';

import {
    getChannels, 
    createChannel, 
    addMessage, 
    allowAccessToChannel, 
    sendMessages,
    setNewMessagesToFalse,
    callUser,
    makeAnswer,
    sendIceCandidate,
    hangUp,
    addPushNotificationToken
} from './controllers/chat.controllers';
import { isSocketAuthenticated } from './middlewares/auth';
import {addCurrentUser, removeCurrentUser, getValuefromRedis} from './utils/redis.utils';

const port =  process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()    
} 
const MONGODB_URI = <string>process.env.MONGODB_URI

const app = express();
const server = http.createServer(app);
const io = SocketIo(server);



app.use(morgan('combined'))
app.use(cors())
app.use(json());
app.use(urlencoded({extended: true}));
app.use(AuthRouter)




export const firebaseApp = firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert(<string>process.env.FCM_CREDENTIALS),
    databaseURL: "https://video-chat-app-39dba.firebaseio.com"
})


io.on('connection', (socket) => {   
    console.log('connected')
    socket.on('join', async (authorization) => {        
        const userId = await isSocketAuthenticated(authorization)
        if (!userId) {
            socket.emit('unauthorized', 'requires authorization')
        } else {
            await addCurrentUser(userId, socket.id)
            getChannels(userId)
            .then((channels) => {
                socket.emit('channels', channels)
                channels.forEach(channel => {
                    socket.join(channel._id)
                })
            })
            .catch(err => {
                console.log(err)
                socket.emit('channels', [])
            })

            const createChannelListener = ({username}: {username:string}) => {
                createChannel(username, userId)
                .then(({exists, channel, id, initialUser, user}:any) => {
                    if (exists) {
                        socket.emit('channelAlreadyExists', id)
                    } else {
                        console.log(channel, id)
                        getValuefromRedis(id.toString())
                        .then(socketID => {
                            if (socketID) {
                                socket.to(socketID).emit('newChannel', channel, user)
                            }
                            socket.emit('channelCreated', channel, initialUser)
                        })
                    }
                })
                .catch((err) => {
                    console.log(err)
                    socket.emit('channelCreationFailed', 'User not found')
                })
            }

            
            const joinNewChannelListener = (channelID:string) => {
                socket.join(channelID)
            }

            const makeAnswerListener = (answer: RTCSessionDescriptionInit, channelID:string) => {
                console.log('answer')
                makeAnswer(answer, channelID, socket)
            }
            const hangUpListener = (channelId:string) => {
                hangUp(channelId, socket)
            }

            
            socket.on('createChannel', createChannelListener)
            socket.on('joinNewChannel', joinNewChannelListener)
            socket.on("makeAnswer", makeAnswerListener)
            socket.on('hangup', hangUpListener)
            socket.on('setPushNotificationToken', addPushNotificationToken)

            const leaveListener = () => {
                socket.removeListener('joinNewChannel', joinNewChannelListener)
                socket.removeListener('createChannel', createChannelListener)
                socket.removeListener('makeAnswer', makeAnswerListener)
                socket.removeListener('hangup', hangUpListener)
                socket.removeListener('setPushNotificationToken', addPushNotificationToken)
                socket.leaveAll()
                removeCurrentUser(userId)
                socket.removeListener('leave', leaveListener)
            }

            socket.on('leave', leaveListener)
        }
    })
    socket.on('joinChannel', async (authorization:string, channelID:string, user:string) => {
        const userId = await isSocketAuthenticated(authorization)
        if (!userId) {
            socket.emit('unauthorized', 'requires authorization')
        } else {
            const allow = await allowAccessToChannel(channelID, user)
            if (!allow) {
                socket.emit('unauthorized', 'requires authorization')
            } else {
                console.log('joined')
                await addCurrentUser(userId, socket.id)
                socket.join(channelID)
                setNewMessagesToFalse({channelID, userID:userId})
                sendMessages(userId,channelID, socket)
                
                const messageListener = ({message, channelId}:any) => {
                    addMessage(message, channelId, socket)
                }

                const callUserListener = (offer:RTCSessionDescriptionInit, channelID:string) => {
                    callUser(offer, channelID, socket)
                }

                const makeAnswerListener = (answer: RTCSessionDescriptionInit, channelID:string) => {
                    console.log('answer')
                    makeAnswer(answer, channelID, socket)
                }
                const hangUpListener = (channelId:string) => {
                    hangUp(channelId, socket)
                }

                const newIceCandidateListener = (candidate:RTCIceCandidate, channelID:string) => {
                    sendIceCandidate(candidate, channelID, socket)
                }



                socket.on('addMessage', messageListener)
                socket.on('messageRead', setNewMessagesToFalse)

                socket.on('callUser', callUserListener)
                socket.on('newIceCandidate', newIceCandidateListener)
                socket.on("makeAnswer", makeAnswerListener)
                socket.on('hangup', hangUpListener)


                const leaveListener = () => {
                    socket.removeListener('addMessage', messageListener)
                    socket.removeListener('messageRead', setNewMessagesToFalse)
                    socket.removeListener('callUser', callUserListener)
                    socket.removeListener('makeAnswer', makeAnswerListener)
                    socket.removeListener("newIceCandidate", newIceCandidateListener)
                    socket.removeListener("hangup", hangUpListener)
                    socket.leaveAll()
                    removeCurrentUser(userId)
                    socket.removeListener('leave', leaveListener)
                }

                socket.on('leave', leaveListener)

                
            }
        }
    })
})


mongoose.connect(MONGODB_URI, {useNewUrlParser: true, useUnifiedTopology: true})
.then(() => {
    server.listen(port, () => {
        console.log(`server is running on port: ${port}`)
    })
})
.catch(err => console.log(err));