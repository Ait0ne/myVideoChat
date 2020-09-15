import React, {Fragment, useState, useEffect} from 'react';
import {useParams, useLocation, useHistory} from 'react-router-dom';
import {connect, ConnectedProps} from 'react-redux';


// import {IChannel} from '../ChatList/chatlist.page';
import Navigation from '../../components/Navigation/navigation.component';
import Chat, {IMessage} from '../../components/Chat/chat.component';
import {StateProps} from '../../redux/root-reducer';
import {socket} from '../../App';
import {messaging} from '../../firebase/firebase.utils';

interface ChatPageProps {
    setOutGoingCall: React.Dispatch<React.SetStateAction<{
        channelID: string;
        connectedUserName: string;
    } | undefined>>,
    setIncomingCall: React.Dispatch<React.SetStateAction<{
        incomingOffer: RTCSessionDescriptionInit | string;
        incomingChannelID: string;
    } | undefined>>
}

const ChatPage: React.FC<ReduxProps&ChatPageProps> = ({currentUser, setOutGoingCall, setIncomingCall}) => {
    const {channelId} = useParams()
    const {search} = useLocation()
    const history = useHistory()
    const [connectedUserName, setConnectedUserName] = useState('')
    const [messages, setMessages] = useState<IMessage[]>([])
    const [newMessage, setNewMessage] = useState<{message:IMessage, channelID:string}|undefined>()
    
    useEffect(()=> {
        messaging.onMessage(payload => {
            console.log(payload)
            if (payload.data.channelID!==channelId){
                const {title, body, icon} = payload.notification
                const notification = new Notification(title, {
                    body: body,
                    icon:icon,
                    requireInteraction:true
                })
                notification.addEventListener('click', () => {
                    console.log('click')
                    history.push(`${payload.fcmOptions.link.replace('https://fathomless-fjord-74738.herokuapp.com', '')}`)
                })
            }
        })
        
    }, [])


    useEffect(()=> {
        const incomingCallUserId = new URLSearchParams(search).get('userID')
        if (incomingCallUserId) {
            setIncomingCall({incomingOffer:incomingCallUserId, incomingChannelID:channelId})
        }
    }, [search, channelId, setIncomingCall])

    useEffect(() => {
        const token = window.localStorage.getItem('token')
        socket.emit('joinChannel', token, channelId, currentUser._id )
    }, [channelId, currentUser])

    useEffect(() => {
        if (newMessage) {
            const m = newMessage.message
            setNewMessage(undefined)
            setMessages([...messages, m])
        }
    }, [newMessage, messages])

    useEffect(() => {
        socket.on('messages', (messages:IMessage[], name:string) => {
            setConnectedUserName(name)
            setMessages(messages)
        })
        socket.on('unauthorized', (err:any) => {
            console.log(err)
        })
        socket.on('newMessage', ({message, channelID}: {message: IMessage, channelID:string}) => {
            setNewMessage({message, channelID})
            socket.emit('messageRead', {channelID, userID: currentUser._id})
        })
        return () => {
            socket.removeListener('messages')
            socket.removeListener('newMessage')
            socket.removeListener('unauthorized')
            socket.emit('leave', currentUser._id)
        }
    }, [currentUser])

    const sendMessage = (text:string) => {
        const newMessage:IMessage = {
            userId: currentUser._id,
            text: text,
            createdAt: new Date()
        }    
        socket.emit('addMessage', {message: newMessage, channelId })
        setMessages([...messages, newMessage])
    }

    return (
        <Fragment>
            <Navigation videoCallButton backNavigation pageTitle={connectedUserName} setOutGoingCall={setOutGoingCall} channelId={channelId}/>
            <Chat currentUser={currentUser} messages={messages} sendMessage={sendMessage}/>
        </Fragment>
    )

}

const mapStateToProps = (state:StateProps) => ({
    currentUser: state.user.currentUser
})

const connector = connect(mapStateToProps)

type ReduxProps = ConnectedProps<typeof connector>




export default connector(ChatPage);