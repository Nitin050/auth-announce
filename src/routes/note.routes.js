module.exports = (app) => {
    const notes = require('../controllers/note.controller.js');
    const ann_pages = require('../controllers/ann_page.controller.js');

    // app.post('/notes', notes.create);
    app.post('/ann_pages/create_note/:ann_pageId', notes.create);
    app.get('/notes', notes.findAll);
    app.get('/notes/:noteId', notes.findOne);
    app.put('/notes/:noteId', notes.update);
    app.delete('/notes/:noteId', notes.delete);
    
    app.post('/ann_pages', ann_pages.create);
    app.get('/ann_pages', ann_pages.findAll);
    app.get('/ann_pages/:ann_pageId', ann_pages.findOne);
    app.get('/ann_pages/:ann_pageId/notes', ann_pages.findNotes);
    app.put('/ann_pages/:ann_pageId', ann_pages.update);
    app.delete('/ann_pages/:ann_pageId', ann_pages.delete);
}