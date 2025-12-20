import mongoose, { Document, Schema } from 'mongoose';

export interface IRide extends Document {
    driver: mongoose.Types.ObjectId;
    origin: {
        type: string;
        coordinates: number[];
        address: string;
    };
    destination: {
        type: string;
        coordinates: number[];
        address: string;
    };
    departureTime: Date;
    seats: number;
    availableSeats: number;
    price: number;
    preferences: {
        smoking: boolean;
        pets: boolean;
        music: boolean;
    };
    status: 'draft' | 'published' | 'in_progress' | 'completed' | 'canceled';
    passengers: mongoose.Types.ObjectId[];
}

const rideSchema = new Schema<IRide>(
    {
        driver: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        origin: {
            type: { type: String, default: 'Point' },
            coordinates: { type: [Number], required: true }, // [longitude, latitude]
            address: { type: String, required: true },
        },
        destination: {
            type: { type: String, default: 'Point' },
            coordinates: { type: [Number], required: true },
            address: { type: String, required: true },
        },
        departureTime: { type: Date, required: true },
        seats: { type: Number, required: true },
        availableSeats: { type: Number, required: true },
        price: { type: Number, required: true },
        preferences: {
            smoking: { type: Boolean, default: false },
            pets: { type: Boolean, default: false },
            music: { type: Boolean, default: false },
        },
        status: {
            type: String,
            enum: ['draft', 'published', 'in_progress', 'completed', 'canceled'],
            default: 'published',
        },
        passengers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    },
    { timestamps: true },
);

rideSchema.index({ origin: '2dsphere' });
rideSchema.index({ destination: '2dsphere' });
rideSchema.index({ departureTime: 1 });

export default mongoose.model<IRide>('Ride', rideSchema);
