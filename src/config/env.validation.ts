import Joi from 'joi';

export const envValidationSchema = Joi.object({
  DATABASE_URL: Joi.string().required(),
  LOG_LEVEL: Joi.string()
    .valid('trace', 'debug', 'info', 'warn', 'error', 'fatal')
    .default('info'),
  ORIGIN: Joi.string().required(),
  THROTTLE_TTL: Joi.number().required(),
  THROTTLE_LIMIT: Joi.number().required(),
  STORAGE_PROVIDER: Joi.string().valid('minio', 'local').default('minio'),
  STORAGE_ENDPOINT: Joi.string().uri().default('http://localhost:9000'),
  STORAGE_PUBLIC_ENDPOINT: Joi.string().uri(),
  STORAGE_REGION: Joi.string().default('us-east-1'),
  STORAGE_BUCKET: Joi.string().default('voyage-files'),
  STORAGE_ACCESS_KEY: Joi.string().default('minioadmin'),
  STORAGE_SECRET_KEY: Joi.string().default('minioadmin'),
});
