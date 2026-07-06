import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '~/db';
import { UserRole } from '~/db/models/enums';
import * as schema from '~/db/schema';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: schema,
  }),
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [process.env.BETTER_AUTH_URL ?? 'http://localhost:5173'],
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
  },
  user: {
    modelName: 'users',
    additionalFields: {
      role: {
        type: [UserRole.PLATFORM_ADMIN, UserRole.PROVIDER, UserRole.PATIENT],
        required: true,
        defaultValue: UserRole.PATIENT,
        input: false,
        returned: true,
      },
    },
  },
});
