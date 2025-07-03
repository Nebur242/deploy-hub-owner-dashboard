"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { IconUser, IconSettings, IconBell, IconShield, IconBrandFirebase, IconMail, IconBuilding } from "@tabler/icons-react";
import { toast } from "sonner";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, Pencil, Eye, EyeOff } from "lucide-react";
import { useGetUserQuery, useUpdateUserMutation, useUpdateUserPreferencesMutation, useUpdateUserNotificationsMutation } from "@/store/features/users";
import { UserPreferences } from "@/common/types";
import { useTheme } from "@/hooks/theme-context";
import { SingleMediaSelector } from "@/app/dashboard/media/components/media-selector";
import { Media } from "@/common/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { changePassword, firebaseSendPasswordResetEmail, signOutAllDevices } from "@/services/users";
import { logoutUser } from "@/store/features/auth";
import { PushNotificationToggle } from "@/components/push-notification-toggle";

export default function SettingsPage() {
    const { infos: user } = useAppSelector((state) => state.auth);
    const router = useRouter();
    const searchParams = useSearchParams();
    const tabParam = searchParams.get('tab');
    const [activeTab, setActiveTab] = useState(tabParam || "general");
    const { theme: currentTheme, setTheme } = useTheme();
    const [profileMedia, setProfileMedia] = useState<Media | null>(null);
    const [profilePictureModalOpen, setProfilePictureModalOpen] = useState(false);
    const [signOutAllDevicesModalOpen, setSignOutAllDevicesModalOpen] = useState(false);
    const [signOutPassword, setSignOutPassword] = useState("");
    const dispatch = useAppDispatch();

    // Function to handle tab change and update URL
    const handleTabChange = (value: string) => {
        setActiveTab(value);
        // Update URL with new tab value
        router.push(`/dashboard/settings?tab=${value}`, { scroll: false });
    };

    // Sync tab state with URL on initial load
    useEffect(() => {
        if (tabParam && ['general', 'preferences', 'notifications', 'security'].includes(tabParam)) {
            setActiveTab(tabParam);
        }
    }, [tabParam]);

    // Get user data using RTK Query if authenticated
    const {
        data: userData,
        isLoading: isUserLoading
    } = useGetUserQuery(user?.uid || '', {
        skip: !user?.uid
    });

    // Mutations for updating user data
    const [updateUser, { isLoading: isUpdatingUser }] = useUpdateUserMutation();
    const [updatePreferences, { isLoading: isUpdatingPreferences }] = useUpdateUserPreferencesMutation();
    const [updateNotifications, { isLoading: isUpdatingNotifications }] = useUpdateUserNotificationsMutation();

    // Form state
    const [profileData, setProfileData] = useState({
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
        company: user?.company || "",
    });

    const [userPreferences, setUserPreferences] = useState<Partial<UserPreferences>>({
        theme: "system",
        emailNotifications: true,
    });

    const [notificationSettings, setNotificationSettings] = useState({
        projectUpdates: true,
        deploymentAlerts: true,
        licenseExpiration: true,
        marketing: false
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [isSendingResetEmail, setIsSendingResetEmail] = useState(false);
    const [isSigningOutDevices, setIsSigningOutDevices] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Initialize form data from fetched user data
    useEffect(() => {
        if (userData) {
            setProfileData({
                firstName: userData.firstName || "",
                lastName: userData.lastName || "",
                company: userData.company || "",
            });

            if (userData.preferences) {
                setUserPreferences({
                    theme: userData.preferences.theme,
                    emailNotifications: userData.preferences.emailNotifications,
                });
            }

            // Initialize notification settings if available
            if (userData.notifications) {
                setNotificationSettings({
                    projectUpdates: userData.notifications.projectUpdates ?? true,
                    deploymentAlerts: userData.notifications.deploymentAlerts ?? true,
                    licenseExpiration: userData.notifications.licenseExpiration ?? true,
                    marketing: userData.notifications.marketing ?? false,
                });
            }

            // If there's a profile picture URL, try to fetch the associated media
            if (userData.profilePicture) {
                // We don't need to fetch the media data as we'll just use the URL
                setProfileMedia({
                    id: "profile-picture",
                    url: userData.profilePicture,
                    type: "image",
                } as Media);
            }
        }
    }, [userData]);

    const getInitials = (name: string) => {
        return name?.slice(0, 2).toUpperCase() || 'U';
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case "admin":
                return "text-blue-700 bg-blue-100";
            case "super_admin":
                return "text-purple-700 bg-purple-100";
            default:
                return "text-gray-700 bg-gray-100";
        }
    };

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user?.id) {
            toast.error("Unable to update profile", {
                description: "User ID is missing. Please try again later."
            });
            return;
        }

        try {
            await updateUser({
                id: user.id,
                updateData: {
                    firstName: profileData.firstName,
                    lastName: profileData.lastName,
                    company: profileData.company,
                    profilePicture: profileMedia?.url || undefined
                }
            }).unwrap();

            toast.success("Profile updated", {
                description: "Your profile information has been updated successfully."
            });
        } catch (error) {
            console.error("Profile update error:", error);
            toast.error("Update failed", {
                description: "There was an error updating your profile. Please try again."
            });
        }
    };

    const handlePreferencesUpdate = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user?.id) {
            toast.error("Unable to update preferences", {
                description: "User ID is missing. Please try again later."
            });
            return;
        }

        try {
            await updatePreferences({
                id: user.id,
                preferences: {
                    theme: userPreferences.theme,
                    emailNotifications: userPreferences.emailNotifications
                }
            }).unwrap();

            // Immediately apply the theme change
            if (userPreferences.theme !== currentTheme) {
                setTheme(userPreferences.theme as "light" | "dark" | "system");
            }

            toast.success("Preferences updated", {
                description: "Your preferences have been updated successfully."
            });
        } catch (error) {
            console.error("Preferences update error:", error);
            toast.error("Update failed", {
                description: "There was an error updating your preferences. Please try again."
            });
        }
    };

    const handleNotificationUpdate = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user?.id) {
            toast.error("Unable to update notifications", {
                description: "User ID is missing. Please try again later."
            });
            return;
        }

        try {
            await updateNotifications({
                id: user.id,
                notifications: notificationSettings
            }).unwrap();

            toast.success("Notification settings updated", {
                description: "Your notification preferences have been saved successfully."
            });
        } catch (error) {
            console.error("Notification update error:", error);
            toast.error("Update failed", {
                description: "There was an error updating your notification settings. Please try again."
            });
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error("Passwords do not match", {
                description: "Please make sure your new password and confirmation match."
            });
            return;
        }

        setIsChangingPassword(true);

        try {
            await changePassword(passwordData.currentPassword, passwordData.newPassword);

            toast.success("Password changed", {
                description: "Your password has been changed successfully."
            });

            // Clear password inputs after successful update
            setPasswordData({
                currentPassword: "",
                newPassword: "",
                confirmPassword: ""
            });
        } catch (error) {
            console.error("Password change error:", error);
            toast.error("Change failed", {
                description: "There was an error changing your password. Please try again."
            });
        } finally {
            setIsChangingPassword(false);
        }
    };

    const handleSendPasswordResetEmail = async () => {

        if (!user?.firebase?.email) return;

        setIsSendingResetEmail(true);

        try {
            await firebaseSendPasswordResetEmail(user.firebase?.email);

            toast.success("Reset link sent", {
                description: "A password reset link has been sent to your email."
            });
        } catch (error) {
            console.error("Send reset email error:", error);
            toast.error("Send failed", {
                description: "There was an error sending the reset link. Please try again."
            });
        } finally {
            setIsSendingResetEmail(false);
        }
    };

    const handleSignOutAllDevices = async () => {
        setIsSigningOutDevices(true);

        try {
            await signOutAllDevices(signOutPassword);
            toast.success("Signed out from all devices", {
                description: "You have been signed out from all devices except your current one."
            });
            setSignOutAllDevicesModalOpen(false);
            setSignOutPassword("");
            dispatch(logoutUser());
        } catch (error) {
            console.error("Sign out all devices error:", error);
            toast.error("Sign out failed", {
                description: "There was an error signing out from all devices. Please try again."
            });
        } finally {
            setIsSigningOutDevices(false);
        }
    };

    // Show loading state while fetching user data
    const isLoading = isUserLoading || isUpdatingUser || isUpdatingPreferences || isUpdatingNotifications;

    // Ensure user data is available
    if (!user) {
        return (
            <div className="mx-auto max-w-5xl space-y-6 pb-16 flex items-center justify-center min-h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-lg">Loading user data...</span>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-5xl space-y-6 pb-16">
            <div className="space-y-0.5">
                <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground">
                    Manage your account settings and preferences
                </p>
            </div>
            <Separator className="my-6" />

            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
                <TabsList>
                    <TabsTrigger value="general" className="flex items-center gap-2">
                        <IconUser size={16} />
                        <span>General</span>
                    </TabsTrigger>
                    <TabsTrigger value="preferences" className="flex items-center gap-2">
                        <IconSettings size={16} />
                        <span>Preferences</span>
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="flex items-center gap-2">
                        <IconBell size={16} />
                        <span>Notifications</span>
                    </TabsTrigger>
                    <TabsTrigger value="security" className="flex items-center gap-2">
                        <IconShield size={16} />
                        <span>Security</span>
                    </TabsTrigger>
                </TabsList>

                {/* General Tab - User Profile */}
                <TabsContent value="general" className="space-y-6">
                    {/* User Profile Summary Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>User Profile</CardTitle>
                            <CardDescription>
                                View and manage your account details
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col md:flex-row gap-6">
                            <div className="flex flex-col items-center gap-4 md:w-1/3">
                                <div className="relative group">
                                    <Avatar className="h-32 w-32 border-4 border-background shadow-md">
                                        <AvatarImage
                                            src={profileMedia?.url || user.profilePicture}
                                            alt={`${user.firstName || 'User'}'s profile picture`}
                                            className="object-cover"
                                        />
                                        <AvatarFallback className="text-3xl">
                                            {getInitials(user.firstName || user.firebase?.email || 'User')}
                                        </AvatarFallback>
                                    </Avatar>
                                    <Button
                                        onClick={() => setProfilePictureModalOpen(true)}
                                        size="icon"
                                        variant="secondary"
                                        className="absolute bottom-0 right-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                                        aria-label="Edit profile picture"
                                    >
                                        <Pencil size={16} />
                                    </Button>
                                </div>
                                <div className="text-center">
                                    <h3 className="font-medium text-lg">
                                        {user.firstName} {user.lastName || ''}
                                    </h3>
                                    <p className="text-muted-foreground text-sm">{user.firebase?.email}</p>
                                    <div className="mt-2 flex gap-2 justify-center flex-wrap">
                                        {user.roles?.map(role => (
                                            <Badge key={role} variant="outline" className={getRoleBadgeColor(role)}>
                                                {role}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 space-y-4">
                                <div className="grid gap-1">
                                    <div className="flex items-center gap-2">
                                        <IconBrandFirebase size={16} />
                                        <Label htmlFor="uid">User ID</Label>
                                    </div>
                                    <Input id="uid" value={user.uid} readOnly />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <IconUser size={16} />
                                            <Label>Created</Label>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <IconUser size={16} />
                                            <Label>Last Updated</Label>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {new Date(user.updatedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* User Profile Edit Form */}
                    <form onSubmit={handleProfileUpdate}>
                        <Card>
                            <CardHeader>
                                <CardTitle>Update Profile</CardTitle>
                                <CardDescription>
                                    Update your personal information
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="firstName">First Name</Label>
                                        <Input
                                            id="firstName"
                                            value={profileData.firstName}
                                            onChange={e => setProfileData({ ...profileData, firstName: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lastName">Last Name</Label>
                                        <Input
                                            id="lastName"
                                            value={profileData.lastName}
                                            onChange={e => setProfileData({ ...profileData, lastName: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <IconMail size={16} />
                                            <Label htmlFor="email">Email</Label>
                                        </div>
                                        <Input id="email" value={user.firebase?.email || ''} readOnly disabled />
                                        <p className="text-muted-foreground text-xs">
                                            Email cannot be changed directly. Contact support if needed.
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <IconBuilding size={16} />
                                            <Label htmlFor="company">Company</Label>
                                        </div>
                                        <Input
                                            id="company"
                                            value={profileData.company}
                                            onChange={e => setProfileData({ ...profileData, company: e.target.value })}
                                            placeholder="Your company name"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-between">
                                <Button variant="outline" type="button" onClick={() => setProfileData({
                                    firstName: userData?.firstName || user.firstName || "",
                                    lastName: userData?.lastName || user.lastName || "",
                                    company: userData?.company || user.company || "",
                                })}>
                                    Reset
                                </Button>
                                <Button type="submit" disabled={isLoading}>
                                    {isUpdatingUser ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        "Save Changes"
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>
                    </form>
                </TabsContent>

                {/* Preferences Tab */}
                <TabsContent value="preferences" className="space-y-6">
                    <form onSubmit={handlePreferencesUpdate}>
                        <Card>
                            <CardHeader>
                                <CardTitle>Preferences</CardTitle>
                                <CardDescription>
                                    Manage your application preferences
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="theme">Theme</Label>
                                        <select
                                            id="theme"
                                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                            value={userPreferences.theme}
                                            onChange={e => setUserPreferences({ ...userPreferences, theme: e.target.value as "light" | "dark" | "system" })}
                                        >
                                            <option value="light">Light</option>
                                            <option value="dark">Dark</option>
                                            <option value="system">System</option>
                                        </select>
                                        <p className="text-sm text-muted-foreground">
                                            Set your preferred visual theme for the application
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between space-y-0">
                                        <div className="space-y-1">
                                            <Label htmlFor="emailNotifications">Email Notifications</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Receive email notifications about account activity
                                            </p>
                                        </div>
                                        <Switch
                                            id="emailNotifications"
                                            checked={userPreferences.emailNotifications}
                                            onCheckedChange={checked => setUserPreferences({ ...userPreferences, emailNotifications: checked })}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-between">
                                <Button variant="outline" type="button" onClick={() => setUserPreferences({
                                    theme: userData?.preferences?.theme || "system",
                                    emailNotifications: userData?.preferences?.emailNotifications !== undefined ? userData.preferences.emailNotifications : true,
                                })}>
                                    Reset to Defaults
                                </Button>
                                <Button type="submit" disabled={isLoading}>
                                    {isUpdatingPreferences ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        "Save Preferences"
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>
                    </form>
                </TabsContent>

                {/* Notifications Tab */}
                <TabsContent value="notifications">
                    <form onSubmit={handleNotificationUpdate} className="space-y-6">
                        {/* Push Notification Toggle */}
                        <PushNotificationToggle />

                        <Card>
                            <CardHeader>
                                <CardTitle>Notification Settings</CardTitle>
                                <CardDescription>
                                    Manage how and when you receive notifications
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between space-y-0">
                                        <div className="space-y-0.5">
                                            <Label>Project Updates</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Receive notifications about your project activity
                                            </p>
                                        </div>
                                        <Switch
                                            checked={notificationSettings.projectUpdates}
                                            onCheckedChange={checked => setNotificationSettings({ ...notificationSettings, projectUpdates: checked })}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between space-y-0">
                                        <div className="space-y-0.5">
                                            <Label>Deployment Alerts</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Get notified when your deployments succeed or fail
                                            </p>
                                        </div>
                                        <Switch
                                            checked={notificationSettings.deploymentAlerts}
                                            onCheckedChange={checked => setNotificationSettings({ ...notificationSettings, deploymentAlerts: checked })}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between space-y-0">
                                        <div className="space-y-0.5">
                                            <Label>License Expiration</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Get reminders before your licenses expire
                                            </p>
                                        </div>
                                        <Switch
                                            checked={notificationSettings.licenseExpiration}
                                            onCheckedChange={checked => setNotificationSettings({ ...notificationSettings, licenseExpiration: checked })}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between space-y-0">
                                        <div className="space-y-0.5">
                                            <Label>Marketing</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Receive updates about new features and offers
                                            </p>
                                        </div>
                                        <Switch
                                            checked={notificationSettings.marketing}
                                            onCheckedChange={checked => setNotificationSettings({ ...notificationSettings, marketing: checked })}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-between">
                                <Button variant="outline" type="button" onClick={() => setNotificationSettings({
                                    projectUpdates: userData?.notifications?.projectUpdates ?? true,
                                    deploymentAlerts: userData?.notifications?.deploymentAlerts ?? true,
                                    licenseExpiration: userData?.notifications?.licenseExpiration ?? true,
                                    marketing: userData?.notifications?.marketing ?? false,
                                })}>
                                    Reset to Defaults
                                </Button>
                                <Button type="submit" disabled={isLoading}>
                                    {isUpdatingNotifications ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        "Save Notification Settings"
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>
                    </form>
                </TabsContent>

                {/* Security Tab */}
                <TabsContent value="security">
                    <Card>
                        <CardHeader>
                            <CardTitle>Security Settings</CardTitle>
                            <CardDescription>
                                Manage your security preferences and password
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium">Change Password</h3>
                                <form onSubmit={handlePasswordChange} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="currentPassword">Current Password</Label>
                                        <div className="relative">
                                            <Input
                                                id="currentPassword"
                                                type={showCurrentPassword ? "text" : "password"}
                                                value={passwordData.currentPassword}
                                                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                                required
                                            />
                                            <Button
                                                type="button"
                                                size="icon"
                                                variant="ghost"
                                                className="absolute inset-y-0 right-0 flex items-center"
                                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                            >
                                                {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="newPassword">New Password</Label>
                                        <div className="relative">
                                            <Input
                                                id="newPassword"
                                                type={showNewPassword ? "text" : "password"}
                                                value={passwordData.newPassword}
                                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                                required
                                            />
                                            <Button
                                                type="button"
                                                size="icon"
                                                variant="ghost"
                                                className="absolute inset-y-0 right-0 flex items-center"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                            >
                                                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                        <div className="relative">
                                            <Input
                                                id="confirmPassword"
                                                type={showConfirmPassword ? "text" : "password"}
                                                value={passwordData.confirmPassword}
                                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                                required
                                            />
                                            <Button
                                                type="button"
                                                size="icon"
                                                variant="ghost"
                                                className="absolute inset-y-0 right-0 flex items-center"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            >
                                                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </Button>
                                        </div>
                                        {passwordData.newPassword !== passwordData.confirmPassword && passwordData.confirmPassword && (
                                            <p className="text-sm text-red-500">Passwords do not match</p>
                                        )}
                                    </div>
                                    <Button
                                        type="submit"
                                        disabled={
                                            isChangingPassword ||
                                            !passwordData.currentPassword ||
                                            !passwordData.newPassword ||
                                            !passwordData.confirmPassword ||
                                            passwordData.newPassword !== passwordData.confirmPassword
                                        }
                                        className="w-full"
                                    >
                                        {isChangingPassword ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Changing Password...
                                            </>
                                        ) : (
                                            "Change Password"
                                        )}
                                    </Button>
                                </form>
                            </div>
                            <Separator />
                            <div className="space-y-2">
                                <Label>Reset Password via Email</Label>
                                <div className="grid gap-2">
                                    <Button
                                        variant="outline"
                                        className="w-full md:w-auto"
                                        onClick={handleSendPasswordResetEmail}
                                    >
                                        {isSendingResetEmail ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Sending...
                                            </>
                                        ) : (
                                            "Send Reset Link"
                                        )}
                                    </Button>
                                    <p className="text-xs text-muted-foreground">
                                        You&apos;ll receive an email with instructions to reset your password
                                    </p>
                                </div>
                            </div>
                            {/* <Separator />
                            <div className="space-y-2">
                                <Label>Two-Factor Authentication</Label>
                                <div className="grid gap-2">
                                    <Button variant="outline" className="w-full md:w-auto">
                                        Set Up 2FA
                                    </Button>
                                    <p className="text-xs text-muted-foreground">
                                        Add an extra layer of security to your account
                                    </p>
                                </div>
                            </div> */}
                            <Separator />
                            <div className="space-y-2">
                                <Label>Sessions</Label>
                                <div className="grid gap-2">
                                    <Button
                                        variant="destructive"
                                        className="w-full md:w-auto"
                                        onClick={() => setSignOutAllDevicesModalOpen(true)}
                                        disabled={isSigningOutDevices}
                                    >
                                        {isSigningOutDevices ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Signing Out...
                                            </>
                                        ) : (
                                            "Sign Out All Devices"
                                        )}
                                    </Button>
                                    <p className="text-xs text-muted-foreground">
                                        This will sign you out from all devices except your current one
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <Dialog open={profilePictureModalOpen} onOpenChange={setProfilePictureModalOpen}>
                <DialogContent>
                    <SingleMediaSelector
                        label="Select Profile Picture"
                        value={profileMedia}
                        onChange={setProfileMedia}
                    />
                </DialogContent>
            </Dialog>

            <Dialog open={signOutAllDevicesModalOpen} onOpenChange={setSignOutAllDevicesModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Sign Out All Devices</DialogTitle>
                        <DialogDescription>
                            Please enter your password to confirm signing out from all devices.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <Label htmlFor="signOutPassword">Password</Label>
                        <Input
                            id="signOutPassword"
                            type="password"
                            value={signOutPassword}
                            onChange={(e) => setSignOutPassword(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSignOutAllDevicesModalOpen(false)} disabled={isSigningOutDevices}>
                            Cancel
                        </Button>
                        <Button onClick={handleSignOutAllDevices} disabled={!signOutPassword || isSigningOutDevices}>
                            {isSigningOutDevices ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Signing Out...
                                </>
                            ) : (
                                "Sign Out All Devices"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}