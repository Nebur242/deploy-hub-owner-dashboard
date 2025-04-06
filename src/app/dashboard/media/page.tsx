'use client';

import React from 'react';
import MediaGallery from './components/media-gallery';
import DashboardLayout from '@/components/dashboard-layout';
import { BreadcrumbItem } from '@/components/breadcrumb';

/**
 * Renders the media page layout with dashboard navigation and a styled media gallery.
 *
 * The MediaPage component constructs a page layout by passing a breadcrumb labeled "Media page" to the dashboard layout.
 * A styled container wraps the MediaGallery component to enhance its visual presentation.
 */
export default function MediaPage() {
    // Breadcrumb items
    const breadcrumbItems: BreadcrumbItem[] = [
        { label: "Media page" }
    ];
    return (
        <div className="container mx-auto py-6">
            <DashboardLayout
                breadcrumbItems={breadcrumbItems}
            >
                <div className="bg-background rounded-lg shadow-sm border p-6">
                    <MediaGallery />
                </div>
            </DashboardLayout>
        </div>
    );
}