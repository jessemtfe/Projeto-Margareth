type CognitoRecord = Record<string, unknown>;

type CognitoUserAttribute = {
  Name: string;
  Value: string;
};

export class CognitoError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "CognitoError";
  }
}

function isRecord(value: unknown): value is CognitoRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function cognitoSettings() {
  const region = process.env.COGNITO_REGION;
  const clientId = process.env.COGNITO_CLIENT_ID;

  if (!region || !clientId) {
    throw new Error("COGNITO_REGION and COGNITO_CLIENT_ID must be configured.");
  }

  return {
    endpoint: `https://cognito-idp.${region}.amazonaws.com/`,
    clientId,
  };
}

async function cognitoRequest(
  target: string,
  body: CognitoRecord,
): Promise<CognitoRecord> {
  const { endpoint } = cognitoSettings();
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-amz-json-1.1",
      "X-Amz-Target": `AWSCognitoIdentityProviderService.${target}`,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const result: unknown = await response.json();

  if (!isRecord(result)) {
    throw new Error("Cognito returned an unexpected response.");
  }

  if (!response.ok) {
    const rawCode = typeof result.__type === "string" ? result.__type : "UnknownError";
    const code = rawCode.split("#").at(-1)?.split(":").at(-1) ?? "UnknownError";
    const message =
      typeof result.message === "string" ? result.message : "Authentication request failed.";
    throw new CognitoError(code, message);
  }

  return result;
}

export async function signUpWithCognito(
  email: string,
  password: string,
  name: string,
) {
  const { clientId } = cognitoSettings();
  return cognitoRequest("SignUp", {
    ClientId: clientId,
    Username: email,
    Password: password,
    UserAttributes: [
      { Name: "email", Value: email },
      { Name: "name", Value: name },
    ],
  });
}

export async function confirmCognitoSignUp(email: string, code: string) {
  const { clientId } = cognitoSettings();
  return cognitoRequest("ConfirmSignUp", {
    ClientId: clientId,
    Username: email,
    ConfirmationCode: code,
  });
}

export async function signInWithCognito(email: string, password: string) {
  const { clientId } = cognitoSettings();
  const result = await cognitoRequest("InitiateAuth", {
    AuthFlow: "USER_PASSWORD_AUTH",
    ClientId: clientId,
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password,
    },
  });

  if (!isRecord(result.AuthenticationResult)) {
    throw new Error("Cognito did not return an authenticated session.");
  }

  const accessToken = result.AuthenticationResult.AccessToken;
  if (typeof accessToken !== "string") {
    throw new Error("Cognito did not return an access token.");
  }

  const userResult = await cognitoRequest("GetUser", {
    AccessToken: accessToken,
  });
  const attributes: CognitoUserAttribute[] = Array.isArray(userResult.UserAttributes)
    ? userResult.UserAttributes.filter(
        (attribute): attribute is CognitoUserAttribute =>
          isRecord(attribute) &&
          typeof attribute.Name === "string" &&
          typeof attribute.Value === "string",
      )
    : [];
  const attributeMap = new Map(
    attributes.map((attribute) => [attribute.Name, attribute.Value]),
  );
  const sub = attributeMap.get("sub");
  const verifiedEmail = attributeMap.get("email");

  if (
    !sub ||
    !verifiedEmail ||
    attributeMap.get("email_verified") !== "true" ||
    verifiedEmail.toLowerCase() !== email
  ) {
    throw new CognitoError(
      "EmailNotVerifiedException",
      "Confirme o e-mail antes de entrar.",
    );
  }

  return {
    sub,
    email: verifiedEmail.toLowerCase(),
    name: attributeMap.get("name") ?? verifiedEmail,
  };
}
