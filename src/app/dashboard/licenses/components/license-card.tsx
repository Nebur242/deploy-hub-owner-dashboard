"use client";

import { LicenseOption, LicenseStatus } from "@/common/types";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star } from "lucide-react";
import { usePurchaseLicenseMutation } from "@/store/features/licenses";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner"

interface LicenseCardProps {
    license: LicenseOption;
    projectId?: string;
}

export function LicenseCard({ license, projectId }: LicenseCardProps) {
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
    const [purchaseLicense, { isLoading }] = usePurchaseLicenseMutation();

    const handlePurchaseClick = () => {
        setIsConfirmDialogOpen(true);
    };

    const handleConfirmPurchase = async () => {
        if (!projectId) {
            toast.warning("Project required", {
                description: "Please select a project for this license",
            });
            return;
        }

        try {
            await purchaseLicense({
                licenseId: license.id,
            }).unwrap();

            toast.success("Purchase initiated", {
                description: "Your license purchase has been initiated. Please complete the payment.",
            });

            setIsConfirmDialogOpen(false);
        } catch (error) {
            console.error("Purchase failed", {
                error,
                licenseId: license.id,
                projectId,
            });
            toast.error("Purchase failed", {
                description: "There was a problem initiating your license purchase. Please try again.",
            });
        }
    };

    const formatCurrency = (price: number, currency: string) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency,
        }).format(price);
    };

    // Get status color based on license status
    const getStatusBadgeVariant = (status: LicenseStatus) => {
        switch (status) {
            case LicenseStatus.PUBLIC:
                return "default";
            case LicenseStatus.PRIVATE:
                return "secondary";
            case LicenseStatus.DRAFT:
                return "outline";
            case LicenseStatus.ARCHIVED:
                return "destructive";
            default:
                return "outline";
        }
    };

    return (
        <>
            <Card className={`flex flex-col h-full border-2 hover:shadow-lg transition-shadow ${license.popular ? 'border-primary' : ''}`}>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <CardTitle className="text-xl">{license.name}</CardTitle>
                                {license.popular && (
                                    <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">
                                        <Star className="h-3 w-3 mr-1" /> Popular
                                    </Badge>
                                )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant={getStatusBadgeVariant(license.status)} className="text-xs">
                                    {license.status}
                                </Badge>
                            </div>
                        </div>
                        <Badge variant="secondary" className="text-sm px-3">
                            {formatCurrency(license.price, license.currency)}
                        </Badge>
                    </div>
                    <CardDescription className="text-sm text-gray-500 mt-2">
                        {license.description}
                    </CardDescription>
                </CardHeader>

                <CardContent className="flex-grow">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Badge variant="outline">{license.deployment_limit} deployments</Badge>
                            <Badge variant="outline">
                                {license.duration === 0
                                    ? "Unlimited duration"
                                    : `${license.duration} days`}
                            </Badge>
                        </div>
                        <Separator className="my-4" />
                        <h4 className="text-sm font-medium">Features</h4>
                        <ul className="space-y-2">
                            {license.features.map((feature, index) => (
                                <li key={index} className="flex items-center gap-2 text-sm">
                                    <Check className="h-4 w-4 text-green-500" />
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </CardContent>

                <CardFooter className="pt-2">
                    <Button
                        className="w-full"
                        onClick={handlePurchaseClick}
                        disabled={isLoading || license.status !== LicenseStatus.PUBLIC}
                    >
                        {license.status === LicenseStatus.PUBLIC ? 'Purchase License' : 'Not Available'}
                    </Button>
                </CardFooter>
            </Card>

            <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Purchase</DialogTitle>
                        <DialogDescription>
                            You are about to purchase the {license.name} license for {formatCurrency(license.price, license.currency)}.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        <h4 className="font-medium">License Details:</h4>
                        <ul className="mt-2 space-y-1 text-sm">
                            <li>Price: {formatCurrency(license.price, license.currency)}</li>
                            <li>Deployment Limit: {license.deployment_limit}</li>
                            <li>Duration: {license.duration === 0 ? "Unlimited" : `${license.duration} days`}</li>
                        </ul>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleConfirmPurchase} disabled={isLoading}>
                            {isLoading ? "Processing..." : "Confirm Purchase"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}