// middleware.js
import { NextResponse } from "next/server";
import { headers } from "next/headers";

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

  const location = await fetch(
    `http://api.ipstack.com/${ip}?access_key=${process.env.IPSTACK_API_KEY}`,
  ).then((res) => res.json());

  console.log(location.country_code);

  if (location.country_code === "RU") {
    return new NextResponse("Access Denied", { status: 403 });
  }

  // Allow the request to proceed
  return NextResponse.next();
}

// Optionally, specify paths to apply the middleware
export const config = {
  matcher: "/:path*", // Apply to all routes
};
