import { Router } from 'express';
import { Multer } from 'multer';
import { mustAuthenticated } from '../auth/mustAuth';
import { StatusCodes } from '../common';
import DatabaseControl from '../database/database';
import { Word } from './word';

interface ReqParams {
  id: string,
}

interface FileParam {
  [fieldname: string]: Express.Multer.File[];
}

export function createWordRouter(db: DatabaseControl, mult: Multer): Router {
  const router = Router({ mergeParams: true });

  // Get word by id
  router.get('/:wordid', mustAuthenticated, async (req, res) => {
    try {
      const data = await db.getCategoryWord('id', req.params.wordid);
      if (!data) return res.sendStatus(StatusCodes.NotFound);
      return res.json(data);
    } catch (e) {
      return res.status(StatusCodes.BadRequest).send(e);
    }
  });

  router.get<'/', ReqParams>('/', async (req, res) => {
    try {
      const data = await db.getCategoryWords(req.params.id);
      if (!data) return res.sendStatus(StatusCodes.NotFound);
      return res.json(data);
    } catch (e) {
      return res.status(StatusCodes.BadRequest).send(e);
    }
  });

  router.delete('/:wordid', mustAuthenticated, async (req, res) => {
    try {
      await db.deleteCategoryWord(req.params.wordid);
      return res.sendStatus(StatusCodes.Ok);
    } catch (e) {
      return res.status(StatusCodes.NotFound).send(e);
    }
  });

  router.post(
    '/',
    mustAuthenticated,
    mult.fields([{ name: 'img' }, { name: 'audio' }]),
    async (req, res) => {
      const data = req.body as Word;
      const category = await db.getCategory('id', req.params.id);
      if (!category) {
        return res.status(StatusCodes.BadRequest).send('Invalid category ID');
      }
      try {
        await db.addCategoryWord(
          req.params.id,
          data.word,
          data.translation,
          `/img/${category.id}/${(req.files! as FileParam).img[0].filename}`,
          `/audio/${category.id}/${(req.files! as FileParam).audio[0].filename}`,
        );
        return res.json();
      } catch (e) {
        return res.status(StatusCodes.BadRequest).send(e);
      }
    },
  );

  router.put(
    '/:wordid',
    mustAuthenticated,
    mult.fields([{ name: 'img' }, { name: 'audio' }]),
    async (req, res) => {
      const data = req.body as Word;
      const [category, word] = await Promise.all(
        [db.getCategory('id', req.params.id), db.getCategoryWord('id', req.params.wordid)],
      );
      if (category.id !== word.idCategory) {
        return res.status(StatusCodes.BadRequest).send('Invalid category ID');
      }
      try {
        await db.updateCategoryWord(
          req.params.wordid,
          data.word,
          data.translation,
          `/img/${category.id}/${(req.files! as FileParam).img[0].filename}`,
          `/audio/${category.id}/${(req.files! as FileParam).audio[0].filename}`,
        );
        return res.json();
      } catch (e) {
        return res.status(StatusCodes.BadRequest).send(e);
      }
    },
  );

  return router;
}
