import { NextResponse } from "next/server";
import { CognitoError, signUpWithCognito } from "../../../../../lib/cognito";
import { readJsonObject } from "../../../../../lib/auth";

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

  try {
    const result = await signUpWithCognito(email, password, name);
    const deliveryDetails = result.CodeDeliveryDetails;
    const destination =
      deliveryDetails !== null &&
      typeof deliveryDetails === "object" &&
      "Destination" in deliveryDetails &&
      typeof deliveryDetails.Destination === "string"
        ? deliveryDetails.Destination
        : email;

    return NextResponse.json(
      {
        message: "Enviamos um código de confirmação para o seu e-mail.",
        destination,
      },
      { status: 201 },
    );
  } catch (error) {
    if (!(error instanceof CognitoError)) {
      throw error;
    }

    if (error.code === "UsernameExistsException") {
      return NextResponse.json(
        { error: "Não foi possível iniciar o cadastro. Tente entrar ou confira o e-mail." },
        { status: 409 },
      );
    }

    if (error.code === "InvalidPasswordException") {
      return NextResponse.json(
        {
          error:
            "A senha precisa ter pelo menos 8 caracteres, uma letra maiúscula, uma minúscula e um número.",
        },
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
