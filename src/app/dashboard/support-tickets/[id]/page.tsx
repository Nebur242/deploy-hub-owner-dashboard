"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    IconArrowLeft,
    IconSend,
    IconLoader2,
    IconX,
    IconUser,
    IconBuildingStore,
    IconMail,
    IconRocket,
    IconPhoto,
    IconExternalLink,
    IconPaperclip,
} from "@tabler/icons-react";
import {
    useGetOwnerLicenseTicketQuery,
    useAddOwnerMessageMutation,
    useUpdateOwnerTicketMutation,
    useCloseOwnerTicketMutation,
} from "@/store/features/license-tickets";
import {
    LicenseTicketStatus,
    LicenseTicketPriority,
    LicenseTicketCategory,
    MessageSenderType,
    Media,
} from "@/common/types";
import { formatDate } from "@/utils/format";
import { BreadcrumbItem } from "@/components/breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog";
import { MultipleMediaSelector } from "@/app/dashboard/media/components/media-selector";

const getStatusBadge = (status: LicenseTicketStatus) => {
    switch (status) {
        case LicenseTicketStatus.OPEN:
            return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Open</Badge>;
        case LicenseTicketStatus.PENDING_OWNER_RESPONSE:
            return <Badge variant="secondary" className="bg-red-100 text-red-800">Response Needed</Badge>;
        case LicenseTicketStatus.PENDING_USER_RESPONSE:
            return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Awaiting Customer</Badge>;
        case LicenseTicketStatus.IN_PROGRESS:
            return <Badge variant="secondary" className="bg-orange-100 text-orange-800">In Progress</Badge>;
        case LicenseTicketStatus.RESOLVED:
            return <Badge variant="secondary" className="bg-green-100 text-green-800">Resolved</Badge>;
        case LicenseTicketStatus.CLOSED:
            return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Closed</Badge>;
        default:
            return <Badge variant="secondary">{status}</Badge>;
    }
};

const getPriorityBadge = (priority: LicenseTicketPriority) => {
    switch (priority) {
        case LicenseTicketPriority.LOW:
            return <Badge variant="outline" className="border-gray-300 text-gray-600">Low Priority</Badge>;
        case LicenseTicketPriority.MEDIUM:
            return <Badge variant="outline" className="border-blue-300 text-blue-600">Medium Priority</Badge>;
        case LicenseTicketPriority.HIGH:
            return <Badge variant="outline" className="border-orange-300 text-orange-600">High Priority</Badge>;
        case LicenseTicketPriority.URGENT:
            return <Badge variant="outline" className="border-red-300 text-red-600">Urgent</Badge>;
        default:
            return <Badge variant="outline">{priority}</Badge>;
    }
};

const getCategoryLabel = (category: LicenseTicketCategory) => {
    const labels: Record<LicenseTicketCategory, string> = {
        [LicenseTicketCategory.GENERAL]: "General",
        [LicenseTicketCategory.TECHNICAL]: "Technical",
        [LicenseTicketCategory.DEPLOYMENT]: "Deployment",
        [LicenseTicketCategory.CONFIGURATION]: "Configuration",
        [LicenseTicketCategory.BUG_REPORT]: "Bug Report",
        [LicenseTicketCategory.FEATURE_REQUEST]: "Feature Request",
        [LicenseTicketCategory.OTHER]: "Other",
    };
    return labels[category] || category;
};

const statusOptions = [
    { value: LicenseTicketStatus.OPEN, label: "Open" },
    { value: LicenseTicketStatus.IN_PROGRESS, label: "In Progress" },
    { value: LicenseTicketStatus.PENDING_USER_RESPONSE, label: "Awaiting Customer" },
    { value: LicenseTicketStatus.RESOLVED, label: "Resolved" },
];

const priorityOptions = [
    { value: LicenseTicketPriority.LOW, label: "Low" },
    { value: LicenseTicketPriority.MEDIUM, label: "Medium" },
    { value: LicenseTicketPriority.HIGH, label: "High" },
    { value: LicenseTicketPriority.URGENT, label: "Urgent" },
];

