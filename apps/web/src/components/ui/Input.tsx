import * as React from "react";
import { cn } from "@/lib/utils";

type Props = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, Props>(
  ({ className, type = "text", ...rest }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "flex h-12 w-full rounded-[1.75rem] border border-border/40 bg-card/85 px-5 text-sm text-foreground/80 shadow-[0_1px_0_rgba(255,255,255,0.35),0_22px_55px_-40px_rgba(88,47,16,0.28)] transition-colors placeholder:text-foreground/45 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background dark:border-border/40 dark:bg-card/40 dark:text-foreground/85 dark:placeholder:text-foreground/60 dark:shadow-[0_1px_0_rgba(255,255,255,0.08),0_22px_65px_-42px_rgba(8,4,1,0.6)] disabled:cursor-not-allowed disabled:opacity-60 supports-[backdrop-filter]:backdrop-blur-xl",
        className,
      )}
      {...rest}
    />
  ),
);

Input.displayName = "Input";
