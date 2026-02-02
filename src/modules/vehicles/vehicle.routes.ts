import { Router } from 'express';
import { uploadSingleImage } from '../../middlewares/upload.middleware.js';
import { validate } from '../../middlewares/validate.js';
import * as controller from './vehicle.controller';
import {
  createVehicleSchema,
  updateVehicleDetailsSchema,
  imageUploadSchema,
} from './vehicle.validator';

const router = Router();

router.post('/', validate({ body: createVehicleSchema }), controller.createVehicle);
router.put('/:id', validate({ body: createVehicleSchema }), controller.createVehicle);
router.put(
  '/:id/update-details',
  validate({ body: updateVehicleDetailsSchema }),
  controller.updateVehicleDetails,
);

router.post(
  '/:id/image',
  uploadSingleImage,
  validate({ file: imageUploadSchema }),
  controller.uploadImage,
);

router.get('/:id', controller.getVehicle);
router.delete('/:id', controller.deleteVehicle);

export default router;
