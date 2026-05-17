import mongoose, { Schema } from 'mongoose';

const propertySchema = new Schema(
    {
        citizenId: {
            type: Schema.Types.ObjectId,
            ref: 'Citizen',
            required: true
        },
        address: {
            type: String,
            required: true,
            trim: true
        },
        propertyType: {
            type: String,
            enum: ['house', 'land', 'car'],
            required: true
        },
        details: {
            type: String,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

export const Property = mongoose.model('Property', propertySchema, 'properties');
