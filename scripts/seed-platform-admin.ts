import 'dotenv/config';

import { hashPassword } from 'better-auth/crypto';
import { eq } from 'drizzle-orm';

import { db } from '../app/db';
import { account } from '../app/db/models/auth';
import { UserRole } from '../app/db/models/enums';
import { users } from '../app/db/models/users';

const email = process.argv[2];
const password = process.argv[3];
const name = process.argv[4] ?? 'Platform Admin';

// Creates or updates a platform admin user with email/password credentials.
async function seedPlatformAdmin() {
  if (!email || !password) {
    console.error('Usage: yarn seed:admin <email> <password> [name]');
    process.exit(1);
  }

  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }

  const normalizedEmail = email.toLowerCase();
  const hashedPassword = await hashPassword(password);

  const existing = await db.query.users.findFirst({
    where: eq(users.email, normalizedEmail),
  });

  let userId: string;

  if (existing) {
    userId = existing.id;

    await db
      .update(users)
      .set({
        name,
        role: UserRole.PLATFORM_ADMIN,
        deletedAt: null,
      })
      .where(eq(users.id, existing.id));

    const existingAccount = await db.query.account.findFirst({
      where: eq(account.userId, existing.id),
    });

    if (existingAccount) {
      await db
        .update(account)
        .set({ password: hashedPassword })
        .where(eq(account.id, existingAccount.id));
    } else {
      await db.insert(account).values({
        userId: existing.id,
        providerId: 'credential',
        accountId: existing.id,
        password: hashedPassword,
      });
    }

    console.log(`Updated platform admin: ${normalizedEmail}`);
  } else {
    const [created] = await db
      .insert(users)
      .values({
        name,
        email: normalizedEmail,
        role: UserRole.PLATFORM_ADMIN,
        emailVerified: true,
      })
      .returning();

    if (!created) {
      throw new Error('Failed to create user');
    }

    userId = created.id;

    await db.insert(account).values({
      userId: created.id,
      providerId: 'credential',
      accountId: created.id,
      password: hashedPassword,
    });

    console.log(`Created platform admin: ${normalizedEmail}`);
  }

  console.log(`User id: ${userId}`);
}

seedPlatformAdmin()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
