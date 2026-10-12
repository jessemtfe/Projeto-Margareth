import { NextResponse } from "next/server";
import { CognitoError, confirmCognitoSignUp } from "../../../../../lib/cognito";
import { readJsonObject } from "../../../../../lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await readJsonObject(request);
  const email =
    typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const code = typeof body?.code === "string" ? body.code.trim() : "";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^\d{6}$/.test(code)) {
    return NextResponse.json(
      { error: "Informe o e-mail e o código de seis dígitos enviados para ele." },
      { status: 400 },
    );
  }

  try {
    await confirmCognitoSignUp(email, code);
    return NextResponse.json({
      message: "E-mail confirmado. Agora você já pode entrar.",
    });
  } catch (error) {
    if (!(error instanceof CognitoError)) {
      throw error;
    }

    if (
      error.code === "CodeMismatchException" ||
      error.code === "ExpiredCodeException" ||
      error.code === "InvalidParameterException"
    ) {
      return NextResponse.json(
        { error: "Código inválido ou expirado. Confira o código e tente novamente." },
        { status: 400 },
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
