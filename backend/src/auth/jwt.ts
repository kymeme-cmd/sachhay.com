// ============================================================
// JWT access & refresh tokens with jose
// ============================================================

import { SignJWT, jwtVerify } from "jose";
import type { JWTPayload, RefreshTokenPayload } from "../types";

function encodeSecret(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

export async function signAccessToken(
  payload: JWTPayload,
  secret: string,
  expiresIn: string
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(expiresIn)
    .sign(encodeSecret(secret));
}

export async function signRefreshToken(
  payload: RefreshTokenPayload,
  secret: string,
  expiresIn: string
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(expiresIn)
    .sign(encodeSecret(secret));
}

export async function verifyAccessToken(token: string, secret: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, encodeSecret(secret));
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(token: string, secret: string): Promise<RefreshTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, encodeSecret(secret));
    return payload as unknown as RefreshTokenPayload;
  } catch {
    return null;
  }
}