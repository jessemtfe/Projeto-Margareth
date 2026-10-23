import { NextResponse } from "next/server";
import { AUTH_COOKIE, createAuthSession, readJsonObject } from "../../../../../lib/auth";
import { CognitoError, signInWithCognito } from "../../../../../lib/cognito";
import prisma from "../../../../../lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await readJsonObject(request);
  const email =
    typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password || password.length > 256) {
    return NextResponse.json(
      { error: "Informe um e-mail e uma senha válidos." },
      { status: 400 },
    );
  }

  try {
    const identity = await signInWithCognito(email, password);
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();

    if (!adminEmail) {
      throw new Error("ADMIN_EMAIL must be configured.");
    }

    let account = await prisma.userAccount.upsert({
      where: { cognitoSub: identity.sub },
      create: {
        cognitoSub: identity.sub,
        email: identity.email,
        name: identity.name,
        role: identity.email === adminEmail ? "ADMIN" : "VIEWER",
        profile: identity.email === adminEmail ? "PRESIDENTE" : "COOPERADO",
      },
      update: {
        email: identity.email,
        name: identity.name,
      },
    });

    if (
      identity.email === adminEmail &&
      (account.role !== "ADMIN" || account.profile !== "PRESIDENTE")
    ) {
      account = await prisma.userAccount.update({
        where: { id: account.id },
        data: { role: "ADMIN", profile: "PRESIDENTE" },
      });
    }

    if (account.role !== "ADMIN" && account.profile === "COOPERADO" && !account.cooperadoId) {
      const matchingCooperados = await prisma.cadastroCooperados.findMany({
        where: { nome: account.name, conta: null },
        select: { idCooperado: true },
        take: 2,
      });
      if (matchingCooperados.length === 1) {
        account = await prisma.userAccount.update({
          where: { id: account.id },
          data: { cooperadoId: matchingCooperados[0].idCooperado },
        });
      }
    }

    if (!account.active) {
      return NextResponse.json(
        { error: "Esta conta está desativada. Procure a pessoa administradora." },
        { status: 403 },
      );
    }

    const session = await createAuthSession(account.id);
    const effectiveProfile = account.role === "ADMIN" ? "PRESIDENTE" : account.profile;
    const response = NextResponse.json({
      user: {
        name: account.name,
        email: account.email,
        role: account.role,
        profile: effectiveProfile,
        cooperadoId: account.cooperadoId,
      },
    });
    response.cookies.set(AUTH_COOKIE, session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
    return response;
  } catch (error) {
    if (!(error instanceof CognitoError)) {
      throw error;
    }

    if (
      error.code === "NotAuthorizedException" ||
      error.code === "UserNotFoundException"
    ) {
      return NextResponse.json(
        { error: "E-mail ou senha incorretos." },
        { status: 401 },
      );
    }

    if (error.code === "UserNotConfirmedException" || error.code === "EmailNotVerifiedException") {
      return NextResponse.json(
        { error: "Confirme seu e-mail pelo código enviado antes de entrar." },
        { status: 403 },
      );
    }

    if (error.code === "TooManyRequestsException" || error.code === "LimitExceededException") {
      return NextResponse.json(
        { error: "Muitas tentativas. Aguarde um pouco e tente novamente." },
        { status: 429 },
      );
    }

    throw error;
  }
}
