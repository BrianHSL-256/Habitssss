import {Schema, model, Document, Types} from 'mongoose';


export interface IRefreshToken extends Document{
    user: Types.ObjectId, 
    token: string,
    expiresAt: Date
}

const refreshTokenSchema = new Schema<IRefreshToken>(
{

    user: {
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true
    },
    token: {
        type: String, 
        required: true
    }, 
    expiresAt: {
        type: Date, 
        required: true
    }
    


}, {
    timestamps: true
}
)

export const RefreshToken = model<IRefreshToken>(
    'RefreshToken', 
    refreshTokenSchema

)