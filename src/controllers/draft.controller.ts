import { Draft } from '../models/draft.model';
import { AnnouncementPage } from '../models/ann_page.model';

// create and save a new draft
exports.create = async(req:any, res:any) => {
    // validate request
    if(!req.body.content) {
        return res.status(400).send({
            errors: [{ message:  "Draft content can not be empty" }]
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
            errors: [{ message:  "not authorized to save draft to this ann_page" }]
        });
    }


    // create a draft
    const draft = new Draft({
        title: req.body.title || "untitled",
        content: req.body.content,
        userEmail: req.currentUser.email,
        owner: req.params.ann_pageId
    });

    // save draft in database
    draft.save()
    .then(data => {
        AnnouncementPage.findByIdAndUpdate(req.params.ann_pageId, {
            $push: {drafts: data._id}
        }, {new: true, useFindAndModify: false})
        .then((ann_page: any) => {
            res.send(ann_page+data);
        })
    })
      .catch((err: any) => {
        res.status(500).send({
            errors: [{ message:  err.message || "error while creating draft" }]
        });
    });
};


// return all drafts
// exports.findAll = (req:any, res:any) => {
//     Draft.find()
//     .then((drafts: any) => {
//         res.send(drafts);
//     }).catch((err: any) => {
//         res.status(500).send({
//             message: err.message || "some error while retrieving all drafts"
//         })
//     })
// };


// find a single draft by id
exports.findOne = (req:any, res:any) => {
    Draft.findById(req.params.draftId)
    .then((draft: any) => {
        if(!draft) {
            return res.status(404).send({
                message: "draft not found with id " + req.params.draftId
            });
        }
        res.send(draft);
    }).catch((err: any) => {
        if(err.kind === 'ObjectId') {
            return res.status(404).send({
                message: "draft not found with id " + req.params.draftId
            });
        }
        return res.status(500).send({
            message: "error retreiving draft with id " + req.params.draftId
        });
    });
};


// find specified notes of ann_page
exports.findDraftsOfAnnPage = async(req:any, res:any) => {
    
    const ann_page = await AnnouncementPage.find({url: req.body.url}).populate('drafts');
    
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

    var drafts = (ann_page as any)[0].drafts.slice(parseInt(req.params.start) - 1, parseInt(req.params.end));

    res.send(drafts);
};


// update a draft with id
exports.update = async(req:any, res:any) => {
    // validate request
    if(!req.body.content) {
        return res.status(400).send({
            message: "draft content can not be empty"
        });
    }

    // find and update draft
    const draft = await Draft.findById(req.params.draftId);
    
    if(!draft) {
        return res.status(404).send({
            message: "draft not found with id " + req.params.draftId
        });
    } 

    if((draft as any).userEmail !== req.currentUser!.email){
        return res.status(404).send({
            message: "not authorized to edit this draft"
        });
    }

    draft!.set({
        title: req.body.title || "untitled",
        content: req.body.content
    });
    
    await draft.save();
    res.send(draft);
};


// delete draft by id
exports.delete = async(req:any, res:any) => {
    // find and delete draft
    const draft = await Draft.findById(req.params.draftId);
    
    if(!draft) {
        return res.status(404).send({
            message: "draft not found with id " + req.params.draftId
        });
    }

    if((draft as any).userEmail !== req.currentUser!.email){
        return res.status(404).send({
            message: "not authorized to delete this draft"
        });
    }

    Draft.findByIdAndRemove(req.params.draftId)
    .then((draft: any) => {
        AnnouncementPage.findById((draft as any).owner)
            .then((ann_page:any) => {
                ann_page.drafts.pull((draft as any)._id)
                ann_page.save()
                res.send({message: "draft deleted successfully", url: ann_page.url});
            })
    }).catch((err: any) => {
        if(err.kind === 'ObjectId' || err.name === 'Not found') {
            return res.status(404).send({
                message: "draft not found with id " + req.params.draftId
            });
        }
        return res.status(500).send({
            message: "error deleting draft with id " + req.params.draftId
        });
    });
};


