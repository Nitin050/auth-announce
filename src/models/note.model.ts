import mongoose from 'mongoose';

const NoteSchema = new mongoose.Schema({
    title: String,
    content: Object,
    userEmail: String,
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AnnouncementPage"
    }
}, {
    timestamps: true
});

const Note = mongoose.model('Note', NoteSchema);
export { Note }