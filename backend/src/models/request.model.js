import mongoose, { Schema } from 'mongoose';

const requestSchema = new Schema(
    {
        citizenId: {
            type: Schema.Types.ObjectId,
            ref: 'Citizen',
            required: true
        },
        documentType: {
            type: String,
            required: true,
            trim: true
        },
        proofFiles: {
            type: [String],
            default: []
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            required: true,
            default: 'pending'
        },
        adminComment: {
            type: String,
            default: null
        },
        legalResponseDays: {
            type: Number,
            required: true,
            min: 1
        }
    },
    {
        timestamps: true
    }
);

export const Request = mongoose.model('Request', requestSchema, 'requests');
