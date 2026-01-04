"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    IconTicket,
    IconSearch,
    IconClock,
    IconCheck,
    IconAlertCircle,
    IconMessageCircle,
    IconChevronLeft,
    IconChevronRight,
    IconUser,
    IconHourglass,
} from "@tabler/icons-react";
import {
    useGetOwnerLicenseTicketsQuery,
    useGetOwnerUnreadCountQuery,
    useGetTicketStatisticsQuery,
} from "@/store/features/license-tickets";
import { LicenseTicket, LicenseTicketStatus, LicenseTicketPriority } from "@/common/types";
import { formatDate } from "@/utils/format";
import { BreadcrumbItem } from "@/components/breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";

const breadcrumbs: BreadcrumbItem[] = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Support Tickets", href: "/dashboard/support-tickets" },
];

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
            return <Badge variant="outline" className="border-gray-300 text-gray-600">Low</Badge>;
        case LicenseTicketPriority.MEDIUM:
            return <Badge variant="outline" className="border-blue-300 text-blue-600">Medium</Badge>;
        case LicenseTicketPriority.HIGH:
            return <Badge variant="outline" className="border-orange-300 text-orange-600">High</Badge>;
        case LicenseTicketPriority.URGENT:
            return <Badge variant="outline" className="border-red-300 text-red-600">Urgent</Badge>;
        default:
            return <Badge variant="outline">{priority}</Badge>;
    }
};

