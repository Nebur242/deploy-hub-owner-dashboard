"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useLazyGetOrderByIdQuery, useProcessPaymentMutation } from "@/store/features/orders";
import { LicensePeriod } from "@/common/types/license";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { CreditCard, Calendar, Lock, CheckCircle2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export default function PaymentPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const orderId = searchParams.get("orderId");

    const [getOrder, { data: order, isLoading, error }] = useLazyGetOrderByIdQuery();
    const [processPayment, { isLoading: isProcessing }] = useProcessPaymentMutation();

    const [paymentMethod, setPaymentMethod] = useState("CREDIT_CARD");
    const [paymentComplete, setPaymentComplete] = useState(false);

    // Credit card form fields
    const [cardNumber, setCardNumber] = useState("");
    const [cardName, setCardName] = useState("");
    const [expiryDate, setExpiryDate] = useState("");
    const [cvv, setCvv] = useState("");

    useEffect(() => {
        if (orderId) {
            getOrder(orderId);
        } else {
            toast.error("No order ID provided", {
                description: "Cannot process payment without an order ID",
            });
            router.push("/dashboard/purchase");
        }
    }, [orderId, getOrder, router]);

    const handlePayment = async () => {
        if (!order) return;

        try {
            // Generate a fake transaction ID
            const fakeTxId = `tx_${Math.random().toString(36).substring(2, 15)}`;

            // Create fake payment gateway response
            const fakeGatewayResponse = {
                status: "success",
                transactionId: fakeTxId,
                timestamp: new Date().toISOString(),
                cardLast4: cardNumber.slice(-4),
            };

            await processPayment({
                orderId: order.id,
                amount: order.amount,
                currency: order.currency,
                paymentMethod: paymentMethod,
                transactionId: fakeTxId,
                paymentGatewayResponse: JSON.stringify(fakeGatewayResponse)
            }).unwrap();

            toast.success("Payment successful", {
                description: "Your payment has been processed and your license is now active",
            });

            setPaymentComplete(true);
        } catch (error) {
            console.error("Payment processing failed:", error);
            toast.error("Payment failed", {
                description: "There was an issue processing your payment. Please try again.",
            });
        }
    };

    const formatCurrency = (price: number, currency: string) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency,
        }).format(price);
    };

    const validateForm = () => {
        return paymentMethod === "CREDIT_CARD"
            ? cardNumber.length >= 16 && cardName.length > 0 && expiryDate.length === 5 && cvv.length >= 3
            : true;
    };

    const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Only allow numbers and format with spaces
        const value = e.target.value.replace(/\D/g, "");
        setCardNumber(value);
    };

    const handleExpiryDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Format as MM/YY
        const value = e.target.value.replace(/\D/g, "");
        if (value.length <= 2) {
            setExpiryDate(value);
        } else {
            setExpiryDate(`${value.slice(0, 2)}/${value.slice(2, 4)}`);
        }
    };

    const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Only allow numbers
        const value = e.target.value.replace(/\D/g, "");
        if (value.length <= 4) {
            setCvv(value);
        }
    };

    const handleBackToDashboard = () => {
        router.push("/dashboard/licenses");
    };

    if (isLoading) {
        return (
            <div className="container max-w-3xl mx-auto py-10">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-8 w-1/2 mb-2" />
                        <Skeleton className="h-4 w-3/4" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            <Skeleton className="h-64 w-full" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="container max-w-3xl mx-auto py-10">
                <Card>
                    <CardHeader>
                        <CardTitle>Payment Error</CardTitle>
                        <CardDescription>
                            There was an error loading the order details. Please try again or contact support.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={() => router.push("/dashboard/purchase")}>
                            Return to Purchase Page
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (paymentComplete) {
        return (
            <div className="container max-w-3xl mx-auto py-10">
                <Card className="border-green-200">
                    <CardHeader className="bg-green-50 text-green-700 rounded-t-lg">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 size={24} />
                            <CardTitle>Payment Successful</CardTitle>
                        </div>
                        <CardDescription className="text-green-600">
                            Your payment has been processed and your license is now active
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-6">
                            <div>
                                <h3 className="font-medium mb-2">Order Details</h3>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="text-gray-500">Reference Number:</div>
                                    <div>{order.id}</div>
                                    <div className="text-gray-500">Amount:</div>
                                    <div className="font-medium">{formatCurrency(order.amount, order.currency)}</div>
                                    <div className="text-gray-500">License:</div>
                                    <div>{order.license.name}</div>
                                    <div className="text-gray-500">Date:</div>
                                    <div>{new Date().toLocaleString()}</div>
                                </div>
                            </div>

                            <div className="pt-4">
                                <p className="text-sm text-gray-600">
                                    A confirmation email has been sent with your receipt and license details.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleBackToDashboard} className="w-full">
                            View My Licenses
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="container max-w-3xl mx-auto py-10">
            <Card>
                <CardHeader>
                    <CardTitle>Complete Your Purchase</CardTitle>
                    <CardDescription>
                        Please enter your payment details to complete your license purchase
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row justify-between gap-4 p-4 bg-gray-50 rounded-lg">
                            <div>
                                <h3 className="font-medium mb-1">{order.license.name}</h3>
                                <p className="text-sm text-gray-600 mb-1">{order.license.description}</p>
                                <div className="text-xs text-gray-500">
                                    {order.license.deployment_limit} deployments •
                                    {order.license.period === LicensePeriod.FOREVER ? " Lifetime" : ` ${order.license.period.charAt(0).toUpperCase() + order.license.period.slice(1)}`}
                                </div>
                            </div>
                            <div className="text-xl font-bold">
                                {formatCurrency(order.amount, order.currency)}
                            </div>
                        </div>

                        <Separator />

                        <div>
                            <Label className="text-base">Payment Method</Label>
                            <Tabs defaultValue="card" className="mt-2" onValueChange={(value) => setPaymentMethod(value === "card" ? "credit_card" : "paypal")}>
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="card">Credit Card</TabsTrigger>
                                    <TabsTrigger value="paypal">PayPal</TabsTrigger>
                                </TabsList>
                                <TabsContent value="card" className="space-y-4 pt-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="card-number">Card Number</Label>
                                        <div className="relative">
                                            <Input
                                                id="card-number"
                                                placeholder="1234 5678 9012 3456"
                                                value={cardNumber}
                                                onChange={handleCardNumberChange}
                                            />
                                            <CreditCard className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="card-name">Cardholder Name</Label>
                                        <Input
                                            id="card-name"
                                            placeholder="John Doe"
                                            value={cardName}
                                            onChange={(e) => setCardName(e.target.value)}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="expiry">Expiry Date</Label>
                                            <div className="relative">
                                                <Input
                                                    id="expiry"
                                                    placeholder="MM/YY"
                                                    value={expiryDate}
                                                    onChange={handleExpiryDateChange}
                                                />
                                                <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="cvv">CVV</Label>
                                            <div className="relative">
                                                <Input
                                                    id="cvv"
                                                    placeholder="123"
                                                    value={cvv}
                                                    onChange={handleCvvChange}
                                                />
                                                <Lock className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>
                                <TabsContent value="paypal" className="pt-4">
                                    <div className="flex items-center justify-center h-40 bg-gray-50 rounded-lg">
                                        <p className="text-gray-500">
                                            Click &quot;Pay Now&quot; to complete your purchase with PayPal
                                        </p>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col">
                    <Button
                        onClick={handlePayment}
                        className="w-full"
                        disabled={isProcessing || !validateForm()}
                    >
                        {isProcessing ? "Processing..." : `Pay ${formatCurrency(order.amount, order.currency)}`}
                    </Button>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                        This is a demo payment. No real charges will be made.
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}