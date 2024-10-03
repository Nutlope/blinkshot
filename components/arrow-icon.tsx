import React from "react";
import { ComponentProps } from "react";

export default function ArrowIcon(props: ComponentProps<"svg">) {
  return (
    <svg
      width={22}
      height={22}
      viewBox="0 0 22 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        opacity={0.9}
        d="M6.6 12.317l3.85 2.21V12.87h4.95V9l-1.65 1.105v1.106h-3.3V9.553L6.6 12.317z"
        fill="#151515"
      />
    </svg>
  );
}
