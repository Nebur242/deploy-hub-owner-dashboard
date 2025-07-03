"use client";

import { useState } from "react";
// import { useAppSelector } from "@/store/hooks";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Download, AlertCircle, Check, Calendar } from "lucide-react";
import { toast } from "sonner";

export default function BillingPage() {
    // const { infos: user } = useAppSelector((state) => state.auth);
    const [activeTab, setActiveTab] = useState("overview");

    // Mock billing data
    const currentPlan = {
        name: "Professional",
        price: 29.99,
        billingCycle: "monthly",
        nextBillingDate: "May 26, 2025",
        status: "active"
    };

    const paymentMethods = [
        {
            id: "card1",
            type: "card",
            lastFour: "4242",
            expiryDate: "09/27",
            isDefault: true,
            cardType: "Visa"
        },
        {
            id: "card2",
            type: "card",
            lastFour: "1234",
            expiryDate: "06/26",
            isDefault: false,
            cardType: "Mastercard"
        }
    ];

    const invoices = [
        {
            id: "INV-001",
            date: "April 1, 2025",
            amount: 29.99,
            status: "paid"
        },
        {
            id: "INV-002",
            date: "March 1, 2025",
            amount: 29.99,
            status: "paid"
        },
        {
            id: "INV-003",
            date: "February 1, 2025",
            amount: 29.99,
            status: "paid"
        },
        {
            id: "INV-004",
            date: "January 1, 2025",
            amount: 29.99,
            status: "paid"
        }
    ];

    const usage = {
        deployments: {
            used: 23,
            limit: 100
        },
        storage: {
            used: 3.2,
            limit: 50
        },
        bandwidth: {
            used: 75,
            limit: 500
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    const handleDownloadInvoice = (invoiceId: string) => {
        // In a real app, this would generate and download the invoice
        toast.success(`Invoice ${invoiceId} is being downloaded`, {
            description: "Your invoice will be downloaded shortly"
        });
    };

    const handleSetDefaultPaymentMethod = (methodId: string) => {
        console.log(`Setting payment method ${methodId} as default`);
        // Mock setting default payment method
        toast.success("Payment method updated", {
            description: "Your default payment method has been updated"
        });
    };

    const handleAddPaymentMethod = () => {
        toast.info("Add payment method", {
            description: "This feature will be available soon"
        });
    };

    const handleRemovePaymentMethod = (methodId: string) => {
        console.log(`Removing payment method ${methodId}`);
        toast.success("Payment method removed", {
            description: "Your payment method has been removed"
        });
    };

    const handleChangeSubscription = () => {
        toast.info("Change subscription", {
            description: "This feature will be available soon"
        });
    };

    const handleCancelSubscription = () => {
        toast.info("Cancel subscription", {
            description: "This feature will be available soon"
        });
    };

    return (
        <div className="container max-w-5xl mx-auto py-10">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Billing & Subscription</h1>
                <p className="text-muted-foreground">
                    Manage your billing information, subscription plan, and payment methods
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="w-full grid grid-cols-3 mb-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="invoices">Invoices</TabsTrigger>
                    <TabsTrigger value="payment-methods">Payment Methods</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    {/* Current Plan */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5" /> Current Plan
                            </CardTitle>
                            <CardDescription>
                                Details about your current subscription plan
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col md:flex-row justify-between gap-4">
                                <div>
                                    <h3 className="text-xl font-bold flex items-center">
                                        {currentPlan.name} Plan
                                        <Badge className="ml-2 bg-green-600" variant="secondary">
                                            <Check className="h-3 w-3 mr-1" /> {currentPlan.status}
                                        </Badge>
                                    </h3>
                                    <p className="text-muted-foreground mt-1">
                                        Billed {currentPlan.billingCycle}
                                    </p>
                                    <div className="mt-4 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            <span>Next payment on {currentPlan.nextBillingDate}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold">
                                        {formatCurrency(currentPlan.price)}<span className="text-muted-foreground text-sm font-normal">/month</span>
                                    </div>
                                    <div className="mt-4 space-x-2">
                                        <Button variant="outline" onClick={handleChangeSubscription}>
                                            Change Plan
                                        </Button>
                                        <Button variant="ghost" onClick={handleCancelSubscription}>
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Usage */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Usage & Limits</CardTitle>
                            <CardDescription>
                                Your current resource usage
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-sm font-medium">Deployments</span>
                                        <span className="text-sm text-muted-foreground">
                                            {usage.deployments.used} of {usage.deployments.limit}
                                        </span>
                                    </div>
                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary"
                                            style={{ width: `${(usage.deployments.used / usage.deployments.limit) * 100}%` }}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-sm font-medium">Storage (GB)</span>
                                        <span className="text-sm text-muted-foreground">
                                            {usage.storage.used} of {usage.storage.limit}
                                        </span>
                                    </div>
                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary"
                                            style={{ width: `${(usage.storage.used / usage.storage.limit) * 100}%` }}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-sm font-medium">Bandwidth (GB)</span>
                                        <span className="text-sm text-muted-foreground">
                                            {usage.bandwidth.used} of {usage.bandwidth.limit}
                                        </span>
                                    </div>
                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary"
                                            style={{ width: `${(usage.bandwidth.used / usage.bandwidth.limit) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="invoices">
                    <Card>
                        <CardHeader>
                            <CardTitle>Invoice History</CardTitle>
                            <CardDescription>
                                View and download your past invoices
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Invoice</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {invoices.map((invoice) => (
                                        <TableRow key={invoice.id}>
                                            <TableCell className="font-medium">{invoice.id}</TableCell>
                                            <TableCell>{invoice.date}</TableCell>
                                            <TableCell>{formatCurrency(invoice.amount)}</TableCell>
                                            <TableCell>
                                                <Badge variant={invoice.status === "paid" ? "outline" : "destructive"}>
                                                    {invoice.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleDownloadInvoice(invoice.id)}
                                                >
                                                    <Download className="h-4 w-4 mr-2" />
                                                    Download
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="payment-methods">
                    <Card>
                        <CardHeader>
                            <CardTitle>Payment Methods</CardTitle>
                            <CardDescription>
                                Manage your payment methods and billing preferences
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {paymentMethods.map((method) => (
                                    <div key={method.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-muted p-2 rounded-md">
                                                <CreditCard className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <div className="font-medium flex items-center">
                                                    {method.cardType} •••• {method.lastFour}
                                                    {method.isDefault && (
                                                        <Badge className="ml-2" variant="secondary">Default</Badge>
                                                    )}
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    Expires {method.expiryDate}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            {!method.isDefault && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleSetDefaultPaymentMethod(method.id)}
                                                >
                                                    Set as default
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRemovePaymentMethod(method.id)}
                                            >
                                                Remove
                                            </Button>
                                        </div>
                                    </div>
                                ))}

                                <Button variant="outline" onClick={handleAddPaymentMethod}>
                                    <CreditCard className="h-4 w-4 mr-2" />
                                    Add payment method
                                </Button>
                            </div>
                        </CardContent>
                        <CardFooter className="bg-muted/50 flex flex-row items-center">
                            <AlertCircle className="h-4 w-4 text-muted-foreground mr-2" />
                            <p className="text-sm text-muted-foreground">
                                Your payment information is processed securely. We do not store your full card details.
                            </p>
                        </CardFooter>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}