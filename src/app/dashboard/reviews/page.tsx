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
import { Skeleton } from "@/components/ui/skeleton";
import {
  IconRefresh,
  IconStar,
  IconStarFilled,
  IconStarHalfFilled,
  IconMessageCircle,
} from "@tabler/icons-react";
import DashboardLayout from "@/components/dashboard-layout";
import { BreadcrumbItem } from "@/components/breadcrumb";
import { formatDate } from "@/utils/format";
import { Review } from "@/common/types/review";
import { Project } from "@/common/types/project";
import { useGetProjectsQuery } from "@/store/features/projects";
import { useGetProjectReviewsQuery } from "@/store/features/reviews";

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

export default function ReviewsPage() {
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [ratingFilter, setRatingFilter] = useState<string>("all");

  // Fetch user's projects
  const { data: projectsData, isLoading: projectsLoading } = useGetProjectsQuery({ page: 1, limit: 100 });
  const projects: Project[] = projectsData?.items || [];

  // Set default project when projects load
  const effectiveProjectId = selectedProjectId || (projects.length > 0 ? projects[0].id : "");

  // Fetch reviews for the selected project using RTK Query
  const { 
    data: reviewsData, 
    isLoading: reviewsLoading, 
    refetch 
  } = useGetProjectReviewsQuery(
    { projectId: effectiveProjectId, page: 1, limit: 100 },
    { skip: !effectiveProjectId }
  );

  const reviews = useMemo(() => {
    const items = reviewsData?.items || [];
    // Filter by rating if needed
    if (ratingFilter !== "all") {
      return items.filter(r => r.rating === Number(ratingFilter));
    }
    return items;
  }, [reviewsData?.items, ratingFilter]);

  const reviewStats = reviewsData?.stats;
  const isLoading = projectsLoading || reviewsLoading;

  // Calculate overall stats
  const overallStats = useMemo(() => ({
    totalReviews: reviews.length,
    averageRating: reviewStats?.average_rating || (reviews.length > 0 
      ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length 
      : 0),
    fiveStarCount: reviewStats?.rating_distribution?.[5] || reviews.filter(r => r.rating === 5).length,
    fourStarCount: reviewStats?.rating_distribution?.[4] || reviews.filter(r => r.rating === 4).length,
    threeStarCount: reviewStats?.rating_distribution?.[3] || reviews.filter(r => r.rating === 3).length,
    twoStarCount: reviewStats?.rating_distribution?.[2] || reviews.filter(r => r.rating === 2).length,
    oneStarCount: reviewStats?.rating_distribution?.[1] || reviews.filter(r => r.rating === 1).length,
  }), [reviews, reviewStats]);

  return (
    <DashboardLayout breadcrumbItems={breadcrumbItems}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Reviews</h1>
            <p className="text-muted-foreground">
              View and manage customer reviews for your projects
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
              <IconRefresh className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="w-64">
            <Select value={selectedProjectId || effectiveProjectId} onValueChange={setSelectedProjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
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

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
              <IconMessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overallStats.totalReviews}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <IconStarFilled className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {overallStats.averageRating.toFixed(1)}
              </div>
              <RatingStars rating={overallStats.averageRating} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">5 Star Reviews</CardTitle>
              <IconStarFilled className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overallStats.fiveStarCount}</div>
              <p className="text-xs text-muted-foreground">
                {overallStats.totalReviews > 0 
                  ? `${Math.round((overallStats.fiveStarCount / overallStats.totalReviews) * 100)}% of total`
                  : "No reviews yet"
                }
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Positive Reviews</CardTitle>
              <IconStar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {overallStats.fiveStarCount + overallStats.fourStarCount}
              </div>
              <p className="text-xs text-muted-foreground">
                4+ star reviews
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Rating Distribution (shown for single project) */}
        {reviewStats && (
          <Card>
            <CardHeader>
              <CardTitle>Rating Distribution</CardTitle>
              <CardDescription>Breakdown of ratings for selected project</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = reviewStats.rating_distribution[star] || 0;
                  const percentage = reviews.length > 0 
                    ? (count / reviews.length) * 100 
                    : 0;
                  return (
                    <div key={star} className="flex items-center gap-2">
                      <span className="w-8 text-sm">{star} ★</span>
                      <div className="flex-1 h-4 bg-secondary rounded overflow-hidden">
                        <div 
                          className="h-full bg-yellow-500 transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="w-12 text-sm text-muted-foreground">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reviews Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Reviews</CardTitle>
            <CardDescription>Customer feedback for your projects</CardDescription>
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
                <p className="text-sm">Reviews will appear here when customers leave feedback</p>
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
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reviews.map((review) => (
                      <TableRow key={review.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {review.user
                                ? `${review.user.first_name || ""} ${review.user.last_name || ""}`.trim() || "Anonymous"
                                : "Anonymous"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {review.user?.email || ""}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {projects.find(p => p.id === review.project_id)?.name || "Unknown Project"}
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
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(review.created_at)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
