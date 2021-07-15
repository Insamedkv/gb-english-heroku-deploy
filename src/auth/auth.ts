import { Router } from 'express';
import passport from 'passport';
import { mustAuthenticated } from './mustAuth';

export function authRouter(): Router {
  const router = Router();

  router.post('/auth',
    passport.authenticate('local', { session: true, failureRedirect: '/#/' }),
    (req, res) => {
      res.redirect('/#/Admin-category/');
    });

  router.get('/isAuth',
    (req, res) => {
      res.json({ status: req.isAuthenticated() });
    });

  router.post('/logout', mustAuthenticated,
    (req, res) => {
      res.redirect('/#/');
    });

  router.get('/logout', mustAuthenticated, (req, res) => {
    req.logout();
    res.redirect('/#/');
  });

  return router;
}
