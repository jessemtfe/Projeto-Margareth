import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { readJsonObject } from "../../../../../lib/auth";
import { hashPassword } from "../../../../../lib/password";
import prisma from "../../../../../lib/prisma";

export const dynamic = "force-dynamic";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const body = await readJsonObject(request);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (
    !emailPattern.test(email) ||
    email.length > 255 ||
    !name ||
    name.length > 100 ||
    password.length < 8 ||
    password.length > 256
  ) {
    return NextResponse.json(
      {
        error:
          "Informe nome e e-mail válidos. A senha precisa ter pelo menos 8 caracteres.",
      },
      { status: 400 },
    );
  }

  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
    return NextResponse.json(
      { error: "A senha precisa ter uma letra maiúscula, uma minúscula e um número." },
      { status: 400 },
    );
  }

  const existingAccount = await prisma.userAccount.findUnique({ where: { email } });
  if (existingAccount) {
    return NextResponse.json(
      { error: "Não foi possível iniciar o cadastro. Tente entrar ou confira o e-mail." },
      { status: 409 },
    );
  }

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const isAdministrator = Boolean(adminEmail && email === adminEmail);
  await prisma.userAccount.create({
    data: {
      cognitoSub: randomUUID(),
      email,
      name,
      passwordHash: await hashPassword(password),
      role: isAdministrator ? "ADMIN" : "VIEWER",
      profile: isAdministrator ? "PRESIDENTE" : "COOPERADO",
      active: isAdministrator,
    },
  });

  return NextResponse.json(
    {
      message: isAdministrator
        ? "Conta administradora criada. Você já pode entrar."
        : "Cadastro concluído. Aguarde a liberação da pessoa administradora.",
      destination: email,
    },
    { status: 201 },
  );
}
