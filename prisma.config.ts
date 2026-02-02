import 'dotenv/config';
import dotenv from 'dotenv';
dotenv.config();
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: 'postgresql://myuser:mypass@localhost:5433/my_db?schema=public', // pass your DB URL
  },
});
