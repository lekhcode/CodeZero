import { AuthProvider, Gender, Prisma } from "@prisma/client";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "../../config/prisma.js";
import { env } from "../../config/env.js";
import { ApiError } from "../../utils/ApiError.js";
import type { LoginResult, OAuthAuthResult, OAuthPendingRegistrationResult } from "./auth.types.js";
import { establishUserSession } from "./auth.service.js";
import { toPublicUser, USER_PUBLIC_SELECT } from "./auth.user.js";
import { generateUniqueUsername, usernameBaseFromEmail } from "../../utils/username.js";
import { signOAuthPendingToken, verifyOAuthPendingToken } from "./oauth.pending.js";

export type OAuthIntent = "login" | "register";

type OAuthProfile = {
  email: string;
  name: string | null;
  avatar: string | null;
  provider: AuthProvider;
  googleId?: string;
  githubId?: string;
};

type GoogleProfile = {
  email: string;
  name: string | null;
  picture: string | null;
  googleId: string;
};

type GithubProfile = {
  email: string;
  name: string;
  avatar: string | null;
  githubId: string;
};

function pendingRegistration(profile: OAuthProfile): OAuthPendingRegistrationResult {
  const pendingToken = signOAuthPendingToken({
    email: profile.email,
    provider: profile.provider,
    googleId: profile.googleId ?? null,
    githubId: profile.githubId ?? null,
    name: profile.name,
    avatar: profile.avatar,
  });
  return {
    status: "pending_registration",
    pendingToken,
    email: profile.email,
    suggestedName: profile.name,
    avatar: profile.avatar,
    provider: profile.provider === AuthProvider.GITHUB ? "GITHUB" : "GOOGLE",
  };
}

async function loginExistingOAuthUser(profile: OAuthProfile): Promise<LoginResult> {
  const email = profile.email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      ...USER_PUBLIC_SELECT,
      googleId: true,
      githubId: true,
      provider: true,
    },
  });

  if (user === null) {
    throw new ApiError(404, "No account found for this email. Create an account first.", {
      code: "OAUTH_ACCOUNT_NOT_FOUND",
    });
  }

  const updates: Prisma.UserUpdateInput = {};
  if (profile.name && !user.name) updates.name = profile.name;
  if (profile.avatar && !user.avatar) updates.avatar = profile.avatar;
  if (profile.googleId && !user.googleId) updates.googleId = profile.googleId;
  if (profile.githubId && !user.githubId) updates.githubId = profile.githubId;
  if (user.provider === AuthProvider.EMAIL && profile.provider !== AuthProvider.EMAIL) {
    updates.provider = profile.provider;
  }
  if (!user.isEmailVerified) updates.isEmailVerified = true;
  if (!user.username) {
    updates.username = await generateUniqueUsername(usernameBaseFromEmail(email));
  }

  if (Object.keys(updates).length > 0) {
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: updates,
      select: USER_PUBLIC_SELECT,
    });
    return establishUserSession(toPublicUser(updated));
  }

  return establishUserSession(toPublicUser(user));
}

async function handleOAuthProfile(profile: OAuthProfile, intent: OAuthIntent): Promise<OAuthAuthResult> {
  const email = profile.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });

  if (intent === "login") {
    if (existing === null) {
      return pendingRegistration(profile);
    }
    return loginExistingOAuthUser(profile);
  }

  if (existing !== null) {
    throw new ApiError(409, "An account with this email already exists. Sign in instead.", {
      code: "OAUTH_ACCOUNT_EXISTS",
    });
  }

  return pendingRegistration(profile);
}

export async function completeOAuthRegistration(input: {
  pendingToken: string;
  fullName: string;
  country: string;
  gender: Gender;
  username?: string;
}): Promise<LoginResult> {
  const claims = verifyOAuthPendingToken(input.pendingToken);
  const email = claims.email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing !== null) {
    throw new ApiError(409, "An account with this email already exists. Sign in instead.", {
      code: "OAUTH_ACCOUNT_EXISTS",
    });
  }

  const username =
    input.username !== undefined && input.username.trim() !== ""
      ? input.username.trim()
      : await generateUniqueUsername(usernameBaseFromEmail(email));

  try {
    const created = await prisma.user.create({
      data: {
        email,
        name: claims.name,
        fullName: input.fullName.trim(),
        country: input.country.trim(),
        gender: input.gender,
        avatar: claims.avatar,
        provider: claims.provider,
        password: null,
        googleId: claims.googleId,
        githubId: claims.githubId,
        username,
        isEmailVerified: true,
      },
      select: USER_PUBLIC_SELECT,
    });
    return establishUserSession(toPublicUser(created));
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new ApiError(409, "An account with this email already exists. Sign in instead.", {
        code: "OAUTH_ACCOUNT_EXISTS",
      });
    }
    throw err;
  }
}

