"use client"

import { useState } from "react"
import {
    Bell,
    Check,
    Filter,
    RefreshCcw,
    Search,
    X
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
import { NotificationItem } from "./components/notification-item"
import { NotificationType } from "./models/notification"
import { mockNotifications } from "./data/mock-notifications"


export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<NotificationType[]>(mockNotifications)
    const [activeTab, setActiveTab] = useState<string>("all")
    const [searchQuery, setSearchQuery] = useState<string>("")
    const [selectedTypes, setSelectedTypes] = useState<{
        system: boolean
        deployment: boolean
        license: boolean
        project: boolean
    }>({
        system: true,
        deployment: true,
        license: true,
        project: true,
    })

    // Filter notifications based on active tab, search query, and selected types
    const filteredNotifications = notifications
        .filter((notification) => {
            // Filter by tab
            if (activeTab === "all") return true
            if (activeTab === "unread") return !notification.read
            return true
        })
        .filter((notification) => {
            // Filter by search
            if (!searchQuery) return true
            return (
                notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                notification.message.toLowerCase().includes(searchQuery.toLowerCase())
            )
        })
        .filter((notification) => {
            // Filter by notification type
            if (notification.type === "system") return selectedTypes.system
            if (notification.type === "deployment") return selectedTypes.deployment
            if (notification.type === "license") return selectedTypes.license
            if (notification.type === "project") return selectedTypes.project
            return true
        })

    // Mark all as read
    const markAllAsRead = () => {
        const updatedNotifications = notifications.map((notification) => ({
            ...notification,
            read: true,
        }))
        setNotifications(updatedNotifications)
        toast.success("All notifications marked as read")
    }

    // Mark notification as read
    const markAsRead = (id: string) => {
        const updatedNotifications = notifications.map((notification) =>
            notification.id === id ? { ...notification, read: true } : notification
        )
        setNotifications(updatedNotifications)
    }

    // Delete notification
    const deleteNotification = (id: string) => {
        const updatedNotifications = notifications.filter(
            (notification) => notification.id !== id
        )
        setNotifications(updatedNotifications)
        toast.success("Notification deleted")
    }

    // Clear all notifications
    const clearAllNotifications = () => {
        setNotifications([])
        toast.success("All notifications cleared")
    }

    // Get unread count
    const unreadCount = notifications.filter((n) => !n.read).length

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
                            onClick={() => {
                                setNotifications(mockNotifications)
                                toast.success("Notifications refreshed")
                            }}
                        >
                            <RefreshCcw className="mr-2 h-4 w-4" />
                            Refresh
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="sm:hidden"
                            onClick={() => {
                                setNotifications(mockNotifications)
                                toast.success("Notifications refreshed")
                            }}
                        >
                            <RefreshCcw className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="hidden sm:flex"
                            onClick={markAllAsRead}
                            disabled={unreadCount === 0}
                        >
                            <Check className="mr-2 h-4 w-4" />
                            Mark all as read
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="sm:hidden"
                            onClick={markAllAsRead}
                            disabled={unreadCount === 0}
                        >
                            <Check className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={clearAllNotifications}
                            disabled={notifications.length === 0}
                        >
                            <X className="mr-2 h-4 w-4" />
                            Clear all
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
                            onValueChange={setActiveTab}
                            className="w-full sm:w-auto"
                        >
                            <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:grid-cols-2">
                                <TabsTrigger value="all">
                                    All
                                    {notifications.length > 0 && (
                                        <Badge variant="secondary" className="ml-2">
                                            {notifications.length}
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
                                    onChange={(e) => setSearchQuery(e.target.value)}
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
                                        System
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={selectedTypes.deployment}
                                        onCheckedChange={(value) =>
                                            setSelectedTypes({ ...selectedTypes, deployment: !!value })
                                        }
                                    >
                                        Deployment
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={selectedTypes.license}
                                        onCheckedChange={(value) =>
                                            setSelectedTypes({ ...selectedTypes, license: !!value })
                                        }
                                    >
                                        License
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={selectedTypes.project}
                                        onCheckedChange={(value) =>
                                            setSelectedTypes({ ...selectedTypes, project: !!value })
                                        }
                                    >
                                        Project
                                    </DropdownMenuCheckboxItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="px-6 pb-6">
                    {filteredNotifications.length === 0 ? (
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
                        <div className="space-y-1">
                            {filteredNotifications.map((notification) => (
                                <NotificationItem
                                    key={notification.id}
                                    notification={notification}
                                    onMarkAsRead={markAsRead}
                                    onDelete={deleteNotification}
                                />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}