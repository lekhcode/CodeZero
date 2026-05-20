import { AuthProvider, Prisma } from "@prisma/client";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "../../config/prisma.js";
import { env } from "../../config/env.js";
import { ApiError } from "../../utils/ApiError.js";
import type { LoginResult } from "./auth.types.js";
import { establishUserSession } from "./auth.service.js";
import { toPublicUser, USER_PUBLIC_SELECT } from "./auth.user.js";
import { generateUniqueUsername, usernameBaseFromEmail } from "../../utils/username.js";

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

async function findOrCreateOAuthUser(profile: {
  email: string;
  name: string | null;
  avatar: string | null;
  provider: AuthProvider;
  googleId?: string;
  githubId?: string;
}): Promise<LoginResult> {
  const email = profile.email.trim().toLowerCase();

  let user = await prisma.user.findUnique({
    where: { email },
    select: {
      ...USER_PUBLIC_SELECT,
      googleId: true,
      githubId: true,
      provider: true,
    },
  });

  if (user === null) {
    const username = await generateUniqueUsername(usernameBaseFromEmail(email));
    try {
      const created = await prisma.user.create({
        data: {
          email,
          name: profile.name,
          avatar: profile.avatar,
          provider: profile.provider,
          password: null,
          googleId: profile.googleId ?? null,
          githubId: profile.githubId ?? null,
          username,
          isEmailVerified: true,
        },
        select: USER_PUBLIC_SELECT,
      });
      return establishUserSession(toPublicUser(created));
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        user = await prisma.user.findUnique({
          where: { email },
          select: {
            ...USER_PUBLIC_SELECT,
            googleId: true,
            githubId: true,
            provider: true,
          },
        });
      } else {
        throw err;
      }
    }
  }

  if (user === null) {
    throw new ApiError(500, "Could not create or load user", { code: "INTERNAL_ERROR" });
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

export async function loginWithGoogleCredential(credential: string): Promise<LoginResult> {
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

  return findOrCreateOAuthUser({
    email: payload.email,
    name: payload.name,
    avatar: payload.picture,
    provider: AuthProvider.GOOGLE,
    googleId: payload.googleId,
  });
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

export async function loginWithGithubCode(code: string): Promise<LoginResult> {
  if (env.GITHUB_CLIENT_ID === "" || env.GITHUB_CLIENT_SECRET === "") {
    throw new ApiError(503, "GitHub OAuth is not configured", { code: "OAUTH_NOT_CONFIGURED" });
  }

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
    }),
  });

  if (!tokenRes.ok) {
    throw ApiError.unauthorized("GitHub authorization failed");
  }

  const tokenData = (await tokenRes.json()) as { access_token?: string; error?: string };
  if (tokenData.access_token === undefined) {
    throw ApiError.unauthorized(tokenData.error ?? "GitHub authorization failed");
  }

  const githubProfile = await fetchGithubProfile(tokenData.access_token);

  return findOrCreateOAuthUser({
    email: githubProfile.email,
    name: githubProfile.name,
    avatar: githubProfile.avatar,
    provider: AuthProvider.GITHUB,
    githubId: githubProfile.githubId,
  });
}
