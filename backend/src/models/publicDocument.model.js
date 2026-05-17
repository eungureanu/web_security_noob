import mongoose, { Schema } from 'mongoose';

const publicDocumentSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            default: null
        },
        category: {
            type: String,
            required: true,
            trim: true
        },
        fileUrl: {
            type: String,
            required: true
        },
        uploadedBy: {
            type: String,
            required: true,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

export const PublicDocument = mongoose.model('PublicDocument', publicDocumentSchema, 'publicDocuments');
