import { Note } from '../models/note.model';
import { AnnouncementPage } from '../models/ann_page.model';


// create and save a new ann_page
exports.create = async(req:any, res:any) => {
    const { email, url, title, visibility } = req.body;
    // validate request
    if(!title || !visibility) {
        return res.status(400).send({
            errors: [{ message: 'Announcement page title or visibility can not be empty' }]
        });
    }

    const existingAnn_page = await AnnouncementPage.findOne({url});

    if (existingAnn_page) {
        return res.status(400).send({
            errors: [{ message: 'URL already in use' }]
        });
    }

    // create ann_page
    const ann_page = new AnnouncementPage({
        title: title || "untitled",
        visibility: visibility,
        url: url,
        userEmail: email
    });

    (ann_page as any).subscribers.addToSet(email);
    (ann_page as any).authors.addToSet(email);

    // save ann_page in database
    ann_page.save()
    .then((data: any) => {
        res.send(data);
    }).catch((err: any) => {
        res.status(500).send({
            errors: [{ message:  err.message || "error while creating ann_page" }]
        })
    });
};


// return all ann_pages
exports.findAll = (req:any, res:any) => {
    AnnouncementPage.find({userEmail: req.currentUser!.email})
    .sort({createdAt: -1})
    .then((ann_pages: any) => {
        res.send(ann_pages);
    }).catch((err: any) => {
        res.status(500).send({
            errors: [{ message:  err.message || "some error while retrieving all ann_pages"}]
        })
    })
};


// return all public ann_pages
exports.findAllPublic = (req:any, res:any) => {
    AnnouncementPage.find({visibility: 'public'})
    .sort({createdAt: -1})
    .then((ann_pages: any) => {
        res.send(ann_pages);
    }).catch((err: any) => {
        res.status(500).send({
            errors: [{ message:  err.message || "some error while retrieving all ann_pages"}]
        })
    })
};


// return all subscribed ann_pages
exports.findAllSubscribed = (req:any, res:any) => {
    AnnouncementPage.find({subscribers:  req.currentUser!.email})
    .sort({createdAt: -1})
    .then((ann_pages: any) => {
        res.send(ann_pages);
    }).catch((err: any) => {
        res.status(500).send({
            errors: [{ message:  err.message || "some error while retrieving all ann_pages"}]
        })
    })
};


// find a single ann_page by url
exports.findOne = async(req:any, res:any) => {
    
    const ann_page = await AnnouncementPage.find({url: req.params.url});
    
    if(!ann_page) {
        return res.status(404).send({
            errors: [{ message:  "ann_page not found with url " + req.params.url }]
        });
    }

    if((ann_page as any).visibility === 'private'){
        if(!(req.currentUser!.email in (ann_page as any).subscribers)){
            return res.status(404).send({
                errors: [{ message:  "not authorized to view this ann_page" }]
            });
        }
    }

    res.send(ann_page);
};


// subscribe to ann_page with emails
exports.subscribe = async(req:any, res:any) => {
    // find and update ann_page
    

    const ann_page = await AnnouncementPage.findById(req.params.ann_pageId);
    
    if(!ann_page) {
        return res.status(200).send({
            message: "ann_page not found with id " + req.params.ann_pageId
        });
    }

    if((ann_page as any).visibility === 'private'){
        if(req.currentUser!.email !== (ann_page as any).userEmail){
            return res.status(200).send({
                message: "not authorized to let others subscribe this ann_page"
            }); 
        }
    }

    // (ann_page as any).subscribers.addToSet(req.currentUser!.email);
    for (var email in req.body.emails){
        (ann_page as any).subscribers.addToSet(req.body.emails[email]);
    }
    await ann_page.save();
    res.send(ann_page);
   
};


// add authors to ann_page with emails
exports.addAuthors = async(req:any, res:any) => {
    // find and update ann_page
    

    const ann_page = await AnnouncementPage.findById(req.params.ann_pageId);
    
    if(!ann_page) {
        return res.status(200).send({
            message: "ann_page not found with id " + req.params.ann_pageId
        });
    }

    if(req.currentUser!.email !== (ann_page as any).userEmail){
        return res.status(200).send({
            message: "not authorized to add others as authors to this ann_page"
        }); 
    }

    for (var email in req.body.emails){
        (ann_page as any).authors.addToSet(req.body.emails[email]);
    }
    await ann_page.save();
    res.send(ann_page);
   
};


// update a ann_page with id
exports.update = async(req:any, res:any) => {

    // find and update ann_page
    const ann_page = await AnnouncementPage.findById(req.params.ann_pageId);
    
    if(!ann_page) {
        return res.status(404).send({
            message: "ann_page not found with id " + req.params.ann_pageId
        });
    }

    if((ann_page as any).userId !== req.currentUser!.email){
        return res.status(404).send({
            message: "not authorized to edit this ann_page"
        });
    }

    ann_page!.set({
        title: req.body.title || (ann_page as any).title,
        visibility: req.body.visibility || (ann_page as any).visibility
    });
    
    await ann_page.save();
    res.send(ann_page);
};


// delete ann_page by id
exports.delete = async(req:any, res:any) => {
    // find and delete ann_page
    const ann_page = await AnnouncementPage.findById(req.params.ann_pageId);
    
    if(!ann_page) {
        return res.status(404).send({
            message: "ann_page not found with id " + req.params.ann_pageId
        });
    }

    if((ann_page as any).userEmail !== req.currentUser!.email){
        return res.status(404).send({
            message: "not authorized to edit this ann_page"
        });
    }

    AnnouncementPage.findByIdAndRemove(req.params.ann_pageId)
    .then(async (ann_page: any) => {
        await Note.deleteMany({owner: req.params.ann_pageId});
        res.send({message: "ann_page deleted successfully"});
    }).catch((err: any) => {
        if(err.kind === 'ObjectId' || err.name === 'Not found') {
            return res.status(404).send({
                message: "ann_page not found with id " + req.params.ann_pageId
            });
        }
        return res.status(500).send({
            message: "error deleting ann_page with id " + req.params.ann_pageId
        });
    });
};


// find all notes of an ann_page
exports.findNotes = (req:any, res:any) => {
    AnnouncementPage.findById(req.params.ann_pageId).populate("notes")
    .then((ann_page: any) => {
        if(!ann_page) {
            return res.status(404).send({
                message: "ann_page not found with id " + req.params.ann_pageId
            });
        } 
        res.send(ann_page);
    }).catch((err: any) => {
        if(err.kind === 'ObjectId') {
            return res.status(404).send({
                message: "ann_page not found with id " + req.params.ann_pageId
            });
        }
        return res.status(500).send({
            message: "error retreiving ann_page with id " + req.params.ann_pageId
        });
    });
};


