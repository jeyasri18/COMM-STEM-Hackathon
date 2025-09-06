import React, { useState, useRef, useEffect } from 'react';
import { cn } from './utils';

export function Select({ value, onValueChange, children, ...props }) {
  return (
    <div className="relative" {...props}>
      {children}
    </div>
  );
}

export function SelectTrigger({ className, children, ...props }) {
  return (
    <button
      className={cn(
        "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function SelectValue({ placeholder, ...props }) {
  return (
    <span className="text-left" {...props}>
      {placeholder}
    </span>
  );
}

export function SelectContent({ className, children, ...props }) {
  return (
    <div
      className={cn(
        "relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function SelectItem({ className, children, value, onSelect, ...props }) {
  return (
    <div
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      onClick={() => onSelect && onSelect(value)}
      {...props}
    >
      {children}
    </div>
  );
}
