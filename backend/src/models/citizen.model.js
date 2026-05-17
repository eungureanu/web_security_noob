import mongoose, { Schema } from 'mongoose';

const citizenSchema = new Schema(
    {
        firstName: {
            type: String,
            required: true,
            trim: true
        },
        lastName: {
            type: String,
            required: true,
            trim: true
        },
        CNP: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        idCardNumber: {
            type: String,
            required: true,
            trim: true
        },
        address: {
            type: String,
            required: true,
            trim: true
        },
        phone: {
            type: String,
            required: true,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

export const Citizen = mongoose.model('Citizen', citizenSchema, 'citizens');
