import { Note } from '../models/note.model';
import { AnnouncementPage } from '../models/ann_page.model';

// create and save a new note
exports.create = async(req:any, res:any) => {
    // validate request
    if(!req.body.content) {
        return res.status(400).send({
            errors: [{ message:  "Note content can not be empty" }]
        });
    }
    
    const ann_page = await AnnouncementPage.find({_id: req.params.ann_pageId});
    
    if(!ann_page) {
        return res.status(404).send({
            errors: [{ message:  "ann_page not found with id " + req.params.ann_pageId }]
        });
    }

    if(req.currentUser!.email !== (ann_page as any)[0].userEmail){
        return res.status(404).send({
            errors: [{ message:  "not authorized to save post to this ann_page" }]
        });
    }

    // create a note
    const note = new Note({
        title: req.body.title || "untitled",
        content: req.body.content,
        userEmail: req.currentUser.email,
        owner: req.params.ann_pageId
    });

    // save note in database
    note.save()
    .then(data => {
        AnnouncementPage.findByIdAndUpdate(req.params.ann_pageId, {
            $push: {notes: data._id}
        }, {new: true, useFindAndModify: false})
        .then((ann_page: any) => {
            res.send(ann_page+data);
        })
    })
      .catch(err => {
        res.status(500).send({
            errors: [{ message:  err.message || "error while creating note" }]
        });
    });
};


// return all notes
// exports.findAll = (req:any, res:any) => {
//     Note.find({})
//     .then((notes: any) => {
//         res.send(notes);
//     }).catch((err: any) => {
//         res.status(500).send({
//             message: err.message || "some error while retrieving all notes"
//         })
//     })
// };


// find a single note by id
exports.findOne = (req:any, res:any) => {
    Note.findById(req.params.noteId)
    .then((note: any) => {
        if(!note) {
            return res.status(404).send({
                message: "Note not found with id " + req.params.noteId
            });
        }

        const ann_page = AnnouncementPage.findById((note as any).owner);
        if((ann_page as any).visibility === 'private'){
            if(req.currentUser!.id in (ann_page as any).subscribers){
                res.send(ann_page);
            }
            else{
                return res.status(404).send({
                    message: "not authorized to  this ann_page"
                }); 
            }
        }
        res.send(note);
    }).catch((err: any) => {
        if(err.kind === 'ObjectId') {
            return res.status(404).send({
                message: "Note not found with id " + req.params.noteId
            });
        }
        return res.status(500).send({
            message: "error retreiving note with id " + req.params.noteId
        });
    });
};



// find specified notes of ann_page
exports.findNotesOfAnnPage = async(req:any, res:any) => {
    
    const ann_page = await AnnouncementPage.find({url: req.body.url}).populate('notes');
    
    if(!ann_page) {
        return res.status(404).send({
            errors: [{ message:  "ann_page not found with url " + req.body.url }]
        });
    }

    if((ann_page as any).visibility === 'private'){
        if(!(req.currentUser!.email in (ann_page as any).subscribers)){
            return res.status(404).send({
                errors: [{ message:  "not authorized to view this ann_page" }]
            });
        }
    }
    var notes = (ann_page as any)[0].notes.reverse();
    notes = notes.slice(parseInt(req.params.start) - 1, parseInt(req.params.end));
    // notes = (ann_page as any)[0].notes.sort({createdAt: -1}).slice(parseInt(req.params.start) - 1, parseInt(req.params.end));

    res.send(notes);
};


// update a note with id
exports.update = async(req:any, res:any) => {
    // validate request
    if(!req.body.content) {
        return res.status(400).send({
            message: "note content can not be empty"
        });
    }

    // find and update note
    const note = await Note.findById(req.params.noteId);
    
    if(!note) {
        return res.status(404).send({
            message: "Note not found with id " + req.params.noteId
        });
    }

    if((note as any).userEmail !== req.currentUser!.email){
        return res.status(404).send({
            message: "not authorized to edit this note"
        });
    }

    note!.set({
        title: req.body.title || "untitled",
        content: req.body.content
    });
    
    await note.save();
    res.send(note);
};


// delete note by id
exports.delete = async(req:any, res:any) => {
    // find and delete note
    const note = await Note.findById(req.params.noteId);
    
    if(!note) {
        return res.status(404).send({
            message: "Note not found with id " + req.params.noteId
        });
    }

    if((note as any).userEmail !== req.currentUser!.email){
        return res.status(404).send({
            message: "not authorized to delete this note"
        });
    }

    Note.findByIdAndRemove(req.params.noteId)
    .then((note: any) => {
        AnnouncementPage.findById((note as any).owner)
            .then((ann_page:any) => {
                ann_page.notes.pull((note as any)._id)
                ann_page.save()
                res.send({message: "note deleted successfully"});
            })
    }).catch((err: any) => {
        if(err.kind === 'ObjectId' || err.name === 'Not found') {
            return res.status(404).send({
                message: "Note not found with id " + req.params.noteId
            });
        }
        return res.status(500).send({
            message: "error deleting note with id " + req.params.noteId
        });
    });
};


