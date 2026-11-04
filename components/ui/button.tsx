import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import { Slot } from "radix-ui";

// Buttons per DESIGN.md §2.3: pill shape, 48px default height, Medium weight.
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 font-medium whitespace-nowrap transition-colors outline-none select-none focus-visible:ring-3 focus-visible:ring-focus-ring disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "rounded-pill bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-600 disabled:bg-line disabled:text-muted-text",
        secondary:
          "rounded-pill border-[1.5px] border-brand-500 bg-white text-brand-600 hover:bg-brand-50 disabled:border-transparent disabled:bg-line disabled:text-muted-text",
        neutral:
          "rounded-pill border-[1.5px] border-line bg-white text-ink hover:bg-mist disabled:border-transparent disabled:bg-line disabled:text-muted-text",
        link: "rounded-menu text-brand-600 underline-offset-4 hover:underline disabled:text-muted-text",
        icon: "rounded-menu border-[1.5px] border-line bg-white text-ink hover:bg-mist disabled:text-muted-text",
      },
      size: {
        default: "h-12 px-6 text-body [&_svg:not([class*='size-'])]:size-5",
        sm: "h-9 px-4 text-small [&_svg:not([class*='size-'])]:size-4",
        icon: "size-7 [&_svg:not([class*='size-'])]:size-4",
        inline: "h-auto p-0 text-small [&_svg:not([class*='size-'])]:size-4",
      },
      tone: {
        default: "",
        danger: "text-error",
      },
    },
    compoundVariants: [
      { variant: "link", size: "default", class: "h-auto px-0" },
      { variant: "link", size: "sm", class: "h-auto px-0" },
    ],
    defaultVariants: {
      variant: "primary",
      size: "default",
      tone: "default",
    },
  }
);

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

function Button({ className, variant, size, tone, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, tone }), className)}
      {...props}
    />
  );
}

export { Button, buttonVariants };
