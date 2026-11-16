
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

const adminEmails = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export async function requireAdmin(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const email =
    typeof token?.email === "string" ? token.email : null;

  if (!email) {
    return {
      authorized: false as const,
      response: NextResponse.json(
        {
          success: false,
          message: "Authentication required.",
        },
        { status: 401 }
      ),
    };
  }

  if (!adminEmails.includes(email.trim().toLowerCase())) {
    return {
      authorized: false as const,
      response: NextResponse.json(
        {
          success: false,
          message: "Administrator access required.",
        },
        { status: 403 }
      ),
    };
  }

  return {
    authorized: true as const,
    email,
  };
}
