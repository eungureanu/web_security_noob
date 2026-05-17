import mongoose, { Schema } from 'mongoose';

const appointmentSchema = new Schema(
    {
        citizenId: {
            type: Schema.Types.ObjectId,
            ref: 'Citizen',
            required: true
        },
        department: {
            type: String,
            required: true,
            trim: true
        },
        date: {
            type: Date,
            required: true
        },
        purpose: {
            type: String,
            required: true,
            trim: true
        },
        status: {
            type: String,
            enum: ['scheduled', 'completed', 'cancelled'],
            required: true,
            default: 'scheduled'
        }
    },
    {
        timestamps: true
    }
);

export const Appointment = mongoose.model('Appointment', appointmentSchema, 'appointments');
