'use client';

import React from 'react';
import MediaGallery from './components/media-gallery';
import DashboardLayout from '@/components/dashboard-layout';
import { BreadcrumbItem } from '@/components/breadcrumb';

export default function MediaPage() {
    // Breadcrumb items
    const breadcrumbItems: BreadcrumbItem[] = [
        { label: "Media page" }
    ];
    return (
        <div className="container mx-auto py-8 px-4">
            <DashboardLayout
                breadcrumbItems={breadcrumbItems}
            >
                <MediaGallery />
            </DashboardLayout>
        </div>
    );
}