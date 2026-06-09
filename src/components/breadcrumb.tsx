import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
    readonly label: string;
    readonly href?: string;
}

interface BreadcrumbProps {
    readonly items: readonly BreadcrumbItem[];
    readonly homeHref?: string;
}

export default function Breadcrumb({ items, homeHref = '/dashboard' }: BreadcrumbProps) {
    const breadcrumbItems = items[0]?.label === 'Dashboard' && (!items[0]?.href || items[0].href === homeHref)
        ? items.slice(1)
        : items;

    return (
        <nav className="flex mb-4" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-2">
                <li className="inline-flex items-center">
                    <Link
                        href={homeHref}
                        className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
                    >
                        <Home className="h-4 w-4 mr-2" />
                        Dashboard
                    </Link>
                </li>

                {breadcrumbItems.map((item, index) => (
                    <li key={item.href ?? item.label} className="flex items-center">
                        <ChevronRight className="h-4 w-4 text-muted-foreground mx-1" />
                        {item.href && index !== breadcrumbItems.length - 1 ? (
                            <Link
                                href={item.href}
                                className="text-sm font-medium text-muted-foreground hover:text-foreground ml-1"
                            >
                                {item.label}
                            </Link>
                        ) : (
                            <span className="text-sm font-medium text-foreground ml-1">
                                {item.label}
                            </span>
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    );
}