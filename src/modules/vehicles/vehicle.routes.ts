import { Router } from 'express';
import { uploadSingleImage } from '../../middleware/upload.middleware';
import { validate } from '../../middleware/validate';
import * as controller from './vehicle.controller';
import {
  createVehicleSchema,
  updateBrandModelSchema,
  updateYearSchema,
  updateColorSchema,
  updateTypeSchema,
  imageUploadSchema,
} from './vehicle.validator';

const router = Router();

router.post('/', validate({ body: createVehicleSchema }), controller.createVehicle);
router.put(
  '/:id/brand-model',
  validate({ body: updateBrandModelSchema }),
  controller.updateBrandModel,
);
router.put('/:id/type', validate({ body: updateTypeSchema }), controller.updateType);
router.put('/:id/color', validate({ body: updateColorSchema }), controller.updateColor);
router.put('/:id/year', validate({ body: updateYearSchema }), controller.updateYear);
router.post(
  '/:id/image',
  uploadSingleImage,
  validate({ file: imageUploadSchema }),
  controller.uploadImage,
);

router.get('/:id', controller.getVehicle);
router.delete('/:id', controller.deleteVehicle);

export default router;
