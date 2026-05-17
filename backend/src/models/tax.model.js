import mongoose, { Schema } from 'mongoose';

const taxSchema = new Schema(
    {
        citizenId: {
            type: Schema.Types.ObjectId,
            ref: 'Citizen',
            required: true
        },
        propertyId: {
            type: Schema.Types.ObjectId,
            ref: 'Property',
            default: null
        },
        title: {
            type: String,
            required: true,
            trim: true
        },
        amount: {
            type: Number,
            required: true,
            min: 0
        },
        dueDate: {
            type: Date,
            required: true
        },
        status: {
            type: String,
            enum: ['pending', 'paid'],
            required: true,
            default: 'pending'
        }
    },
    {
        timestamps: true
    }
);

export const Tax = mongoose.model('Tax', taxSchema, 'taxes');
