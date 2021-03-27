import mongoose from 'mongoose';

const AnnouncementPageSchema = new mongoose.Schema({
    title: String,
    visibility: String,
    userEmail: String,
    url: {
        type: String,
    },
    subscribers: [{
        type: String,
    }],
    authors: [{
        type: String,
    }],
    notes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Note"
    }],
    drafts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Draft"
    }]
}, {
    timestamps: true
});

const AnnouncementPage = mongoose.model('AnnouncementPage', AnnouncementPageSchema);
export { AnnouncementPage };