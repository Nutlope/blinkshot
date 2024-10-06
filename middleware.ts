/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import geoip from "fast-geoip";

function getIPAddress() {
  const FALLBACK_IP_ADDRESS = "0.0.0.0";
  const forwardedFor = headers().get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0] ?? FALLBACK_IP_ADDRESS;
  }

  return headers().get("x-real-ip") ?? FALLBACK_IP_ADDRESS;
}

export async function middleware(req: Request) {
  const ip = getIPAddress();

  let headersList = headers();
  console.log({ headersList });

  let country = headersList.get("x-country");
  console.log({ country });

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