export default function SupportTicketsPage() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [activeTab, setActiveTab] = useState("all");
    const itemsPerPage = 10;

    // Get query params based on filters
    const queryParams = {
        page: currentPage,
        limit: itemsPerPage,
        status: statusFilter !== "all" ? (statusFilter as LicenseTicketStatus) : undefined,
        search: searchTerm || undefined,
    };

    const { data, isLoading, isFetching } = useGetOwnerLicenseTicketsQuery(queryParams);
    const { data: unreadData } = useGetOwnerUnreadCountQuery();
    const { data: statsData } = useGetTicketStatisticsQuery();

    const tickets = data?.items || [];
    const totalPages = data?.meta?.totalPages || 1;
    const unreadCount = unreadData?.count || 0;
    const stats = statsData;

    const handleViewTicket = (ticketId: string) => {
        router.push(`/dashboard/support-tickets/${ticketId}`);
    };

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage((prev) => prev - 1);
        }
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage((prev) => prev + 1);
        }
    };

    const filteredTickets = tickets.filter((ticket) => {
        // Additional client-side filtering if needed
        if (activeTab === "unread" && !ticket.unread_by_owner) return false;
        if (activeTab === "needs-response" && ticket.status !== LicenseTicketStatus.PENDING_OWNER_RESPONSE && ticket.status !== LicenseTicketStatus.OPEN) return false;
        if (activeTab === "closed" && ticket.status !== LicenseTicketStatus.CLOSED) return false;
        return true;
    });

    return (
        <DashboardLayout breadcrumbItems={breadcrumbs}>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Support Tickets</h1>
                    <p className="text-muted-foreground">
                        Manage support requests from your license customers
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-5">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total</CardTitle>
                            <IconTicket className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.total || 0}</div>
                        </CardContent>
                    </Card>
                    <Card className="border-red-200 bg-red-50/50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Needs Response</CardTitle>
                            <IconAlertCircle className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">
                                {stats?.pending_response || 0}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                            <IconHourglass className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.in_progress || 0}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
                            <IconCheck className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.resolved || 0}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Unread</CardTitle>
                            <IconMessageCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.unread || 0}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tickets List */}
                <Card>
                    <CardHeader>
                        <CardTitle>All Tickets</CardTitle>
                        <CardDescription>View and respond to customer support requests</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {/* Search and Filter */}
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="relative flex-1">
                                    <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search tickets..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="w-full sm:w-[180px]">
                                        <SelectValue placeholder="Filter by status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Statuses</SelectItem>
                                        <SelectItem value={LicenseTicketStatus.OPEN}>Open</SelectItem>
                                        <SelectItem value={LicenseTicketStatus.PENDING_OWNER_RESPONSE}>Needs Response</SelectItem>
                                        <SelectItem value={LicenseTicketStatus.PENDING_USER_RESPONSE}>Awaiting Customer</SelectItem>
                                        <SelectItem value={LicenseTicketStatus.IN_PROGRESS}>In Progress</SelectItem>
                                        <SelectItem value={LicenseTicketStatus.RESOLVED}>Resolved</SelectItem>
                                        <SelectItem value={LicenseTicketStatus.CLOSED}>Closed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Tabs */}
                            <Tabs value={activeTab} onValueChange={setActiveTab}>
                                <TabsList>
                                    <TabsTrigger value="all">All</TabsTrigger>
                                    <TabsTrigger value="unread" className="relative">
                                        Unread
                                        {unreadCount > 0 && (
                                            <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                                                {unreadCount}
                                            </span>
                                        )}
                                    </TabsTrigger>
                                    <TabsTrigger value="needs-response" className="relative">
                                        Needs Response
                                        {(stats?.pending_response || 0) > 0 && (
                                            <span className="ml-1 bg-orange-500 text-white text-xs rounded-full px-1.5 py-0.5">
                                                {stats?.pending_response}
                                            </span>
                                        )}
                                    </TabsTrigger>
                                    <TabsTrigger value="closed">Closed</TabsTrigger>
                                </TabsList>
                            </Tabs>

                            {/* Tickets List */}
                            {isLoading ? (
                                <div className="space-y-4">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="border rounded-lg p-4">
                                            <Skeleton className="h-5 w-3/4 mb-2" />
                                            <Skeleton className="h-4 w-1/2 mb-2" />
                                            <Skeleton className="h-4 w-1/4" />
                                        </div>
                                    ))}
                                </div>
                            ) : filteredTickets.length === 0 ? (
                                <div className="text-center py-12">
                                    <IconTicket className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                                    <h3 className="text-lg font-medium">No tickets found</h3>
                                    <p className="text-muted-foreground">
                                        No support tickets match your filters
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {filteredTickets.map((ticket) => (
                                        <div
                                            key={ticket.id}
                                            onClick={() => handleViewTicket(ticket.id)}
                                            className={`border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                                                ticket.unread_by_owner ? "bg-blue-50/50 border-blue-200" : ""
                                            } ${
                                                ticket.status === LicenseTicketStatus.PENDING_OWNER_RESPONSE 
                                                    ? "border-l-4 border-l-red-500" 
                                                    : ""
                                            }`}
                                        >
                                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                                                <div className="space-y-1 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        {ticket.unread_by_owner && (
                                                            <span className="h-2 w-2 bg-blue-500 rounded-full" />
                                                        )}
                                                        <h4 className="font-medium">{ticket.subject}</h4>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        {ticket.license?.name}
                                                    </p>
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <Avatar className="h-5 w-5">
                                                            <AvatarImage src={ticket.user?.photo_url} />
                                                            <AvatarFallback>
                                                                <IconUser className="h-3 w-3" />
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <span>
                                                            {ticket.user?.first_name} {ticket.user?.last_name}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    {getStatusBadge(ticket.status)}
                                                    {getPriorityBadge(ticket.priority)}
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                                                <span>Created {formatDate(ticket.created_at)}</span>
                                                {ticket.last_message_at && (
                                                    <span>Last reply {formatDate(ticket.last_message_at)}</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Pagination */}
                            {filteredTickets.length > 0 && totalPages > 1 && (
                                <div className="flex items-center justify-between pt-4">
                                    <p className="text-sm text-muted-foreground">
                                        Page {currentPage} of {totalPages}
                                    </p>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handlePreviousPage}
                                            disabled={currentPage === 1 || isFetching}
                                        >
                                            <IconChevronLeft className="h-4 w-4" />
                                            Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleNextPage}
                                            disabled={currentPage === totalPages || isFetching}
                                        >
                                            Next
                                            <IconChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
