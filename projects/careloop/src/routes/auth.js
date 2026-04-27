import { Prisma } from "@prisma/client";
import { Resend } from "resend";
import {
  generateNumericCode,
  hashPassword,
  hashValue,
  normalizeEmail,
  passwordResetExpiry,
  passwordResetMinutes,
  resolveSocialProfile,
  sanitizeUser,
  verifyPassword,
} from "../lib/auth.js";

async function fetchUserWithMemberships(db, id) {
  const user = await db.user.findUnique({
    where: { id },
    include: {
      memberships: { include: { circle: true } },
      identities: true,
    },
  });
  return sanitizeUser(user);
}

export default async function authRoutes(app) {
  const db = app.db;
  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

  app.post("/auth/signup", async (req, reply) => {
    const { email, name, password, phone } = req.body ?? {};
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || !name?.trim() || !password || password.trim().length < 8) {
      return reply.code(400).send({ error: "name, email, and password (min 8 chars) are required" });
    }

    try {
      const user = await db.user.create({
        data: {
          email: normalizedEmail,
          name: name.trim(),
          phone: phone?.trim() || null,
          passwordHash: hashPassword(password),
        },
      });
      return reply.code(201).send({
        method: "PASSWORD",
        user: await fetchUserWithMemberships(db, user.id),
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        return reply.code(409).send({ error: "Email already exists" });
      }
      throw err;
    }
  });

  app.post("/auth/login", async (req, reply) => {
    const { email, password } = req.body ?? {};
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || !password) {
      return reply.code(400).send({ error: "email and password are required" });
    }

    const user = await db.user.findUnique({ where: { email: normalizedEmail } });
    if (!user?.passwordHash || !verifyPassword(password, user.passwordHash)) {
      return reply.code(401).send({ error: "Invalid email or password" });
    }

    return reply.send({
      method: "PASSWORD",
      user: await fetchUserWithMemberships(db, user.id),
    });
  });

  app.post("/auth/social", async (req, reply) => {
    const { provider, idToken, accessToken, email, name, providerUserId } = req.body ?? {};
    if (!provider) return reply.code(400).send({ error: "provider is required" });

    let resolved;
    try {
      resolved = await resolveSocialProfile(provider, {
        idToken,
        accessToken,
        email,
        name,
        providerUserId,
      });
    } catch (error) {
      return reply.code(401).send({ error: error.message });
    }

    if (!resolved.email) {
      const existingIdentity = await db.authIdentity.findUnique({
        where: {
          provider_providerUserId: {
            provider,
            providerUserId: resolved.providerUserId,
          },
        },
      });
      if (!existingIdentity) {
        return reply.code(400).send({ error: "Provider did not return an email for first-time account creation" });
      }
      return reply.send({
        method: provider,
        user: await fetchUserWithMemberships(db, existingIdentity.userId),
      });
    }

    const identity = await db.authIdentity.findUnique({
      where: {
        provider_providerUserId: {
          provider,
          providerUserId: resolved.providerUserId,
        },
      },
    });

    let userId = identity?.userId;

    if (!userId) {
      const existingUser = await db.user.findUnique({ where: { email: resolved.email } });
      if (existingUser) {
        userId = existingUser.id;
      } else {
        const created = await db.user.create({
          data: {
            email: resolved.email,
            name: resolved.name || resolved.email.split("@")[0],
          },
        });
        userId = created.id;
      }
    }

    await db.authIdentity.upsert({
      where: {
        provider_providerUserId: {
          provider,
          providerUserId: resolved.providerUserId,
        },
      },
      update: {
        providerEmail: resolved.email || null,
        providerName: resolved.name || null,
        userId,
      },
      create: {
        provider,
        providerUserId: resolved.providerUserId,
        providerEmail: resolved.email || null,
        providerName: resolved.name || null,
        userId,
      },
    });

    return reply.send({
      method: provider,
      user: await fetchUserWithMemberships(db, userId),
    });
  });

  app.post("/auth/forgot-password/request", async (req, reply) => {
    const { email } = req.body ?? {};
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) return reply.code(400).send({ error: "email is required" });

    const user = await db.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      return reply.send({ sent: true, expiresInMinutes: passwordResetMinutes() });
    }

    await db.passwordResetCode.updateMany({
      where: { userId: user.id, consumedAt: null },
      data: { consumedAt: new Date() },
    });

    const code = generateNumericCode(6);
    await db.passwordResetCode.create({
      data: {
        userId: user.id,
        codeHash: hashValue(code),
        expiresAt: passwordResetExpiry(),
      },
    });

    if (resend && user.email) {
      await resend.emails.send({
        from: "CareLoop <care@updates.careloop.app>",
        to: user.email,
        subject: "Your CareLoop password reset code",
        html: `<p>Your CareLoop reset code is <strong>${code}</strong>.</p><p>It expires in ${passwordResetMinutes()} minutes.</p>`,
      });
    }

    return reply.send({
      sent: true,
      expiresInMinutes: passwordResetMinutes(),
      debugCode: resend || process.env.NODE_ENV === "production" ? undefined : code,
    });
  });

  app.post("/auth/forgot-password/verify", async (req, reply) => {
    const { email, code } = req.body ?? {};
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || !code) {
      return reply.code(400).send({ error: "email and code are required" });
    }

    const user = await db.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) return reply.code(404).send({ error: "Account not found" });

    const reset = await db.passwordResetCode.findFirst({
      where: {
        userId: user.id,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!reset || reset.codeHash !== hashValue(code)) {
      return reply.code(401).send({ error: "Invalid or expired code" });
    }

    return reply.send({ verified: true });
  });

  app.post("/auth/forgot-password/reset", async (req, reply) => {
    const { email, code, password } = req.body ?? {};
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || !code || !password || password.trim().length < 8) {
      return reply.code(400).send({ error: "email, code, and password (min 8 chars) are required" });
    }

    const user = await db.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) return reply.code(404).send({ error: "Account not found" });

    const reset = await db.passwordResetCode.findFirst({
      where: {
        userId: user.id,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!reset || reset.codeHash !== hashValue(code)) {
      return reply.code(401).send({ error: "Invalid or expired code" });
    }

    await db.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { passwordHash: hashPassword(password) },
      });
      await tx.passwordResetCode.updateMany({
        where: { userId: user.id, consumedAt: null },
        data: { consumedAt: new Date() },
      });
    });

    return reply.send({ reset: true });
  });
}
