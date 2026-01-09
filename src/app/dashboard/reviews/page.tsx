"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  IconRefresh,
  IconStar,
  IconStarFilled,
  IconStarHalfFilled,
  IconMessageCircle,
  IconCheck,
  IconX,
  IconClock,
  IconLoader2,
} from "@tabler/icons-react";
import DashboardLayout from "@/components/dashboard-layout";
import { BreadcrumbItem } from "@/components/breadcrumb";
import { formatDate } from "@/utils/format";
import { Review, ReviewStatus } from "@/common/types/review";
import {
  useGetOwnerReviewsQuery,
  useGetPendingReviewCountQuery,
  useApproveReviewMutation,
} from "@/store/features/reviews";
import { toast } from "sonner";

const breadcrumbItems: BreadcrumbItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Reviews", href: "/dashboard/reviews" },
];

// Helper to render stars
const RatingStars = ({ rating }: { rating: number }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-0.5">
      {[...Array(fullStars)].map((_, i) => (
        <IconStarFilled key={`full-${i}`} className="h-4 w-4 text-yellow-500" />
      ))}
      {hasHalfStar && <IconStarHalfFilled className="h-4 w-4 text-yellow-500" />}
      {[...Array(emptyStars)].map((_, i) => (
        <IconStar key={`empty-${i}`} className="h-4 w-4 text-gray-300" />
      ))}
    </div>
  );
};

