
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions, isAdminEmail } from "@/lib/auth";

export async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
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

  if (!isAdminEmail(session.user.email)) {
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
    email: session.user.email,
  };
}
