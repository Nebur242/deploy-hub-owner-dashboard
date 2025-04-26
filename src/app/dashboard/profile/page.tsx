"use client";

import { useAppSelector } from "@/store/hooks";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { IconUser, IconBrandFirebase, IconMail, IconBuilding } from "@tabler/icons-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useGetUserQuery } from "@/store/features/users";
import Link from "next/link";

export default function ProfilePage() {
    const { infos: user } = useAppSelector((state) => state.auth);

    // Get user data using RTK Query if authenticated
    const {
        data: userData,
        isLoading: isUserLoading
    } = useGetUserQuery(user?.uid || '', {
        skip: !user?.uid
    });

    // Show loading state while fetching user data
    if (isUserLoading || !user) {
        return (
            <div className="mx-auto max-w-5xl space-y-6 pb-16 flex items-center justify-center min-h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-lg">Loading user profile...</span>
            </div>
        );
    }

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

    return (
        <div className="mx-auto max-w-5xl space-y-6 pb-16">
            <div className="space-y-0.5">
                <h2 className="text-2xl font-bold tracking-tight">User Profile</h2>
                <p className="text-muted-foreground">
                    View your account information and details
                </p>
            </div>
            <Separator className="my-6" />

            <div className="space-y-6">
                {/* User Profile Card */}
                <Card className="overflow-hidden p-0">
                    <div className="relative h-40 bg-gradient-to-r from-blue-500 to-purple-500">
                        <div className="absolute -bottom-16 left-8">
                            <Avatar className="h-32 w-32 border-4 border-background shadow-md">
                                <AvatarImage
                                    src={userData?.profilePicture || user.profilePicture}
                                    alt={`${user.firstName || 'User'}'s profile picture`}
                                    className="object-cover"
                                />
                                <AvatarFallback className="text-3xl">
                                    {getInitials(user.firstName || user.firebase?.email || 'User')}
                                </AvatarFallback>
                            </Avatar>
                        </div>
                    </div>
                    <CardContent className="pt-20">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold">
                                    {user.firstName} {user.lastName || ''}
                                </h3>
                                <div className="flex gap-2 flex-wrap">
                                    {user.roles?.map(role => (
                                        <Badge key={role} variant="outline" className={getRoleBadgeColor(role)}>
                                            {role}
                                        </Badge>
                                    ))}
                                </div>
                                <p className="text-muted-foreground">{userData?.company || user.company || 'No company specified'}</p>
                            </div>

                            <Separator />

                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <IconMail size={16} className="text-muted-foreground" />
                                            <span className="text-sm font-medium">Email</span>
                                        </div>
                                        <p>{user.firebase?.email || 'No email available'}</p>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <IconBuilding size={16} className="text-muted-foreground" />
                                            <span className="text-sm font-medium">Company</span>
                                        </div>
                                        <p>{userData?.company || user.company || 'No company specified'}</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <IconBrandFirebase size={16} className="text-muted-foreground" />
                                            <span className="text-sm font-medium">User ID</span>
                                        </div>
                                        <p className="text-sm font-mono">{user.uid}</p>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <IconUser size={16} className="text-muted-foreground" />
                                            <span className="text-sm font-medium">Account Created</span>
                                        </div>
                                        <p>{new Date(user.createdAt).toLocaleDateString()} at {new Date(user.createdAt).toLocaleTimeString()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="bg-muted/50 flex justify-end py-4">
                        <Link href={"/dashboard/settings"}>
                            <Button variant="outline">
                                Edit Profile
                            </Button>
                        </Link>
                    </CardFooter>
                </Card>

                {/* Account Activity */}
                <Card>
                    <CardHeader>
                        <CardTitle>Account Activity</CardTitle>
                        <CardDescription>
                            Your recent activity and account statistics
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-8 md:grid-cols-3">
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">Last Login</p>
                                <p className="text-2xl font-bold">
                                    {new Date().toLocaleDateString()}
                                </p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">Projects</p>
                                <p className="text-2xl font-bold">
                                    0
                                </p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">Deployments</p>
                                <p className="text-2xl font-bold">
                                    0
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}