export async function loginWithGoogleCredential(
  credential: string,
  intent: OAuthIntent = "login",
): Promise<OAuthAuthResult> {
  if (env.GOOGLE_CLIENT_ID === "") {
    throw new ApiError(503, "Google OAuth is not configured", { code: "OAUTH_NOT_CONFIGURED" });
  }

  const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);
  let payload: GoogleProfile;

  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: env.GOOGLE_CLIENT_ID,
    });
    const data = ticket.getPayload();
    if (data?.email === undefined || data.sub === undefined) {
      throw new Error("Missing email or subject");
    }
    payload = {
      email: data.email,
      name: data.name ?? null,
      picture: data.picture ?? null,
      googleId: data.sub,
    };
  } catch {
    throw ApiError.unauthorized("Invalid Google sign-in");
  }

  return handleOAuthProfile(
    {
      email: payload.email,
      name: payload.name,
      avatar: payload.picture,
      provider: AuthProvider.GOOGLE,
      googleId: payload.googleId,
    },
    intent,
  );
}

async function fetchGithubProfile(accessToken: string): Promise<GithubProfile> {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "CodeZero-App",
  };

  const [profileRes, emailsRes] = await Promise.all([
    fetch("https://api.github.com/user", { headers }),
    fetch("https://api.github.com/user/emails", { headers }),
  ]);

  if (!profileRes.ok) {
    throw ApiError.unauthorized("Could not load GitHub profile");
  }

  const profile = (await profileRes.json()) as {
    id: number;
    login: string;
    name: string | null;
    avatar_url: string | null;
    email: string | null;
  };

  let email = profile.email?.trim().toLowerCase() ?? "";

  if (!email && emailsRes.ok) {
    const emails = (await emailsRes.json()) as Array<{
      email: string;
      primary: boolean;
      verified: boolean;
    }>;
    const primary = emails.find((e) => e.primary && e.verified) ?? emails.find((e) => e.verified);
    email = primary?.email?.trim().toLowerCase() ?? "";
  }

  if (!email) {
    throw ApiError.badRequest(
      "GitHub did not provide a verified email. Make your primary email visible in GitHub settings.",
    );
  }

  return {
    email,
    name: profile.name?.trim() || profile.login,
    avatar: profile.avatar_url,
    githubId: String(profile.id),
  };
}

function resolveGithubRedirectUri(override?: string): string {
  const requested = override?.trim() ?? "";
  if (requested === "") {
    return env.GITHUB_REDIRECT_URI;
  }
  if (env.GITHUB_REDIRECT_ALLOWLIST.includes(requested)) {
    return requested;
  }
  throw ApiError.badRequest("Invalid GitHub redirect_uri");
}

export async function loginWithGithubCode(
  code: string,
  redirectUriOverride?: string,
  intent: OAuthIntent = "login",
): Promise<OAuthAuthResult> {
  if (env.GITHUB_CLIENT_ID === "" || env.GITHUB_CLIENT_SECRET === "") {
    throw new ApiError(503, "GitHub OAuth is not configured", { code: "OAUTH_NOT_CONFIGURED" });
  }

  const redirectUri = resolveGithubRedirectUri(redirectUriOverride);

  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!tokenRes.ok) {
    throw ApiError.unauthorized("GitHub authorization failed");
  }

  const tokenData = (await tokenRes.json()) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };
  if (tokenData.access_token === undefined) {
    const ghError = tokenData.error ?? "";
    if (ghError === "bad_verification_code") {
      throw new ApiError(401, "This GitHub sign-in link was already used. Go back to login and try again.", {
        code: "GITHUB_CODE_REUSED",
      });
    }
    const detail = tokenData.error_description?.trim();
    throw new ApiError(
      401,
      detail && detail.length > 0 ? detail : (ghError || "GitHub authorization failed"),
      ghError ? { code: "GITHUB_OAUTH_ERROR" } : undefined,
    );
  }

  const githubProfile = await fetchGithubProfile(tokenData.access_token);

  return handleOAuthProfile(
    {
      email: githubProfile.email,
      name: githubProfile.name,
      avatar: githubProfile.avatar,
      provider: AuthProvider.GITHUB,
      githubId: githubProfile.githubId,
    },
    intent,
  );
}
