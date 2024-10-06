/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  let country = req.geo?.country;
  // Temporarily blocking traffic from Russia since I have too many requests from there.
  if (country === "RU") {
    return new NextResponse("Access Denied", { status: 403 });
  }

  // Allow the request to proceed
  return NextResponse.next();
}

// Optionally, specify paths to apply the middleware
export const config = {
  matcher: "/:path*", // Apply to all routes
};
