"use client";

// This file provides fallback components in case the path resolution fails
import React from 'react';

// Re-export components from relative paths
export const Button = React.lazy(() => import('../components/ui/button').then(module => ({ default: module.Button })));
export const Card = React.lazy(() => import('../components/ui/card').then(module => ({ default: module.Card })));
export const CardContent = React.lazy(() => import('../components/ui/card').then(module => ({ default: module.CardContent })));
export const CardHeader = React.lazy(() => import('../components/ui/card').then(module => ({ default: module.CardHeader })));
export const CardTitle = React.lazy(() => import('../components/ui/card').then(module => ({ default: module.CardTitle })));
export const CardDescription = React.lazy(() => import('../components/ui/card').then(module => ({ default: module.CardDescription })));
export const CardFooter = React.lazy(() => import('../components/ui/card').then(module => ({ default: module.CardFooter })));
export const Textarea = React.lazy(() => import('../components/ui/textarea').then(module => ({ default: module.Textarea })));
export const Tabs = React.lazy(() => import('../components/ui/tabs').then(module => ({ default: module.Tabs })));
export const TabsContent = React.lazy(() => import('../components/ui/tabs').then(module => ({ default: module.TabsContent })));
export const TabsList = React.lazy(() => import('../components/ui/tabs').then(module => ({ default: module.TabsList })));
export const TabsTrigger = React.lazy(() => import('../components/ui/tabs').then(module => ({ default: module.TabsTrigger }))); 