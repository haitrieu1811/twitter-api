import express, { Router } from 'express';
import { serveImageController } from '~/controllers/medias.controllers';

const staticRouter = Router();

staticRouter.get('/image/:name', serveImageController);

export default staticRouter;
