import mongoose, {Schema} from 'mongoose';

export interface IMessage {
    userId: mongoose.Types.ObjectId | string,
    text: string,
    createdAt: Date
}

export interface IChannel extends mongoose.Document {
    messages: IMessage[],
    members: any[],
    lastMessage: IMessage,
    newMessages: Map<string,boolean>
}


const messageSchema = new Schema({
    
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    text: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        required: true
    }
        
})

const channelSchema = new Schema({
    members: [
            {
                type: Schema.Types.ObjectId,
                ref: 'User',
                required: true
            }
    ],
    messages: [
        messageSchema
    ],
    newMessages: {
        type: Map,
        of: Boolean
    },
    lastMessage: messageSchema
})


export default mongoose.model<IChannel>('Channel', channelSchema)