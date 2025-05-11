"use client";

import { useNotifications } from "@/providers/NotificationProvider";
import { Button } from "./ui/button";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "./ui/card";

export function PushNotificationToggle() {
    const { hasPermission, requestPermission, isInitialized } = useNotifications();
    const [isLoading, setIsLoading] = useState(false);

    const handleToggleChange = async (checked: boolean) => {
        if (!checked) {
            toast.info("Notification Settings", {
                description: "To disable notifications completely, use your browser settings.",
            });
            return;
        }

        setIsLoading(true);
        try {
            const granted = await requestPermission();
            if (granted) {
                toast.success("Notifications enabled", {
                    description: "You'll now receive push notifications for important updates.",
                });
            } else {
                toast.error("Permission denied", {
                    description: "Please enable notifications in your browser settings to receive updates.",
                });
            }
        } catch (err) {
            console.log("Error enabling notifications:", err);
            toast.error("Error enabling notifications", {
                description: "There was a problem enabling notifications. Please try again.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Show loading message if notification system is not yet initialized
    if (!isInitialized) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base">Push Notifications</Label>
                            <p className="text-sm text-muted-foreground">
                                Loading notification settings...
                            </p>
                        </div>
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    // If notifications are not supported in this browser
    if (typeof Notification === "undefined") {
        return (
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base">Push Notifications</Label>
                            <p className="text-sm text-muted-foreground">
                                Push notifications are not supported in your browser.
                            </p>
                        </div>
                        <BellOff className="h-5 w-5 text-muted-foreground" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label className="text-base">Push Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                            Receive notifications even when you&apos;re not using the app
                        </p>
                    </div>

                    {isLoading ? (
                        <Button variant="outline" size="sm" disabled>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Updating...
                        </Button>
                    ) : hasPermission ? (
                        <div className="flex items-center space-x-2">
                            <Bell className="h-4 w-4 text-primary mr-2" />
                            <Switch checked={true} onCheckedChange={handleToggleChange} />
                        </div>
                    ) : (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleChange(true)}
                        >
                            <Bell className="mr-2 h-4 w-4" />
                            Enable Notifications
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}