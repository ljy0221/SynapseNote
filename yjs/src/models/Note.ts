import mongoose, { Schema, Document } from 'mongoose';

export interface INote extends Document {
    updatedAt: Date;
}

// Minimal Schema to just update timestamps
const NoteSchema: Schema = new Schema({}, {
    timestamps: true, // auto-update updatedAt/createdAt if using save(), but we use updateOne
    strict: false, // Allow unknown fields
    versionKey: false,
    collection: 'notes' // Main backend collection name
});

export const Note = mongoose.model<INote>('Note', NoteSchema);
