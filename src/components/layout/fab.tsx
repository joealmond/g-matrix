'use client';

import { Button, type ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Slot } from '@radix-ui/react-slot';
import React from 'react';

const Fab = React.forwardRef<
  HTMLButtonElement,
  ButtonProps & { asChild?: boolean }
>(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : Button;
  return (
    <Comp
      ref={ref}
      className={cn(
        'fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-40',
        className
      )}
      size="icon"
      {...props}
    />
  );
});

Fab.displayName = 'Fab';

export { Fab };
