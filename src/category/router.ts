import { Router } from 'express';
import fs from 'fs';
import { Multer } from 'multer';
import rimraf from 'rimraf';
import { mustAuthenticated } from '../auth/mustAuth';
import { StatusCodes } from '../common';
import DatabaseControl from '../database/database';
import { createWordRouter } from '../word/router';
import { Category } from './category';

export function createCategoryRouter(db: DatabaseControl, mult: Multer): Router {
  const router = Router();

  router.use('/:id/word', createWordRouter(db, mult));

  // Get all categories
  router.get('/', async (req, res) => {
    const allCategories = await db.getCategories();
    return res.json(allCategories);
  });

  // Get by id
  router.get('/:id', mustAuthenticated, async (req, res) => {
    const categoryId = req.params.id;
    if (!categoryId) {
      return res.status(StatusCodes.BadRequest);
    }
    const category = await db.getCategory('id', categoryId);
    if (!category) {
      return res.sendStatus(StatusCodes.NotFound);
    }
    return res.json(category);
  });

  // Create new category
  router.post('/', mustAuthenticated, async (req, res) => {
    const data = req.body as Category;
    if (!data.categoryName) return res.sendStatus(StatusCodes.BadRequest);
    const categoryId = await db.addCategory(data.categoryName);
    const audioPath = `./audio/${categoryId}`;
    const imgPath = `./img/${categoryId}`;
    try {
      fs.mkdirSync(audioPath, { recursive: true });
      fs.mkdirSync(imgPath, { recursive: true });
      return res.json({});
    } catch (e) {
      return res.status(StatusCodes.BadRequest).send(e);
    }
  });

  // Delete category
  router.delete('/:id', mustAuthenticated, async (req, res) => {
    const categoryId = req.params.id;
    const audioPath = `./audio/${categoryId}`;
    const imgPath = `./img/${categoryId}`;
    if (!categoryId) {
      return res.status(StatusCodes.BadRequest);
    }
    try {
      rimraf(audioPath, () => {});
      rimraf(imgPath, () => {});
      await db.deleteCategory(categoryId);
      return res.sendStatus(StatusCodes.Ok);
    } catch (e) {
      return res.status(StatusCodes.BadRequest).send(e);
    }
  });

  // Update category
  router.put('/:id', mustAuthenticated, async (req, res) => {
    const categoryId = req.params.id;
    const data = req.body as Category;
    if (!categoryId || !data.categoryName) {
      return res.status(StatusCodes.BadRequest);
    }
    try {
      await db.updateCategory(categoryId, data.categoryName);
      return res.sendStatus(StatusCodes.Ok);
    } catch (e) {
      return res.status(StatusCodes.BadRequest).send(e);
    }
  });

  return router;
}
