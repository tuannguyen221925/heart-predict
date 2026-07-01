import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { query } from "./db";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "heartguard_secret_2026"
);

export interface User {
  id: number;
  email: string;
  full_name: string;
  created_at: Date;
}

interface UserRow {
  id: number;
  email: string;
  password: string;
  full_name: string;
  created_at: Date;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export async function createToken(userId: number): Promise<string> {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<{ userId: number } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return { userId: payload.userId as number };
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    return null;
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return null;
  }

  const users = await query<UserRow[]>(
    "SELECT id, email, full_name, created_at FROM users WHERE id = ?",
    [payload.userId]
  );

  if (users.length === 0) {
    return null;
  }

  return users[0];
}

export async function login(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string; user?: User }> {
  const users = await query<UserRow[]>(
    "SELECT * FROM users WHERE email = ?",
    [email]
  );

  if (users.length === 0) {
    return { success: false, error: "Invalid email or password" };
  }

  const user = users[0];
  const isValid = await verifyPassword(password, user.password);

  if (!isValid) {
    return { success: false, error: "Invalid email or password" };
  }

  const token = await createToken(user.id);
  const cookieStore = await cookies();
  cookieStore.set("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      created_at: user.created_at,
    },
  };
}

export async function register(
  email: string,
  password: string,
  fullName: string
): Promise<{ success: boolean; error?: string; user?: User }> {
  // Check if email exists
  const existingUsers = await query<UserRow[]>(
    "SELECT id FROM users WHERE email = ?",
    [email]
  );

  if (existingUsers.length > 0) {
    return { success: false, error: "Email already exists" };
  }

  const hashedPassword = await hashPassword(password);

  const result = await query<{ insertId: number }>(
    "INSERT INTO users (email, password, full_name) VALUES (?, ?, ?)",
    [email, hashedPassword, fullName]
  );

  const userId = (result as unknown as { insertId: number }).insertId;

  const token = await createToken(userId);
  const cookieStore = await cookies();
  cookieStore.set("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return {
    success: true,
    user: {
      id: userId,
      email,
      full_name: fullName,
      created_at: new Date(),
    },
  };
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("auth_token");
}
