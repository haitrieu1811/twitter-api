import { Router } from 'express';

import { uploadImageController } from '~/controllers/medias.controllers';
import { wrapRequestHandler } from '~/utils/handlers';

const mediasRouter = Router();

mediasRouter.post('/upload-images', wrapRequestHandler(uploadImageController));

export default mediasRouter;
