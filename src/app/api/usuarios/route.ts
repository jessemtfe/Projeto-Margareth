import { NextResponse } from "next/server";
import { getCurrentUser, hasProfile, readJsonObject } from "../../../../lib/auth";
import prisma from "../../../../lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });
  }
  if (!hasProfile(currentUser, "PRESIDENTE")) {
    return NextResponse.json({ error: "Acesso restrito à administração." }, { status: 403 });
  }

  const users = await prisma.userAccount.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      profile: true,
      cooperadoId: true,
      active: true,
      createdAt: true,
    },
  });

  return NextResponse.json(users);
}

export async function PATCH(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });
  }
  if (!hasProfile(currentUser, "PRESIDENTE")) {
    return NextResponse.json({ error: "Acesso restrito à administração." }, { status: 403 });
  }

  const body = await readJsonObject(request);
  const id = typeof body?.id === "string" ? body.id : "";
  const role = body?.role;
  const profile = body?.profile;
  const cooperadoId = body?.cooperadoId;
  const active = body?.active;

  if (
    !id ||
    (role !== "EDITOR" && role !== "VIEWER") ||
    (profile !== "COOPERADO" &&
      profile !== "BALANCEIRO" &&
      profile !== "PRESIDENTE") ||
    (cooperadoId !== null &&
      (typeof cooperadoId !== "number" ||
        !Number.isSafeInteger(cooperadoId) ||
        cooperadoId <= 0)) ||
    typeof active !== "boolean"
  ) {
    return NextResponse.json(
      { error: "Informe o usuário, o perfil e o estado da conta." },
      { status: 400 },
    );
  }
  if (id === currentUser.id) {
    return NextResponse.json(
      { error: "A conta administradora atual não pode ser alterada por aqui." },
      { status: 400 },
    );
  }

  const existing = await prisma.userAccount.findUnique({
    where: { id },
    select: { id: true, role: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
  }
  if (existing.role === "ADMIN" && existing.id !== currentUser.id) {
    return NextResponse.json(
      { error: "O perfil de administração não pode ser concedido ou removido por esta tela." },
      { status: 403 },
    );
  }

  const updated = await prisma.userAccount.update({
    where: { id },
    data: {
      role,
      profile,
      cooperadoId,
      active,
    },
    select: { id: true, role: true, profile: true, cooperadoId: true, active: true },
  });

  return NextResponse.json(updated);
}
