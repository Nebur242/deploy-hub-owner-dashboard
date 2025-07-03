"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGetLicenseQuery, useGetLicensePurchasesQuery } from "@/store/features/licenses";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, CheckCircle, ChevronLeft, ChevronRight, ExternalLink, Loader2, Package, Users } from "lucide-react";
import DashboardLayout from "@/components/dashboard-layout";
import { BreadcrumbItem } from "@/components/breadcrumb";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PurchaseStatus } from "@/common/enums/project";
import Link from "next/link";
import { IconEdit } from "@tabler/icons-react";
import { formatCurrency, formatDate, formatDuration } from "@/utils/format";

export default function ViewLicensePage() {
    const { id: licenseId } = useParams() as { id?: string };
    const router = useRouter();

    // Avoid firing the query until we actually have a licenseId
    const skipLicenseFetch = !licenseId;

    const [currentPage, setCurrentPage] = useState(1);

    // RTK Query hooks
    const {
        data: license,
        isLoading: isLoadingLicense,
        error: licenseError,
        refetch,
    } = useGetLicenseQuery(licenseId!, { skip: skipLicenseFetch });

    // Fetch purchases related to this license with server-side filtering
    const {
        data: purchasesResponse,
        isLoading: isLoadingPurchases,
    } = useGetLicensePurchasesQuery({
        licenseId: licenseId!,
        page: currentPage,
        limit: 10
    }, { skip: skipLicenseFetch });

    // Get purchases from paginated response
    const licensePurchases = purchasesResponse?.items || [];
    const totalPages = purchasesResponse?.meta?.totalPages || 1;

    // Breadcrumb items
    const breadcrumbItems: BreadcrumbItem[] = [
        { label: "Licenses", href: "/dashboard/licenses" },
        { label: license?.name || "License Details" },
    ];

    // Action buttons
    const actionButtons = (
        <>
            <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/dashboard/licenses")}
                className="flex items-center mr-2"
            >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Licenses
            </Button>

            <Button
                variant="default"
                size="sm"
                asChild
                className="flex items-center"
            >
                <Link href={`/dashboard/licenses/${licenseId}/edit`}>
                    <IconEdit className="h-4 w-4 mr-1" />
                    Edit License
                </Link>
            </Button>
        </>
    );


    // Function to retry loading if there was an error
    const handleRetryFetch = () => {
        refetch();
    };

    // Show loading state while fetching the license
    if (isLoadingLicense) {
        return (
            <DashboardLayout
                breadcrumbItems={breadcrumbItems}
                title="License Details"
                actions={actionButtons}
            >
                <div className="flex justify-center items-center py-12">
                    <div className="text-center">
                        <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-primary" />
                        <p className="text-lg font-medium">Loading license data...</p>
                        <p className="text-sm text-muted-foreground mt-2">
                            Please wait while we retrieve the license information.
                        </p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    // Show error state if license fetching failed
    if (licenseError) {
        return (
            <DashboardLayout
                breadcrumbItems={breadcrumbItems}
                title="License Details"
                actions={actionButtons}
            >
                <Alert variant="destructive" className="mb-6">
                    <AlertTitle className="text-lg font-semibold">
                        Failed to load license
                    </AlertTitle>
                    <AlertDescription className="mt-2">
                        <p>
                            We couldn&apos;t load the license information. This might be due
                            to a network issue or the license may no longer exist.
                        </p>
                        <div className="mt-4">
                            <Button onClick={handleRetryFetch} className="mr-2">
                                Try Again
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => router.push("/dashboard/licenses")}
                            >
                                Return to Licenses
                            </Button>
                        </div>
                    </AlertDescription>
                </Alert>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout
            breadcrumbItems={breadcrumbItems}
            title={license?.name || "License Details"}
            actions={actionButtons}
        >
            <div className="space-y-8">
                {/* License Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="col-span-2">
                        <CardHeader>
                            <CardTitle>License Overview</CardTitle>
                            <CardDescription>Details about this license</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                                    <p className="mt-1">{license?.description}</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <h3 className="text-sm font-medium text-muted-foreground">Price</h3>
                                        <p className="mt-1 text-xl font-semibold">
                                            {license && formatCurrency(license.currency, license.price)}
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-medium text-muted-foreground">Deployments</h3>
                                        <p className="mt-1">
                                            <Badge variant="outline" className="text-lg font-semibold">
                                                {license?.deploymentLimit} {license?.deploymentLimit === 1 ? 'deployment' : 'deployments'}
                                            </Badge>
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-medium text-muted-foreground">Duration</h3>
                                        <p className="mt-1">
                                            <Badge variant="outline" className="text-lg font-semibold">
                                                {license && formatDuration(license.duration)}
                                            </Badge>
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Features</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {license?.features.length ? (
                                            license.features.map((feature, index) => (
                                                <Badge key={index} className="bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1">
                                                    <CheckCircle className="h-3 w-3 mr-1" /> {feature}
                                                </Badge>
                                            ))
                                        ) : (
                                            <p className="text-muted-foreground">No features specified</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Stats Card */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>License Stats</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-center">
                                        <div className="bg-primary/10 p-2 rounded-full mr-4">
                                            <Users className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Total Purchases</p>
                                            <p className="text-2xl font-bold">{licensePurchases.length}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center">
                                        <div className="bg-primary/10 p-2 rounded-full mr-4">
                                            <Package className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Associated Projects</p>
                                            <p className="text-2xl font-bold">{license?.projects?.length || 0}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center">
                                        <div className="bg-primary/10 p-2 rounded-full mr-4">
                                            <Calendar className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Created On</p>
                                            <p className="text-lg font-medium">
                                                {license && formatDate(license.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Associated Projects</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {license?.projects && license.projects.length > 0 ? (
                                    <div className="space-y-3">
                                        {license.projects.map(project => (
                                            <div key={project.id} className="flex items-center justify-between p-2 rounded-md border">
                                                <span className="font-medium">{project.name}</span>
                                                <Button variant="ghost" size="sm" asChild>
                                                    <Link href={`/dashboard/projects/${project.id}`}>
                                                        <ExternalLink className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground text-center py-4">
                                        No projects associated with this license
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Purchase History */}
                <Card>
                    <CardHeader>
                        <CardTitle>Purchase History</CardTitle>
                        <CardDescription>Licenses purchased by users</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoadingPurchases ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : licensePurchases.length > 0 ? (
                            <>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>User ID</TableHead>
                                            <TableHead>Project</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Amount</TableHead>
                                            <TableHead>Deployments</TableHead>
                                            <TableHead>Purchased On</TableHead>
                                            <TableHead>Expires</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {licensePurchases.map(purchase => (
                                            <TableRow key={purchase.id}>
                                                <TableCell>{purchase.userId.substring(0, 8)}...</TableCell>
                                                <TableCell>
                                                    {purchase.project ? (
                                                        <Link href={`/dashboard/projects/${purchase.projectId}`} className="text-primary hover:underline">
                                                            {purchase.project.name}
                                                        </Link>
                                                    ) : (
                                                        purchase.projectId.substring(0, 8) + '...'
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={purchase.status === PurchaseStatus.PAID ? "default" :
                                                            purchase.status === PurchaseStatus.PENDING ? "outline" : "destructive"}
                                                    >
                                                        {purchase.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{formatCurrency(purchase.currency, purchase.amount)}</TableCell>
                                                <TableCell>
                                                    {purchase.deploymentsUsed} / {purchase.deploymentsAllowed}
                                                </TableCell>
                                                <TableCell>{formatDate(purchase.createdAt)}</TableCell>
                                                <TableCell>
                                                    {purchase.expiresAt ? formatDate(purchase.expiresAt) : "Never"}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                <div className="flex justify-between items-center mt-4">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        Previous
                                    </Button>
                                    <span className="text-sm text-muted-foreground">
                                        Page {currentPage} of {totalPages}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                    >
                                        Next
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-muted-foreground">No purchases found for this license</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}