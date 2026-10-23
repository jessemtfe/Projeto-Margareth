import { createHash, randomBytes, randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import type { UserProfile, UserRole } from "@prisma/client";
import prisma from "./prisma";

export const AUTH_COOKIE = "ecocat_session";
export const SESSION_DURATION_MS = 12 * 60 * 60 * 1000;

export type AuthenticatedUser = {
  id: string;
  cognitoSub: string;
  email: string;
  name: string;
  role: UserRole;
  profile: UserProfile;
  cooperadoId: number | null;
  active: boolean;
};

function normalizeAdministrator(
  user: AuthenticatedUser,
): AuthenticatedUser {
  if (user.role !== "ADMIN") {
    return user;
  }

  return {
    ...user,
    profile: "PRESIDENTE",
  };
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function getAuthenticatedUser(
  sessionToken: string | undefined,
): Promise<AuthenticatedUser | null> {
  if (!sessionToken || !/^[A-Za-z0-9_-]{43}$/.test(sessionToken)) {
    return null;
  }

  const session = await prisma.authSession.findUnique({
    where: { tokenHash: hashToken(sessionToken) },
    select: {
      expiresAt: true,
      user: {
        select: {
          id: true,
          cognitoSub: true,
          email: true,
          name: true,
          role: true,
          profile: true,
          cooperadoId: true,
          active: true,
        },
      },
    },
  });

  if (!session || session.expiresAt <= new Date() || !session.user.active) {
    return null;
  }

  return normalizeAdministrator(session.user);
}

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const cookieStore = await cookies();
  return getAuthenticatedUser(cookieStore.get(AUTH_COOKIE)?.value);
}

export async function createAuthSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await prisma.authSession.create({
    data: {
      id: randomUUID(),
      tokenHash: hashToken(token),
      userId,
      expiresAt,
    },
  });

  return { token, expiresAt };
}

export async function deleteAuthSession(sessionToken: string | undefined) {
  if (!sessionToken || !/^[A-Za-z0-9_-]{43}$/.test(sessionToken)) {
    return;
  }

  await prisma.authSession.deleteMany({
    where: { tokenHash: hashToken(sessionToken) },
  });
}

export function hasRole(
  user: AuthenticatedUser,
  requiredRole: "VIEWER" | "EDITOR" | "ADMIN",
) {
  const roleRank = { VIEWER: 0, EDITOR: 1, ADMIN: 2 };
  return roleRank[user.role] >= roleRank[requiredRole];
}

export function hasProfile(
  user: AuthenticatedUser,
  ...profiles: UserProfile[]
) {
  return user.role === "ADMIN" || profiles.includes(user.profile);
}

export async function readJsonObject(
  request: Request,
): Promise<Record<string, unknown> | null> {
  let value: unknown;

  try {
    value = await request.json();
  } catch (error) {
    if (error instanceof SyntaxError) {
      return null;
    }
    throw error;
  }

  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}
