import mongoose, { Schema } from 'mongoose';

export const USER_ROLES = ['citizen', 'registry', 'taxes', 'super_admin'];

const userSchema = new Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true
        },
        password: {
            type: String,
            required: true
        },
        role: {
            type: String,
            enum: USER_ROLES,
            required: true
        },
        citizenId: {
            type: Schema.Types.ObjectId,
            ref: 'Citizen',
            default: null
        }
    },
    {
        timestamps: true
    }
);

userSchema.index({ citizenId: 1 }, { unique: true, sparse: true });

// the same user cannot be a citizen and a staff member; separate user accounts are needed for each role
userSchema.pre('validate', function (next) {
    if (this.role === 'citizen' && !this.citizenId) {
        return next(new Error('Citizen accounts must be linked to a citizen record.'));
    }

    if (this.role !== 'citizen' && this.citizenId) {
        return next(new Error('citizenId is only for citizen-role accounts. Use a separate personal login for your own records.'));
    }

    next();
});

export const User = mongoose.model('User', userSchema, 'users');
