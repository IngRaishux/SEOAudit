import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cx(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const focusRing = [
  // focus ring
  "focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
  "dark:focus:ring-blue-500 dark:focus:ring-offset-gray-950",
]

export const focusInput = [
  // focus
  "focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-opacity-50 dark:focus:ring-blue-900 dark:focus:ring-opacity-50 dark:focus:border-blue-400",
]

export const hasErrorInput = [
  // border color
  "border-red-500 dark:border-red-500",
  // ring
  "focus:ring-red-200 dark:focus:ring-red-900/50",
  // text color
  "text-red-700 dark:text-red-400",
  // placeholder
  "placeholder-red-200 dark:placeholder-red-800",
]