const getStatusBadge = (status: ReviewStatus) => {
  switch (status) {
    case ReviewStatus.PENDING:
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <IconClock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
    case ReviewStatus.APPROVED:
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <IconCheck className="h-3 w-3 mr-1" />
          Approved
        </Badge>
      );
    case ReviewStatus.REJECTED:
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <IconX className="h-3 w-3 mr-1" />
          Rejected
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function ReviewsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  
  // Dialog state for rejection
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Fetch owner's reviews
  const {
    data: reviewsData,
    isLoading,
    refetch,
  } = useGetOwnerReviewsQuery({
    page,
    limit: 20,
    status: statusFilter !== "all" ? (statusFilter as ReviewStatus) : undefined,
  });

  // Fetch pending count
  const { data: pendingCountData } = useGetPendingReviewCountQuery();

  // Mutation for approving/rejecting
  const [approveReview, { isLoading: isApproving }] = useApproveReviewMutation();

  const reviews = useMemo(() => {
    const items = reviewsData?.items || [];
    if (ratingFilter !== "all") {
      return items.filter((r) => r.rating === Number(ratingFilter));
    }
    return items;
  }, [reviewsData?.items, ratingFilter]);

  const totalPages = reviewsData?.meta?.totalPages || 1;
  const pendingCount = pendingCountData?.pending_count || 0;

  // Calculate stats
  const stats = useMemo(() => {
    const allReviews = reviewsData?.items || [];
    return {
      total: reviewsData?.meta?.totalItems || allReviews.length,
      pending: pendingCount,
      approved: allReviews.filter((r) => r.status === ReviewStatus.APPROVED).length,
      rejected: allReviews.filter((r) => r.status === ReviewStatus.REJECTED).length,
    };
  }, [reviewsData, pendingCount]);

  const handleApprove = async (review: Review) => {
    try {
      await approveReview({
        reviewId: review.id,
        data: { status: ReviewStatus.APPROVED },
      }).unwrap();
      toast.success("Review approved successfully");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to approve review");
    }
  };

  const openRejectDialog = (review: Review) => {
    setSelectedReview(review);
    setRejectionReason("");
    setRejectDialogOpen(true);
  };

  const handleReject = async () => {
    if (!selectedReview) return;
    if (!rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    try {
      await approveReview({
        reviewId: selectedReview.id,
        data: {
          status: ReviewStatus.REJECTED,
          rejection_reason: rejectionReason,
        },
      }).unwrap();
      toast.success("Review rejected");
      setRejectDialogOpen(false);
      setSelectedReview(null);
      setRejectionReason("");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to reject review");
    }
  };

  return (
    <DashboardLayout breadcrumbItems={breadcrumbItems}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Reviews</h1>
            <p className="text-muted-foreground">
              Manage customer reviews - approve or reject before they appear publicly
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
              <IconRefresh className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
              <IconMessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card className={pendingCount > 0 ? "border-yellow-200 bg-yellow-50/50" : ""}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <IconClock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
              {pendingCount > 0 && (
                <p className="text-xs text-yellow-600">Requires your attention</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <IconCheck className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
              <p className="text-xs text-muted-foreground">Visible to public</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <IconX className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
              <p className="text-xs text-muted-foreground">Hidden from public</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="w-48">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value={ReviewStatus.PENDING}>Pending</SelectItem>
                <SelectItem value={ReviewStatus.APPROVED}>Approved</SelectItem>
                <SelectItem value={ReviewStatus.REJECTED}>Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-40">
            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="5">5 Stars</SelectItem>
                <SelectItem value="4">4 Stars</SelectItem>
                <SelectItem value="3">3 Stars</SelectItem>
                <SelectItem value="2">2 Stars</SelectItem>
                <SelectItem value="1">1 Star</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Reviews Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Reviews</CardTitle>
            <CardDescription>
              Review customer feedback and decide which reviews to show publicly
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <IconMessageCircle className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>No reviews found</p>
                <p className="text-sm">
                  Reviews will appear here when customers leave feedback
                </p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reviewer</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead className="max-w-md">Review</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reviews.map((review) => (
                      <TableRow key={review.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {review.user
                                ? `${review.user.first_name || ""} ${review.user.last_name || ""}`.trim() ||
                                  "Anonymous"
                                : "Anonymous"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {review.user?.email || ""}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {review.project?.name || "Unknown Project"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <RatingStars rating={review.rating} />
                            <span className="text-sm font-medium">{review.rating}</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-md">
                          {review.title && (
                            <p className="font-medium mb-1">{review.title}</p>
                          )}
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {review.comment || "No comment provided"}
                          </p>
                          {review.rejection_reason && (
                            <p className="text-xs text-red-500 mt-1">
                              Rejection reason: {review.rejection_reason}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(review.status)}</TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(review.created_at)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {review.status === ReviewStatus.PENDING && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                  onClick={() => handleApprove(review)}
                                  disabled={isApproving}
                                >
                                  {isApproving ? (
                                    <IconLoader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <IconCheck className="h-4 w-4" />
                                  )}
                                  <span className="ml-1">Approve</span>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => openRejectDialog(review)}
                                  disabled={isApproving}
                                >
                                  <IconX className="h-4 w-4" />
                                  <span className="ml-1">Reject</span>
                                </Button>
                              </>
                            )}
                            {review.status === ReviewStatus.APPROVED && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => openRejectDialog(review)}
                                disabled={isApproving}
                              >
                                <IconX className="h-4 w-4" />
                                <span className="ml-1">Reject</span>
                              </Button>
                            )}
                            {review.status === ReviewStatus.REJECTED && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => handleApprove(review)}
                                disabled={isApproving}
                              >
                                {isApproving ? (
                                  <IconLoader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <IconCheck className="h-4 w-4" />
                                )}
                                <span className="ml-1">Approve</span>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Page {page} of {totalPages}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Rejection Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Review</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this review. This will be recorded
              but not shown to the reviewer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedReview && (
              <div className="p-3 bg-muted rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <RatingStars rating={selectedReview.rating} />
                  <span className="font-medium">{selectedReview.rating} stars</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  &ldquo;{selectedReview.comment || "No comment"}&rdquo;
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Reason for rejection *</Label>
              <Textarea
                id="rejection-reason"
                placeholder="e.g., Contains inappropriate content, spam, etc."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isApproving || !rejectionReason.trim()}
            >
              {isApproving ? (
                <>
                  <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                  Rejecting...
                </>
              ) : (
                "Reject Review"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
