"use client";

import { useState, useEffect } from "react";
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
import { Review, ProjectReviewStats } from "@/common/types/review";
import { Project } from "@/common/types/project";
import reviewService from "@/services/review";
import { toast } from "sonner";
import { useGetProjectsQuery } from "@/store/features/projects";

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
  const [reviews, setReviews] = useState<Review[]>([]);
  const [projectStats, setProjectStats] = useState<ProjectReviewStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(10);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [ratingFilter, setRatingFilter] = useState<string>("all");

  // Fetch user's projects
  const { data: projectsData } = useGetProjectsQuery({ page: 1, limit: 100 });
  const projects: Project[] = projectsData?.items || [];

  const fetchReviews = async () => {
    if (selectedProjectId === "all" && projects.length === 0) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // If "all" is selected, fetch from all projects
      const projectIds = selectedProjectId === "all" 
        ? projects.map((p: Project) => p.id) 
        : [selectedProjectId];
      
      const allReviews: Review[] = [];
      
      for (const projectId of projectIds) {
        try {
          const response = await reviewService.getProjectReviews(
            projectId,
            currentPage,
            itemsPerPage
          );
          allReviews.push(...response.reviews);
          
          // Get stats for single selected project
          if (selectedProjectId !== "all") {
            const stats = await reviewService.getProjectStats(projectId);
            setProjectStats(stats);
          }
        } catch {
          // Continue if project has no reviews
        }
      }

      // Filter by rating if needed
      const filteredReviews = ratingFilter !== "all"
        ? allReviews.filter(r => r.rating === Number(ratingFilter))
        : allReviews;

      setReviews(filteredReviews);
      setTotalItems(filteredReviews.length);
      
      if (selectedProjectId === "all") {
        setProjectStats(null);
      }
    } catch (error) {
      toast.error("Failed to fetch reviews");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (projects.length > 0) {
      fetchReviews();
    }
  }, [currentPage, selectedProjectId, ratingFilter, projects.length]);

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Calculate overall stats
  const overallStats = {
    totalReviews: reviews.length,
    averageRating: reviews.length > 0 
      ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length 
      : 0,
    fiveStarCount: reviews.filter(r => r.rating === 5).length,
    fourStarCount: reviews.filter(r => r.rating === 4).length,
    threeStarCount: reviews.filter(r => r.rating === 3).length,
    twoStarCount: reviews.filter(r => r.rating === 2).length,
    oneStarCount: reviews.filter(r => r.rating === 1).length,
  };

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
            <Button variant="outline" onClick={fetchReviews} disabled={isLoading}>
              <IconRefresh className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="w-64">
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
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
        {projectStats && (
          <Card>
            <CardHeader>
              <CardTitle>Rating Distribution</CardTitle>
              <CardDescription>Breakdown of ratings for selected project</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = projectStats.rating_distribution[star] || 0;
                  const percentage = projectStats.total_reviews > 0 
                    ? (count / projectStats.total_reviews) * 100 
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

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                      {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} reviews
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => p - 1)}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => p + 1)}
                        disabled={currentPage === totalPages}
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
    </DashboardLayout>
  );
}
