"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { IconDownload } from "@tabler/icons-react";
import DashboardLayout from "@/components/dashboard-layout";
import { BreadcrumbItem } from "@/components/breadcrumb";
import Link from "next/link";

export default function ChangelogPage() {
    // Get the current date for display
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    // Breadcrumb items
    const breadcrumbItems: BreadcrumbItem[] = [{ label: "Changelog" }];

    // Action buttons for the header
    const actionButtons = (
        <Button variant="outline" asChild>
            <Link href="/dashboard/help">
                <IconDownload className="h-4 w-4 mr-2" /> PDF Version
            </Link>
        </Button>
    );

    return (
        <DashboardLayout
            breadcrumbItems={breadcrumbItems}
            title="Changelog"
            actions={actionButtons}
        >
            <div className="flex flex-col gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Product Updates</CardTitle>
                        <CardDescription>
                            All notable changes to Deploy Hub will be documented here. Last updated: {formattedDate}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[600px] pr-4">
                            <div className="space-y-8">
                                {/* Latest release */}
                                <div className="relative pl-8 before:absolute before:left-0 before:top-2 before:h-full before:w-[2px] before:bg-muted">
                                    <div className="absolute left-0 top-2 h-4 w-4 rounded-full bg-primary"></div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-lg font-medium">Version 2.4.0</h3>
                                            <Badge>Latest</Badge>
                                            <span className="text-sm text-muted-foreground">April 20, 2025</span>
                                        </div>
                                        <p className="text-muted-foreground">Enhanced deployment features and improved UI</p>
                                        <div className="rounded-md border p-4 mt-3">
                                            <h4 className="font-medium mb-2">New Features</h4>
                                            <ul className="list-disc pl-5 space-y-1">
                                                <li>Added multi-region deployment options</li>
                                                <li>Implemented real-time deployment metrics dashboard</li>
                                                <li>Added support for custom domain verification</li>
                                            </ul>

                                            <h4 className="font-medium mt-4 mb-2">Improvements</h4>
                                            <ul className="list-disc pl-5 space-y-1">
                                                <li>Enhanced user interface for license management</li>
                                                <li>Optimized API response times by 40%</li>
                                                <li>Improved project creation workflow</li>
                                            </ul>

                                            <h4 className="font-medium mt-4 mb-2">Bug Fixes</h4>
                                            <ul className="list-disc pl-5 space-y-1">
                                                <li>Fixed issue with pagination in orders list</li>
                                                <li>Resolved authentication token refresh problems</li>
                                                <li>Fixed display glitches in dark mode</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                {/* Previous releases */}
                                <div className="relative pl-8 before:absolute before:left-0 before:top-2 before:h-full before:w-[2px] before:bg-muted">
                                    <div className="absolute left-0 top-2 h-4 w-4 rounded-full bg-muted"></div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-lg font-medium">Version 2.3.5</h3>
                                            <span className="text-sm text-muted-foreground">April 5, 2025</span>
                                        </div>
                                        <p className="text-muted-foreground">Minor updates and bug fixes</p>
                                        <div className="rounded-md border p-4 mt-3">
                                            <h4 className="font-medium mb-2">Improvements</h4>
                                            <ul className="list-disc pl-5 space-y-1">
                                                <li>Enhanced search functionality across the platform</li>
                                                <li>Updated documentation with new examples</li>
                                            </ul>

                                            <h4 className="font-medium mt-4 mb-2">Bug Fixes</h4>
                                            <ul className="list-disc pl-5 space-y-1">
                                                <li>Fixed CSS issues on mobile devices</li>
                                                <li>Resolved data loading errors in projects dashboard</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                <div className="relative pl-8 before:absolute before:left-0 before:top-2 before:h-full before:w-[2px] before:bg-muted">
                                    <div className="absolute left-0 top-2 h-4 w-4 rounded-full bg-muted"></div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-lg font-medium">Version 2.3.0</h3>
                                            <span className="text-sm text-muted-foreground">March 15, 2025</span>
                                        </div>
                                        <p className="text-muted-foreground">Media management enhancements</p>
                                        <div className="rounded-md border p-4 mt-3">
                                            <h4 className="font-medium mb-2">New Features</h4>
                                            <ul className="list-disc pl-5 space-y-1">
                                                <li>Introduced advanced media library with better organization</li>
                                                <li>Added bulk actions for media items</li>
                                                <li>Implemented media usage analytics</li>
                                            </ul>

                                            <h4 className="font-medium mt-4 mb-2">Improvements</h4>
                                            <ul className="list-disc pl-5 space-y-1">
                                                <li>Increased upload size limits for premium accounts</li>
                                                <li>Enhanced preview capabilities for various file types</li>
                                            </ul>

                                            <h4 className="font-medium mt-4 mb-2">Bug Fixes</h4>
                                            <ul className="list-disc pl-5 space-y-1">
                                                <li>Fixed thumbnail generation for specific video formats</li>
                                                <li>Resolved permission issues when sharing media between projects</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                <div className="relative pl-8 before:absolute before:left-0 before:top-2 before:h-full before:w-[2px] before:bg-muted">
                                    <div className="absolute left-0 top-2 h-4 w-4 rounded-full bg-muted"></div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-lg font-medium">Version 2.2.0</h3>
                                            <span className="text-sm text-muted-foreground">February 28, 2025</span>
                                        </div>
                                        <p className="text-muted-foreground">Licensing system overhaul</p>
                                        <div className="rounded-md border p-4 mt-3">
                                            <h4 className="font-medium mb-2">New Features</h4>
                                            <ul className="list-disc pl-5 space-y-1">
                                                <li>Introduced flexible license tiers with customizable features</li>
                                                <li>Added automated license renewal system</li>
                                                <li>Implemented license usage analytics</li>
                                            </ul>

                                            <h4 className="font-medium mt-4 mb-2">Improvements</h4>
                                            <ul className="list-disc pl-5 space-y-1">
                                                <li>Streamlined license activation process</li>
                                                <li>Enhanced license reporting dashboard</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                <div className="relative pl-8">
                                    <div className="absolute left-0 top-2 h-4 w-4 rounded-full bg-muted"></div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-lg font-medium">Version 2.1.0</h3>
                                            <span className="text-sm text-muted-foreground">January 15, 2025</span>
                                        </div>
                                        <p className="text-muted-foreground">Initial public release</p>
                                        <div className="rounded-md border p-4 mt-3">
                                            <p>First public release of Deploy Hub Dashboard with core features:</p>
                                            <ul className="list-disc pl-5 space-y-1 mt-2">
                                                <li>Project management</li>
                                                <li>Deployment system</li>
                                                <li>Basic license management</li>
                                                <li>User authentication and permissions</li>
                                                <li>Order tracking</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>

                <Separator className="my-2" />

                <div className="text-sm text-center text-muted-foreground pb-4">
                    <p>Have feedback about recent changes? <Link href="/dashboard/help" className="underline underline-offset-4 hover:text-primary">Contact our support team</Link>.</p>
                </div>
            </div>
        </DashboardLayout>
    );
}