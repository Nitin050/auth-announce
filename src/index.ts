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

// deploy
const port = process.env.PORT;
const host = '0.0.0.0';
const mongoURL = "mongodb+srv://1234:1234@cluster-announce.qotos.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";

// development
// const port = 5000;
// const host = 'localhost';
// const mongoURL = 'mongodb://localhost:27017/auth';

const app = express();
app.set('trust proxy', true);

var corsOptions = {
  origin: 'https://ann05.vercel.app',
  optionsSuccessStatus: 200,
  credentials: true,
  exposedHeaders: ["set-cookie"],
  'Access-Control-Allow-Origin': '*',
}
app.use(cors(corsOptions));

app.use(json());
app.use(
  cookieSession({
    signed: false,
    proxy: true,
    // secure: true
  })
);

app.use(currentUserRouter);
app.use(signinRouter);
app.use(signoutRouter);
app.use(signupRouter);
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
    console.log('auth connected to MongoDb');
  } catch (err) {
    console.log('auth NOT connected to MongoDb');
    console.error(err);
  }

  app.listen( port as any, host, () => {
    console.log('auth listening on port '+ port);
  });
};

start();