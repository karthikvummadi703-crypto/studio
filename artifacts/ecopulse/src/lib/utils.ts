import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind class names, resolving conflicts via tailwind-merge.
 * @param inputs - Any number of clsx-compatible class values.
 * @returns A single deduplicated class string.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
