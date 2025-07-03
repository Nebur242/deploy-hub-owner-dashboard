"use client"

import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import {
    Bell,
    Check,
    Clock,
    Code,
    Key,
    Rocket,
    Trash2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { NotificationType } from "../models/notification"

type NotificationItemProps = {
    notification: NotificationType
    onMarkAsRead: (id: string) => void
    onDelete: (id: string) => void
}

export function NotificationItem({
    notification,
    onMarkAsRead,
    onDelete,
}: NotificationItemProps) {
    const [isHovered, setIsHovered] = useState(false)

    // Get icon based on notification type
    const getIcon = () => {
        switch (notification.type) {
            case "system":
                return <Bell className="shrink-0 h-5 w-5 text-blue-500" />
            case "deployment":
                return <Rocket className="shrink-0 h-5 w-5 text-green-500" />
            case "license":
                return <Key className="shrink-0 h-5 w-5 text-amber-500" />
            case "project":
                return <Code className="shrink-0 h-5 w-5 text-purple-500" />
            default:
                return <Bell className="shrink-0 h-5 w-5 text-muted-foreground" />
        }
    }

    // Format relative time
    const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
        addSuffix: true,
    })

    return (
        <div
            className={cn(
                "flex items-start gap-4 rounded-lg px-4 py-3 transition-colors",
                notification.read ? "bg-transparent" : "bg-muted/40",
                isHovered && "bg-muted/80"
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="mt-1">{getIcon()}</div>
            <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                    <p className={cn("font-medium", !notification.read && "font-semibold")}>
                        {notification.title}
                    </p>
                    <div className="flex items-center gap-1">
                        <span className="flex items-center text-xs text-muted-foreground whitespace-nowrap">
                            <Clock className="mr-1 h-3 w-3" />
                            {timeAgo}
                        </span>
                    </div>
                </div>
                <p className="text-sm text-muted-foreground">{notification.message}</p>
                {notification.actionLink && notification.actionText && (
                    <div className="pt-1">
                        <Link href={notification.actionLink}>
                            <Button variant="link" size="sm" className="p-0 h-auto font-medium">
                                {notification.actionText}
                            </Button>
                        </Link>
                    </div>
                )}
            </div>
            <div className={cn("flex items-center gap-1", isHovered ? "opacity-100" : "opacity-0")}>
                {!notification.read && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => onMarkAsRead(notification.id)}
                    >
                        <Check className="h-4 w-4" />
                        <span className="sr-only">Mark as read</span>
                    </Button>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => onDelete(notification.id)}
                >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete notification</span>
                </Button>
            </div>
        </div>
    )
}