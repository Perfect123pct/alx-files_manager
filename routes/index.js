import express from 'express';
import { getStatus, getStats } from '../controllers/AppController';

const router = express.Router();

router.get('/status', getStatus);
router.get('/stats', getStats);
router.get('/files/:id', FilesController.getShow);
router.get('/files', FilesController.getIndex);
router.get('/files/:id', FilesController.getShow);
router.get('/files', FilesController.getIndex);
router.get('/files/:id/data', FilesController.getFile);

router.put('/files/:id/publish', FilesController.putPublish);
router.put('/files/:id/unpublish', FilesController.putUnpublish);

export default router;


