import mongoose from 'mongoose';

const {Schema} = mongoose

export interface IToken extends mongoose.Document {
    user: mongoose.Types.ObjectId | string,
    pushNotificationToken: string
}


const tokenSchema = new Schema({
    user: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    pushNotificationToken: {
        type: String,
        required: true
    }
})

export default mongoose.model<IToken>('Token', tokenSchema)
