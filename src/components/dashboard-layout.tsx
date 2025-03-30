import React, { ReactNode } from 'react';
import Breadcrumb, { BreadcrumbItem } from './breadcrumb';

interface DashboardLayoutProps {
    children: ReactNode;
    breadcrumbItems: BreadcrumbItem[];
    title?: string;
    actions?: ReactNode;
}

export default function DashboardLayout({
    children,
    breadcrumbItems,
    title,
    actions
}: DashboardLayoutProps) {
    return (
        <div className="container mx-auto py-6 max-w-6xl">
            {/* Breadcrumb */}
            <Breadcrumb items={breadcrumbItems} />

            {(title || actions) && (
                <div className="flex items-center justify-between mb-6">
                    {title && <h1 className="text-3xl font-bold">{title}</h1>}
                    {actions && <div className="flex items-center space-x-2">{actions}</div>}
                </div>
            )}

            {/* Main content */}
            {children}
        </div>
    );
}