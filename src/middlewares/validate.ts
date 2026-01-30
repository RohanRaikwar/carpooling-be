import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodSchema } from 'zod';

type SchemaTargets = {
  body?: ZodSchema;
  params?: ZodSchema;
  query?: ZodSchema;
  file?: ZodSchema; // multer file
};

export const validate =
  (schemas: SchemaTargets) => (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schemas.body) {
        schemas.body.parse(req.body); // works for JSON & form-data
      }

      if (schemas.params) {
        schemas.params.parse(req.params);
      }

      if (schemas.query) {
        schemas.query.parse(req.query);
      }

      if (schemas.file) {
        console.log(req.file);

        schemas.file.parse(req.file); // multer single file
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.issues.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
      }
      next(error);
    }
  };
