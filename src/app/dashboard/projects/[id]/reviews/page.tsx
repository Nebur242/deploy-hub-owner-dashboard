"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { Star, MessageSquare, User, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { IconArrowBack } from "@tabler/icons-react";

import DashboardLayout from "@/components/dashboard-layout";
import { BreadcrumbItem } from "@/components/breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DisplayStars } from "@/components/display-stars";

import { useGetProjectReviewsQuery } from "@/store/features/reviews";
import { useGetProjectQuery } from "@/store/features/projects";

export default function ProjectReviewsPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data: project, isLoading: projectLoading } = useGetProjectQuery(projectId);
  const { data: reviewsData, isLoading: reviewsLoading, error: reviewsError } = useGetProjectReviewsQuery({
    projectId,
    page,
    limit,
  });

  // Debug logging
  const reviews = reviewsData?.items || [];
  const totalReviews = reviewsData?.meta?.totalItems || reviewsData?.meta?.itemCount || reviews.length;
  const totalPages = reviewsData?.meta?.totalPages || 1;

  // Calculate rating distribution
  const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => {
    const count = reviews.filter((r) => Math.round(r.rating) === rating).length;
    const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
    return { rating, count, percentage };
  });

  // Calculate average rating
  const averageRating =
    totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  // Breadcrumb items
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Projects", href: "/dashboard/projects" },
    { label: project?.name || "Project", href: `/dashboard/projects/${projectId}` },
    { label: "Reviews" },
  ];

  return (
    <DashboardLayout
      breadcrumbItems={breadcrumbItems}
      title={`Reviews for ${projectLoading ? "..." : project?.name}`}
    >
      <div className="flex flex-col gap-6">
        <Button variant="outline" asChild className="w-fit">
          <Link href={`/dashboard/projects/${projectId}`}>
            <IconArrowBack className="h-4 w-4 mr-2" /> Back to Project
          </Link>
        </Button>

        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          {/* Reviews List */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Customer Reviews ({totalReviews})
                </CardTitle>
                <CardDescription>
                  All reviews from customers who purchased this project
                </CardDescription>
              </CardHeader>
              <CardContent>
                {reviewsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-20 w-full" />
                      </div>
                    ))}
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No reviews yet</h3>
                    <p className="text-muted-foreground text-sm">
                      This project hasn&apos;t received any reviews from customers yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {reviews.map((review) => (
                      <div key={review.id} className="border-b pb-6 last:border-0 last:pb-0">
                        <div className="flex items-start gap-4">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              <User className="h-5 w-5" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                              <span className="font-medium">
                                {review.user?.first_name && review.user?.last_name
                                  ? `${review.user.first_name} ${review.user.last_name}`
                                  : review.user?.email || "Anonymous"}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {format(new Date(review.created_at), "MMM d, yyyy")}
                              </span>
                            </div>
                            <div className="mt-1">
                              <DisplayStars rating={review.rating} size="sm" />
                            </div>
                            {review.title && (
                              <h4 className="mt-2 font-medium">{review.title}</h4>
                            )}
                            {review.comment && (
                              <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
                                {review.comment}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 pt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={page === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>
                        <span className="text-sm text-muted-foreground">
                          Page {page} of {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                          disabled={page === totalPages}
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Rating Statistics */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Rating Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reviewsLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-32 w-full" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Average Rating */}
                    <div className="text-center">
                      <div className="text-4xl font-bold">
                        {averageRating > 0 ? averageRating.toFixed(1) : "-"}
                      </div>
                      <div className="flex justify-center mt-2">
                        <DisplayStars rating={averageRating} size="md" />
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Based on {totalReviews} review{totalReviews !== 1 ? "s" : ""}
                      </p>
                    </div>

                    {/* Rating Distribution */}
                    <div className="space-y-2">
                      {ratingDistribution.map(({ rating, count, percentage }) => (
                        <div key={rating} className="flex items-center gap-2">
                          <span className="text-sm w-8">{rating} ★</span>
                          <Progress value={percentage} className="flex-1 h-2" />
                          <span className="text-sm text-muted-foreground w-8">
                            {count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}