export default function TicketDetailPage() {
    const router = useRouter();
    const params = useParams();
    const ticketId = params.id as string;
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [newMessage, setNewMessage] = useState("");
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [selectedMedia, setSelectedMedia] = useState<Media[]>([]);

    const breadcrumbs: BreadcrumbItem[] = [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Support Tickets", href: "/dashboard/support-tickets" },
        { label: "Ticket Details", href: `/dashboard/support-tickets/${ticketId}` },
    ];

    const { data: ticket, isLoading, refetch } = useGetOwnerLicenseTicketQuery(ticketId);
    const [addMessage, { isLoading: sending }] = useAddOwnerMessageMutation();
    const [updateTicket, { isLoading: updating }] = useUpdateOwnerTicketMutation();
    const [closeTicket, { isLoading: closing }] = useCloseOwnerTicketMutation();

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [ticket?.messages]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() && selectedMedia.length === 0) {
            toast.error("Please enter a message or attach media");
            return;
        }

        try {
            await addMessage({
                ticketId,
                data: {
                    content: newMessage.trim() || "Attached media",
                    attachments: selectedMedia.map((m) => m.url),
                },
            }).unwrap();
            setNewMessage("");
            setSelectedMedia([]);
            toast.success("Message sent");
            refetch();
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to send message");
        }
    };

    const handleStatusChange = async (status: LicenseTicketStatus) => {
        try {
            await updateTicket({
                ticketId,
                data: { status },
            }).unwrap();
            toast.success("Status updated");
            refetch();
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to update status");
        }
    };

    const handlePriorityChange = async (priority: LicenseTicketPriority) => {
        try {
            await updateTicket({
                ticketId,
                data: { priority },
            }).unwrap();
            toast.success("Priority updated");
            refetch();
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to update priority");
        }
    };

    const handleCloseTicket = async () => {
        try {
            await closeTicket(ticketId).unwrap();
            toast.success("Ticket closed");
            refetch();
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to close ticket");
        }
    };

    if (isLoading) {
        return (
            <DashboardLayout breadcrumbItems={breadcrumbs}>
                <div className="space-y-6">
                    <Skeleton className="h-8 w-48" />
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {[1, 2, 3].map((i) => (
                                    <Skeleton key={i} className="h-24 w-full" />
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </DashboardLayout>
        );
    }

    if (!ticket) {
        return (
            <DashboardLayout breadcrumbItems={breadcrumbs}>
                <div className="text-center py-12">
                    <h3 className="text-lg font-medium">Ticket not found</h3>
                    <p className="text-muted-foreground mb-4">
                        The ticket you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
                    </p>
                    <Button onClick={() => router.push("/dashboard/support-tickets")}>
                        <IconArrowLeft className="h-4 w-4 mr-2" />
                        Back to Tickets
                    </Button>
                </div>
            </DashboardLayout>
        );
    }

    const isClosed = ticket.status === LicenseTicketStatus.CLOSED;

    return (
        <DashboardLayout breadcrumbItems={breadcrumbs}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push("/dashboard/support-tickets")}
                    >
                        <IconArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Ticket Header */}
                        <Card>
                            <CardHeader>
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                                    <div>
                                        <CardTitle>{ticket.subject}</CardTitle>
                                        <CardDescription>
                                            Created {formatDate(ticket.created_at)}
                                        </CardDescription>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {getStatusBadge(ticket.status)}
                                        {getPriorityBadge(ticket.priority)}
                                    </div>
                                </div>
                            </CardHeader>
                        </Card>

                        {/* Messages */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Conversation</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                                    {ticket.messages && ticket.messages.length > 0 ? (
                                        ticket.messages.map((message) => {
                                            const isOwner = message.sender_type === MessageSenderType.OWNER;
                                            return (
                                                <div
                                                    key={message.id}
                                                    className={`flex gap-3 ${isOwner ? "flex-row-reverse" : ""}`}
                                                >
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={message.sender?.photo_url} />
                                                        <AvatarFallback>
                                                            {isOwner ? (
                                                                <IconBuildingStore className="h-4 w-4" />
                                                            ) : (
                                                                <IconUser className="h-4 w-4" />
                                                            )}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div
                                                        className={`flex-1 max-w-[80%] ${
                                                            isOwner ? "text-right" : ""
                                                        }`}
                                                    >
                                                        <div
                                                            className={`inline-block rounded-lg p-3 ${
                                                                isOwner
                                                                    ? "bg-primary text-primary-foreground text-left"
                                                                    : "bg-muted text-left"
                                                            }`}
                                                        >
                                                            <p className="text-sm font-medium mb-1">
                                                                {isOwner
                                                                    ? "You"
                                                                    : `${message.sender?.first_name || message.sender?.email?.split('@')[0] || 'User'}${message.sender?.last_name ? ` ${message.sender.last_name}` : ''}`}
                                                            </p>
                                                            <p className="text-sm whitespace-pre-wrap">
                                                                {message.content}
                                                            </p>
                                                            {/* Message Attachments */}
                                                            {message.attachments && message.attachments.length > 0 && (
                                                                <div className="mt-2 grid grid-cols-2 gap-2">
                                                                    {message.attachments.map((url, idx) => {
                                                                        const isPdf = url.toLowerCase().endsWith('.pdf');
                                                                        const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
                                                                        
                                                                        if (isPdf) {
                                                                            return (
                                                                                <a
                                                                                    key={idx}
                                                                                    href={url}
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className="flex items-center gap-2 p-2 rounded-md bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors border border-red-200 dark:border-red-800"
                                                                                >
                                                                                    <svg
                                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                                        viewBox="0 0 24 24"
                                                                                        fill="none"
                                                                                        stroke="currentColor"
                                                                                        strokeWidth="2"
                                                                                        strokeLinecap="round"
                                                                                        strokeLinejoin="round"
                                                                                        className="h-5 w-5 text-red-500 flex-shrink-0"
                                                                                    >
                                                                                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                                                                                        <polyline points="14 2 14 8 20 8" />
                                                                                    </svg>
                                                                                    <span className="text-xs truncate text-red-700 dark:text-red-300">PDF Document</span>
                                                                                    <IconExternalLink className="h-3 w-3 flex-shrink-0 text-red-400" />
                                                                                </a>
                                                                            );
                                                                        }
                                                                        
                                                                        if (isImage) {
                                                                            return (
                                                                                <div
                                                                                    key={idx}
                                                                                    className="relative aspect-square rounded-md overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                                                                                    onClick={() => setPreviewImage(url)}
                                                                                >
                                                                                    <Image
                                                                                        src={url}
                                                                                        alt={`Attachment ${idx + 1}`}
                                                                                        fill
                                                                                        className="object-cover"
                                                                                    />
                                                                                </div>
                                                                            );
                                                                        }
                                                                        
                                                                        // Other file types - open in new tab
                                                                        return (
                                                                            <a
                                                                                key={idx}
                                                                                href={url}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="flex items-center gap-2 p-2 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors border border-gray-300 dark:border-gray-600"
                                                                            >
                                                                                <IconPhoto className="h-5 w-5 text-gray-700 dark:text-gray-300 flex-shrink-0" />
                                                                                <span className="text-xs truncate text-gray-700 dark:text-gray-300">View File</span>
                                                                                <IconExternalLink className="h-3 w-3 flex-shrink-0 text-gray-500 dark:text-gray-400" />
                                                                            </a>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            {formatDate(message.created_at)}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <p className="text-center text-muted-foreground py-8">
                                            No messages yet. Start the conversation!
                                        </p>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Reply Form */}
                                {!isClosed ? (
                                    <div className="mt-4 pt-4 border-t space-y-3">
                                        <div className="flex gap-2">
                                            <Textarea
                                                placeholder="Type your response..."
                                                value={newMessage}
                                                onChange={(e) => setNewMessage(e.target.value)}
                                                rows={3}
                                                className="flex-1"
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter" && e.metaKey) {
                                                        handleSendMessage();
                                                    }
                                                }}
                                            />
                                        </div>

                                        {/* Media Attachments */}
                                        <MultipleMediaSelector
                                            label="Attachments"
                                            value={selectedMedia}
                                            onChange={setSelectedMedia}
                                        />

                                        <div className="flex justify-between items-center">
                                            <p className="text-xs text-muted-foreground">
                                                Press ⌘+Enter to send
                                            </p>
                                            <Button
                                                onClick={handleSendMessage}
                                                disabled={sending || (!newMessage.trim() && selectedMedia.length === 0)}
                                            >
                                                {sending ? (
                                                    <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                                                ) : (
                                                    <IconSend className="h-4 w-4 mr-2" />
                                                )}
                                                Send Response
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mt-4 pt-4 border-t text-center">
                                        <p className="text-muted-foreground">
                                            This ticket is closed. You cannot add new messages.
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Customer Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm">Customer Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarImage src={ticket.user?.photo_url} />
                                        <AvatarFallback>
                                            <IconUser className="h-4 w-4" />
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium">
                                            {ticket.user?.first_name} {ticket.user?.last_name}
                                        </p>
                                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                                            <IconMail className="h-3 w-3" />
                                            {ticket.user?.email}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Ticket Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm">Ticket Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-xs text-muted-foreground">License</p>
                                    <p className="text-sm font-medium">{ticket.license?.name}</p>
                                </div>
                                <Separator />
                                <div>
                                    <p className="text-xs text-muted-foreground">Category</p>
                                    <p className="text-sm font-medium">
                                        {getCategoryLabel(ticket.category)}
                                    </p>
                                </div>
                                {ticket.deployment && (
                                    <>
                                        <Separator />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Related Deployment</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <IconRocket className="h-4 w-4 text-muted-foreground" />
                                                <div>
                                                    <p className="text-sm font-medium">
                                                        {ticket.deployment.configuration?.name || "Deployment"}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {ticket.deployment.environment} • {ticket.deployment.status}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-1 mt-2">
                                                <Link
                                                    href={`/dashboard/deployments/${ticket.deployment.id}`}
                                                    className="text-xs text-primary hover:underline flex items-center gap-1"
                                                >
                                                    <IconExternalLink className="h-3 w-3" />
                                                    View Deployment
                                                </Link>
                                                {ticket.deployment.deployment_url && (
                                                    <a
                                                        href={ticket.deployment.deployment_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs text-muted-foreground hover:underline flex items-center gap-1"
                                                    >
                                                        <IconExternalLink className="h-3 w-3" />
                                                        View Live Site
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}
                                {ticket.resolved_at && (
                                    <>
                                        <Separator />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Resolved At</p>
                                            <p className="text-sm font-medium">
                                                {formatDate(ticket.resolved_at)}
                                            </p>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        {/* Attachments */}
                        {ticket.attachments && ticket.attachments.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <IconPhoto className="h-4 w-4" />
                                        Attachments ({ticket.attachments.length})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 gap-2">
                                        {ticket.attachments.map((url, index) => (
                                            <button
                                                key={index}
                                                onClick={() => setPreviewImage(url)}
                                                className="relative aspect-video rounded-lg overflow-hidden border hover:opacity-80 transition-opacity"
                                            >
                                                <Image
                                                    src={url}
                                                    alt={`Attachment ${index + 1}`}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Actions */}
                        {!isClosed && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm">Manage Ticket</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Status</Label>
                                        <Select
                                            value={ticket.status}
                                            onValueChange={(value) =>
                                                handleStatusChange(value as LicenseTicketStatus)
                                            }
                                            disabled={updating}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {statusOptions.map((option) => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Priority</Label>
                                        <Select
                                            value={ticket.priority}
                                            onValueChange={(value) =>
                                                handlePriorityChange(value as LicenseTicketPriority)
                                            }
                                            disabled={updating}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {priorityOptions.map((option) => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <Separator />

                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className="w-full"
                                                disabled={closing}
                                            >
                                                {closing ? (
                                                    <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                                                ) : (
                                                    <IconX className="h-4 w-4 mr-2" />
                                                )}
                                                Close Ticket
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Close this ticket?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Are you sure you want to close this ticket? The customer will be notified.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={handleCloseTicket}>
                                                    Close Ticket
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>

            {/* Image Preview Dialog */}
            <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
                <DialogContent className="max-w-4xl p-2">
                    <DialogTitle className="sr-only">Attachment Preview</DialogTitle>
                    {previewImage && (
                        <div className="relative aspect-video">
                            <Image
                                src={previewImage}
                                alt="Preview"
                                fill
                                className="object-contain"
                            />
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}
