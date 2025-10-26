import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const easing = {
  standard: [0.2, 0.8, 0.2, 1],
  spring: { stiffness: 160, damping: 18, mass: 1 },
};

export function formatNumber(num: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 1,
  }).format(num);
}
