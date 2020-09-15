import mongoose from 'mongoose';

const { Schema } = mongoose;

export interface IUser extends mongoose.Document {
    _id: any,
    username: string,
    email: string,
    password: string,
    channels: any[]
}


const userSchema = new Schema({
    username: { 
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    channels: [
        {
            channelID: {  type: Schema.Types.ObjectId, ref: 'Channel', required: true},
            name: String,
            connectedUser: {type: Schema.Types.ObjectId, ref: 'User', required: true}
        }
    ]
})

export default mongoose.model<IUser>('User', userSchema)