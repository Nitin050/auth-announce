import express from 'express';
import cors from 'cors';
import 'express-async-errors';
import { json } from 'body-parser';
import mongoose, { mongo } from 'mongoose';
import cookieSession from 'cookie-session';
import { currentUserRouter } from './routes/current-user';
import { signinRouter } from './routes/signin';
import { signoutRouter } from './routes/signout';
import { signupRouter } from './routes/signup';
import { errorHandler } from './middlewares/error-handler';
import { NotFoundError } from './errors/not-found-error';
import { currentUser } from './middlewares/current-user';
import { requireAuth } from './middlewares/require-auth';
import * as notes from './controllers/note.controller';
import * as drafts from './controllers/draft.controller';
import * as ann_pages from './controllers/ann_page.controller';

// deploy
const port = process.env.PORT;
const host = '0.0.0.0';
const mongoURL = "mongodb+srv://1234:1234@cluster-announce.qotos.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
const secure = true;
const sameSite = 'none';

// development
// const port = 5000;
// const host = 'localhost';
// const mongoURL = 'mongodb://localhost:27017/ann';
// const secure = false;
// const sameSite = 'lax';

const app = express();
app.set('trust proxy', true);

var corsOptions = {
  origin: ['https://ann05.vercel.app', 'http://localhost:3000'],
  optionsSuccessStatus: 200,
  credentials: true,
  exposedHeaders: ["set-cookie"],
}
app.use(cors(corsOptions));

app.use(json());
app.use(
  cookieSession({
    signed: false,
    sameSite: sameSite,
    secure: secure
  })
);
app.use(currentUser);

app.use(currentUserRouter);
app.use(signinRouter);
app.use(signoutRouter);
app.use(signupRouter);

app.post('/create_note/:ann_pageId', requireAuth, (notes as any).create);
// app.get('/notes', (notes as any).findAll);
app.post('/notes/:start/:end', (notes as any).findNotesOfAnnPage);
app.get('/notes/:noteId', (notes as any).findOne);
app.put('/notes/:noteId', requireAuth, (notes as any).update);
app.delete('/notes/:noteId', requireAuth, (notes as any).delete);
 
app.post('/create_draft/:ann_pageId', requireAuth, (drafts as any).create);
// app.get('/drafts', (drafts as any).findAll);
app.post('/drafts/:start/:end', (drafts as any).findDraftsOfAnnPage);
app.get('/drafts/:draftId', (drafts as any).findOne);
app.put('/drafts/:draftId', requireAuth, (drafts as any).update);
app.delete('/drafts/:draftId', requireAuth, (drafts as any).delete);

app.post('/ann_pages', requireAuth, (ann_pages as any).create);
app.post('/ann_pages/findAll', requireAuth, (ann_pages as any).findAll);
app.post('/ann_pages/:url', (ann_pages as any).findOne);
app.post('/ann_pages/subscribe/:ann_pageId', (ann_pages as any).subscribe);
app.post('/ann_pages/addAuthors/:ann_pageId', (ann_pages as any).addAuthors);
app.get('/ann_pages/:ann_pageId/notes', (ann_pages as any).findNotes);
app.put('/ann_pages/:ann_pageId', requireAuth, (ann_pages as any).update);
app.delete('/ann_pages/:ann_pageId', requireAuth, (ann_pages as any).delete);

app.all('*', async(req, res) => {
  throw new NotFoundError();
});

app.use(errorHandler);

const start = async () => {

  // if (!process.env.JWT_KEY) {
  //   throw new Error('JWT_KEY is not defined');
  // }
  try {
    await mongoose.connect(mongoURL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true
    })
    console.log('ann connected to MongoDb');
  } catch (err) {
    console.log('ann NOT connected to MongoDb');
    console.error(err);
  }

  app.listen( port as any, host, () => {
    console.log('ann listening on port '+ port);
  });
};

start();