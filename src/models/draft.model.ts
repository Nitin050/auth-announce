import mongoose from 'mongoose';

const DraftSchema = new mongoose.Schema({
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

const Draft = mongoose.model('Draft', DraftSchema);
export { Draft }