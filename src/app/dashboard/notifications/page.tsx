"use client"

import { useState, useMemo } from "react"
import {
    Bell,
    Check,
    Filter,
    Loader2,
    RefreshCcw,
    Search,
} from "lucide-react"
import {
    Card,
    CardContent,
    CardHeader
} from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { NotificationItem } from "./components/notification-item"
import { UINotification, transformNotifications } from "./models/notification"
import {
    useGetNotificationsQuery,
    useGetUnreadCountQuery,
    useMarkAllAsReadMutation,
    useUpdateNotificationMutation,
    useDeleteNotificationMutation,
    NotificationScope,
} from "@/store/features/notifications"


export default function NotificationsPage() {
    const [activeTab, setActiveTab] = useState<string>("all")
    const [searchQuery, setSearchQuery] = useState<string>("")
    const [page, setPage] = useState(1)
    const [selectedTypes, setSelectedTypes] = useState<{
        system: boolean
        sale: boolean
        order: boolean
        deployment: boolean
    }>({
        system: true,
        sale: true,
        order: true,
        deployment: true,
    })

    // Build query params based on filters
    const queryParams = useMemo(() => {
        const params: {
            page: number;
            limit: number;
            read?: boolean;
            search?: string;
            scope?: NotificationScope;
        } = {
            page,
            limit: 20,
        }

        if (activeTab === "unread") {
            params.read = false
        }

        if (searchQuery) {
            params.search = searchQuery
        }

        return params
    }, [page, activeTab, searchQuery])

    // API queries
    const {
        data: notificationsData,
        isLoading,
        isFetching,
        refetch,
    } = useGetNotificationsQuery(queryParams)

    const { data: unreadCountData } = useGetUnreadCountQuery()

    // Mutations
    const [markAllAsRead, { isLoading: isMarkingAllRead }] = useMarkAllAsReadMutation()
    const [updateNotification] = useUpdateNotificationMutation()
    const [deleteNotification] = useDeleteNotificationMutation()

    // Transform API notifications to UI format
    const notifications: UINotification[] = useMemo(() => {
        if (!notificationsData?.items) return []
        return transformNotifications(notificationsData.items)
    }, [notificationsData])

    // Filter notifications by selected types (client-side filtering for type)
    const filteredNotifications = useMemo(() => {
        return notifications.filter((notification) => {
            if (notification.type === "system" || notification.type === "welcome") return selectedTypes.system
            if (notification.type === "sale") return selectedTypes.sale
            if (notification.type === "order") return selectedTypes.order
            if (notification.type === "deployment") return selectedTypes.deployment
            return true
        })
    }, [notifications, selectedTypes])

    const unreadCount = unreadCountData?.count ?? 0
    const totalCount = notificationsData?.meta?.totalItems ?? 0

    // Mark all as read
    const handleMarkAllAsRead = async () => {
        try {
            await markAllAsRead().unwrap()
            toast.success("All notifications marked as read")
        } catch {
            toast.error("Failed to mark notifications as read")
        }
    }

    // Mark notification as read
    const handleMarkAsRead = async (id: string) => {
        try {
            await updateNotification({ id, data: { read: true } }).unwrap()
        } catch {
            toast.error("Failed to mark notification as read")
        }
    }

    // Delete notification
    const handleDeleteNotification = async (id: string) => {
        try {
            await deleteNotification(id).unwrap()
            toast.success("Notification deleted")
        } catch {
            toast.error("Failed to delete notification")
        }
    }

    // Handle refresh
    const handleRefresh = () => {
        refetch()
        toast.success("Notifications refreshed")
    }

    // Loading skeleton
    const NotificationSkeleton = () => (
        <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-start gap-4 p-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-2/3" />
                    </div>
                </div>
            ))}
        </div>
    )

    return (
        <div className="mx-auto max-w-5xl py-6">
            {/* Header */}
            <div className="flex flex-col space-y-4 mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Notifications</h1>
                        <p className="text-muted-foreground">
                            View and manage your notifications
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="hidden sm:flex"
                            onClick={handleRefresh}
                            disabled={isFetching}
                        >
                            <RefreshCcw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="sm:hidden"
                            onClick={handleRefresh}
                            disabled={isFetching}
                        >
                            <RefreshCcw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="hidden sm:flex"
                            onClick={handleMarkAllAsRead}
                            disabled={unreadCount === 0 || isMarkingAllRead}
                        >
                            {isMarkingAllRead ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Check className="mr-2 h-4 w-4" />
                            )}
                            Mark all as read
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="sm:hidden"
                            onClick={handleMarkAllAsRead}
                            disabled={unreadCount === 0 || isMarkingAllRead}
                        >
                            {isMarkingAllRead ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Check className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            <Card className="py-0">
                <CardHeader className="px-6 pt-6 pb-4">
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                        <Tabs
                            defaultValue="all"
                            value={activeTab}
                            onValueChange={(value) => {
                                setActiveTab(value)
                                setPage(1)
                            }}
                            className="w-full sm:w-auto"
                        >
                            <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:grid-cols-2">
                                <TabsTrigger value="all">
                                    All
                                    {totalCount > 0 && (
                                        <Badge variant="secondary" className="ml-2">
                                            {totalCount}
                                        </Badge>
                                    )}
                                </TabsTrigger>
                                <TabsTrigger value="unread">
                                    Unread
                                    {unreadCount > 0 && (
                                        <Badge variant="secondary" className="ml-2">
                                            {unreadCount}
                                        </Badge>
                                    )}
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>

                        <div className="flex items-center gap-2">
                            <div className="relative flex-1 sm:min-w-[200px]">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Search notifications..."
                                    className="pl-8 bg-background"
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value)
                                        setPage(1)
                                    }}
                                />
                            </div>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="icon">
                                        <Filter className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuLabel>Filter by type</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuCheckboxItem
                                        checked={selectedTypes.system}
                                        onCheckedChange={(value) =>
                                            setSelectedTypes({ ...selectedTypes, system: !!value })
                                        }
                                    >
                                        System & Welcome
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={selectedTypes.sale}
                                        onCheckedChange={(value) =>
                                            setSelectedTypes({ ...selectedTypes, sale: !!value })
                                        }
                                    >
                                        Sales
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={selectedTypes.order}
                                        onCheckedChange={(value) =>
                                            setSelectedTypes({ ...selectedTypes, order: !!value })
                                        }
                                    >
                                        Orders
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={selectedTypes.deployment}
                                        onCheckedChange={(value) =>
                                            setSelectedTypes({ ...selectedTypes, deployment: !!value })
                                        }
                                    >
                                        Deployments
                                    </DropdownMenuCheckboxItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="px-6 pb-6">
                    {isLoading ? (
                        <NotificationSkeleton />
                    ) : filteredNotifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Bell className="h-12 w-12 text-muted-foreground/50 mb-4" />
                            <h3 className="text-lg font-medium">No notifications</h3>
                            <p className="text-muted-foreground mt-2">
                                {searchQuery
                                    ? "No notifications match your search"
                                    : activeTab === "unread"
                                        ? "You have no unread notifications"
                                        : "You don't have any notifications"}
                            </p>
                            {searchQuery && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="mt-4"
                                    onClick={() => setSearchQuery("")}
                                >
                                    Clear search
                                </Button>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="space-y-1">
                                {filteredNotifications.map((notification) => (
                                    <NotificationItem
                                        key={notification.id}
                                        notification={notification}
                                        onMarkAsRead={handleMarkAsRead}
                                        onDelete={handleDeleteNotification}
                                    />
                                ))}
                            </div>

                            {/* Pagination */}
                            {notificationsData && notificationsData.meta.totalPages > 1 && (
                                <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={page === 1}
                                        onClick={() => setPage(p => p - 1)}
                                    >
                                        Previous
                                    </Button>
                                    <span className="text-sm text-muted-foreground">
                                        Page {page} of {notificationsData.meta.totalPages}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={page >= notificationsData.meta.totalPages}
                                        onClick={() => setPage(p => p + 1)}
                                    >
                                        Next
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}