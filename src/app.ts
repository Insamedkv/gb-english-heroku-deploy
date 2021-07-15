/* eslint-disable no-console */
import path from 'path';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import passport from 'passport';
import { Strategy } from 'passport-local';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import { createCategoryRouter } from './category/router';
import DatabaseControl from './database/database';
import { authRouter } from './auth/auth';

function createApp(databaseControl:DatabaseControl) {
  const app = express();
  app.use(cors({ credentials: true, origin: 'http://localhost:8080' }));
  app.use(cookieParser());
  app.use(session({ secret: 'SECRET' }));
  app.use(passport.initialize());
  app.use(passport.session());

  const storageConfig = multer.diskStorage({
    destination: (req, file, cb) => {
      if (file.fieldname === 'img') {
        cb(null, `./img/${req.params.id}`);
      }
      if (file.fieldname === 'audio') {
        cb(null, `./audio/${req.params.id}`);
      }
    },
    filename: (req, file, cb) => {
      cb(null, uuidv4().concat(`.${file.originalname.split('.').pop()}`));
    },
  });

  const mult = multer({ storage: storageConfig });

  app.use('/audio', express.static(path.join(__dirname, '../audio')));
  app.use('/img', express.static(path.join(__dirname, '../img')));

  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());

  const publicPath = path.resolve(__dirname, '../wwwroot');
  const indexPath = path.resolve(__dirname, '../wwwroot/index.html');

  // if query not starts with '/api/' string - send file from wwwroot
  app.use(/^(?!\/api\/)/, express.static(publicPath));
  // if file doesn't exists - send index.html
  app.use(/^(?!\/api\/)/, (req, res) => {
    res.sendFile(indexPath);
  });

  app.use('/api/categories', createCategoryRouter(databaseControl, mult));
  app.use('/api', authRouter());

  passport.serializeUser((user, done) => {
    done(null, user);
  });

  passport.deserializeUser((user: boolean, done) => {
    done(null, user);
  });

  passport.use(new Strategy(
    (username, password, done) => {
      if (username !== 'admin') { return done(null, false); }
      if (password !== 'admin') { return done(null, false); }
      return done(null, { user: true });
    },
  ));

  app.listen(process.env.PORT || 3000, () => console.log('Server started on http://localhost:3000'));
}

(async () => {
  const databaseControl = new DatabaseControl();
  await databaseControl.init('GBEnglish.db');
  createApp(databaseControl);
})();
