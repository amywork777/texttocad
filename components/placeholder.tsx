"use client";

// This is a simple placeholder to ensure component imports work during build
import React from 'react';

export const PlaceholderButton = ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  return <button {...props}>{children}</button>;
};

export const PlaceholderCard = ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return <div {...props}>{children}</div>;
};

export const PlaceholderCardContent = ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return <div {...props}>{children}</div>;
};

export const PlaceholderCardHeader = ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return <div {...props}>{children}</div>;
};

export const PlaceholderCardTitle = ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => {
  return <h3 {...props}>{children}</h3>;
};

export const PlaceholderCardDescription = ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => {
  return <p {...props}>{children}</p>;
};

export const PlaceholderCardFooter = ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return <div {...props}>{children}</div>;
};

export const PlaceholderTextarea = ({ ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => {
  return <textarea {...props} />;
};

export const PlaceholderTabs = ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return <div {...props}>{children}</div>;
};

export const PlaceholderTabsContent = ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return <div {...props}>{children}</div>;
};

export const PlaceholderTabsList = ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return <div {...props}>{children}</div>;
};

export const PlaceholderTabsTrigger = ({ children, ...props }: React.HTMLAttributes<HTMLButtonElement>) => {
  return <button {...props}>{children}</button>;
}; 