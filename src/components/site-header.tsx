/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  Bell,
  Search,
  HelpCircle,
  ChevronDown,
  X,
  Loader2,
  LogOut,
  DollarSign,
  ShoppingCart,
  Rocket,
  PartyPopper,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { logoutUser } from "@/store/features/auth";
import {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAllAsReadMutation,
  useUpdateNotificationMutation,
} from "@/store/features/notifications";
import {
  UINotification,
  transformNotifications,
} from "@/app/dashboard/notifications/models/notification";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function SiteHeader() {
  const {
    infos: user,
    logout: { loading, status, error },
  } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  // const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileSearchQuery, setMobileSearchQuery] = useState("");

  // Notification API hooks
  const { data: notificationsData, isLoading: isLoadingNotifications } =
    useGetNotificationsQuery({ page: 1, limit: 5 });
  const { data: unreadCountData } = useGetUnreadCountQuery();
  const [markAllAsRead, { isLoading: isMarkingAllRead }] = useMarkAllAsReadMutation();
  const [updateNotification] = useUpdateNotificationMutation();

  // Transform notifications for display
  const notifications: UINotification[] = useMemo(() => {
    if (!notificationsData?.items) return [];
    return transformNotifications(notificationsData.items);
  }, [notificationsData]);

  const unreadCount = unreadCountData?.count ?? 0;
  const hasNotifications = unreadCount > 0;

  // Get icon for notification type
  const getNotificationIcon = (type: UINotification["type"]) => {
    switch (type) {
      case "sale":
        return (
          <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center dark:bg-green-900/20">
            <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
          </div>
        );
      case "order":
        return (
          <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center dark:bg-amber-900/20">
            <ShoppingCart className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
        );
      case "deployment":
        return (
          <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center dark:bg-purple-900/20">
            <Rocket className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
        );
      case "welcome":
        return (
          <div className="h-8 w-8 rounded-full bg-pink-100 flex items-center justify-center dark:bg-pink-900/20">
            <PartyPopper className="h-4 w-4 text-pink-600 dark:text-pink-400" />
          </div>
        );
      default:
        return (
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
            <Bell className="h-4 w-4 text-primary" />
          </div>
        );
    }
  };

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead().unwrap();
    } catch {
      toast.error("Failed to mark notifications as read");
    }
  };

  // Handle notification click
  const handleNotificationClick = async (notification: UINotification) => {
    if (!notification.read) {
      try {
        await updateNotification({ id: notification.id, data: { read: true } }).unwrap();
      } catch {
        // Silently fail - don't interrupt user flow
      }
    }
    if (notification.actionLink) {
      router.push(notification.actionLink);
      setIsNotificationsOpen(false);
    }
  };

  // Track scroll position for shadow effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/dashboard/help?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  // Handle mobile search submission
  const handleMobileSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (mobileSearchQuery.trim()) {
      router.push(`/dashboard/help?search=${encodeURIComponent(mobileSearchQuery.trim())}`);
      setMobileSearchQuery("");
      setIsMobileSearchOpen(false);
    }
  };

  // Logout handling
  const handleLogoutClick = () => {
    setLogoutDialogOpen(true);
  };

  const handleLogout = async () => {
    try {
      // Dispatch logout action
      await dispatch(logoutUser()).unwrap();

      // Show success toast
      toast.success("Logged out successfully", {
        description: "You have been logged out of your account.",
        duration: 3000,
      });

      // Redirect to login page
      router.push("/auth/login");
    } catch (err) {
      // Show error toast if logout fails
      toast.error("Logout failed", {
        description:
          err instanceof Error
            ? err.message
            : "Could not log out. Please try again.",
        duration: 5000,
      });

      // Close the dialog even if there was an error
      setLogoutDialogOpen(false);
    }
  };

  // Handle logout status changes
  useEffect(() => {
    if (status === "success") {
      router.push("/auth/login");
    }
    if (status === "error") {
      toast.error(error, {
        description: "Could not log out. Please try again.",
        duration: 5000,
      });
      setLogoutDialogOpen(false);
    }
  }, [status, error, router]);

  return (
    <header
      className={cn(
        "sticky top-0 p-4 z-50 flex h-16 w-full items-center bg-background transition-all duration-200",
        isScrolled && "border-b shadow-sm"
      )}
    >
      <div className="container flex items-center justify-between">
        {/* Left section */}
        <div className="flex items-center gap-4">
          {/* Mobile hamburger menu and branding */}
          <div className="flex items-center gap-3 lg:gap-4">
            <SidebarTrigger className="md:hidden" />
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-xl font-semibold tracking-tight"
            >
              <span className="hidden md:inline-flex font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
                Deploy Hub
              </span>
              <span className="md:hidden font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
                Deploy Hub
              </span>
            </Link>
          </div>

          <Separator orientation="vertical" className="hidden h-8 md:block" />

          {/* Desktop search */}
          <form onSubmit={handleSearch} className="hidden md:flex relative w-[200px] lg:w-[300px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search help..."
              className="pl-8 bg-muted/40 border-none focus-visible:ring-1 focus-visible:ring-primary/30 h-9 transition-all duration-200 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
        </div>

        {/* Mobile search bar - toggled with state */}
        {isMobileSearchOpen && (
          <div className="absolute inset-0 z-50 flex h-16 w-full items-center bg-background px-4 md:hidden">
            <form onSubmit={handleMobileSearch} className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search help..."
                className="pl-8 w-full"
                autoFocus
                value={mobileSearchQuery}
                onChange={(e) => setMobileSearchQuery(e.target.value)}
              />
            </form>
            <Button
              variant="ghost"
              size="icon"
              className="ml-2"
              onClick={() => setIsMobileSearchOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        )}

        {/* Right section */}
        <div className="flex items-center gap-2">
          {/* Mobile search trigger */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMobileSearchOpen(true)}
          >
            <Search className="h-5 w-5" />
          </Button>

          {/* Theme toggle */}
          <ThemeToggle />

          {/* Notifications */}
          <DropdownMenu
            open={isNotificationsOpen}
            onOpenChange={setIsNotificationsOpen}
          >
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative"
              >
                <Bell className="h-5 w-5" />
                {hasNotifications && (
                  <Badge
                    className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                    variant="destructive"
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[380px]">
              <div className="flex items-center justify-between p-2">
                <p className="text-sm font-medium">Notifications</p>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto px-2 py-1 text-xs"
                    onClick={handleMarkAllAsRead}
                    disabled={isMarkingAllRead}
                  >
                    {isMarkingAllRead ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : null}
                    Mark all as read
                  </Button>
                )}
              </div>
              <DropdownMenuSeparator />
              <div className="max-h-[300px] overflow-y-auto">
                {isLoadingNotifications ? (
                  <div className="p-3 space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-start gap-2">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="flex-1 space-y-1.5">
                          <Skeleton className="h-3 w-3/4" />
                          <Skeleton className="h-3 w-full" />
                          <Skeleton className="h-2 w-1/4" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : notifications.length > 0 ? (
                  <>
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={cn(
                          "flex items-start gap-2 p-3 hover:bg-muted/50 cursor-pointer transition-colors",
                          !notification.read && "bg-muted/30"
                        )}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        {getNotificationIcon(notification.type)}
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "text-sm truncate",
                            !notification.read ? "font-semibold" : "font-medium"
                          )}>
                            {notification.title}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="py-6 text-center">
                    <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                      <Bell className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      No notifications
                    </p>
                  </div>
                )}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="justify-center">
                <Link href="/dashboard/notifications" className="text-sm">
                  View all notifications
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Help dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <HelpCircle className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuItem asChild>
                <Link href="/dashboard/help" className="flex w-full items-center">
                  Help Center
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/help" className="flex w-full items-center">
                  Support
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/changelog" className="flex w-full items-center">
                  Changelog
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 pr-2 pl-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={
                      user?.profilePicture ||
                      `https://avatar.iran.liara.run/public/boy?username=${user?.id || "user"
                      }`
                    }
                  />
                  <AvatarFallback>
                    {user?.firstName?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-sm font-medium lg:inline-block">
                  {user?.firstName || "Admin"}
                </span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[220px]">
              <div className="flex items-center gap-2 p-2">
                <div className="flex flex-col space-y-0.5 leading-none">
                  <p className="text-sm font-medium">
                    {user?.firstName || "Admin"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.firebase?.email || "admin@example.com"}
                  </p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <Link
                    href="/dashboard/profile"
                    className="flex w-full items-center gap-2"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                    >
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    Account
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link
                    href="/dashboard/billing"
                    className="flex w-full items-center gap-2"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                    >
                      <rect width="20" height="14" x="2" y="5" rx="2"></rect>
                      <line x1="2" x2="22" y1="10" y2="10"></line>
                    </svg>
                    Billing
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link
                    href="/dashboard/settings"
                    className="flex w-full items-center gap-2"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                    >
                      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    Settings
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogoutClick}
                disabled={loading}
                className="text-destructive focus:text-destructive"
              >
                <div className="flex w-full items-center gap-2">
                  <LogOut className="h-4 w-4" />
                  {loading ? "Logging out..." : "Log out"}
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {/* Logout Confirmation Dialog */}
      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to log out?
            </AlertDialogTitle>
            <AlertDialogDescription>
              You will be logged out of your account and redirected to the login
              page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging out...
                </>
              ) : (
                "Log out"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  );
}
