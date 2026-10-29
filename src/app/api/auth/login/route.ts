import { NextResponse } from "next/server";
import { AUTH_COOKIE, createAuthSession, readJsonObject } from "../../../../../lib/auth";
import { verifyPassword } from "../../../../../lib/password";
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

  const account = await prisma.userAccount.findUnique({ where: { email } });
  if (!account || !(await verifyPassword(password, account.passwordHash))) {
    return NextResponse.json(
      { error: "E-mail ou senha incorretos." },
      { status: 401 },
    );
  }

  if (!account.active) {
    return NextResponse.json(
      { error: "Sua conta foi criada e aguarda liberação da pessoa administradora." },
      { status: 403 },
    );
  }

  let linkedAccount = account;
  if (linkedAccount.role !== "ADMIN" && linkedAccount.profile === "COOPERADO" && !linkedAccount.cooperadoId) {
    const matchingCooperados = await prisma.cadastroCooperados.findMany({
      where: { nome: account.name, conta: null },
      select: { idCooperado: true },
      take: 2,
    });
    const cooperadoId =
      matchingCooperados.length === 1
        ? matchingCooperados[0].idCooperado
        : (
            await prisma.cadastroCooperados.create({
              data: {
                nome: account.name,
                horas: 0,
                domingo: 0,
                kgTriados: 0,
                situacao: "Ativo",
                origem: "AUTOMATICO",
              },
              select: { idCooperado: true },
            })
          ).idCooperado;
    if (cooperadoId) {
      linkedAccount = await prisma.userAccount.update({
        where: { id: account.id },
        data: { cooperadoId },
      });
    }
  }

  const session = await createAuthSession(linkedAccount.id);
  const effectiveProfile = linkedAccount.role === "ADMIN" ? "PRESIDENTE" : linkedAccount.profile;
  const response = NextResponse.json({
    user: {
      name: linkedAccount.name,
      email: linkedAccount.email,
      role: linkedAccount.role,
      profile: effectiveProfile,
      cooperadoId: linkedAccount.cooperadoId,
    },
  });
  response.cookies.set(AUTH_COOKIE, session.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
  return response;
}
