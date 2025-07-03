"use client";

import { LicenseOption } from "@/common/types";
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
import { Check } from "lucide-react";
import { usePurchaseLicenseMutation } from "@/store/features/licenses";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface LicenseCardProps {
    license: LicenseOption;
}

export function LicenseCard({ license }: LicenseCardProps) {
    const router = useRouter();
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
    const [purchaseLicense, { isLoading }] = usePurchaseLicenseMutation();

    const handlePurchaseClick = () => {
        setIsConfirmDialogOpen(true);
    };

    const handleConfirmPurchase = async () => {
        try {
            // Use the first project associated with the license
            const projectId = license.projects[0]?.id;

            if (!projectId) {
                toast.error("No project available", {
                    description: "This license doesn't have any associated projects",
                });
                return;
            }

            const response = await purchaseLicense({
                licenseId: license.id,
            }).unwrap();

            toast.success("Order created", {
                description: "Please complete the payment process",
            });

            setIsConfirmDialogOpen(false);

            // Redirect to the payment page with the order ID
            router.push(`/dashboard/payment?orderId=${response.id}`);
        } catch (error) {
            console.error("Purchase failed", {
                error,
                licenseId: license.id,
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

    return (
        <>
            <Card className="flex flex-col h-full border-2 hover:shadow-lg transition-shadow">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <CardTitle className="text-xl">{license.name}</CardTitle>
                        <Badge variant="secondary" className="text-sm px-3">
                            {formatCurrency(license.price, license.currency)}
                        </Badge>
                    </div>
                    <CardDescription className="text-sm text-gray-500">
                        {license.description}
                    </CardDescription>
                </CardHeader>

                <CardContent className="flex-grow">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Badge variant="outline">{license.deploymentLimit} deployments</Badge>
                            <Badge variant="outline">
                                {license.duration === 0
                                    ? "Unlimited duration"
                                    : `${license.duration} days`}
                            </Badge>
                        </div>

                        {license.projects.length > 0 && (
                            <>
                                <div className="pt-2">
                                    <h4 className="text-sm font-medium mb-1">Available for projects:</h4>
                                    <div className="flex flex-wrap gap-1">
                                        {license.projects.map((project) => (
                                            <Badge key={project.id} variant="outline" className="text-xs">
                                                {project.name}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

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
                        disabled={isLoading || license.projects.length === 0}
                    >
                        {license.projects.length === 0 ? "Not Available" : "Purchase License"}
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
                            <li>Deployment Limit: {license.deploymentLimit}</li>
                            <li>Duration: {license.duration === 0 ? "Unlimited" : `${license.duration} days`}</li>
                        </ul>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleConfirmPurchase} disabled={isLoading}>
                            {isLoading ? "Processing..." : "Continue to Payment"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}