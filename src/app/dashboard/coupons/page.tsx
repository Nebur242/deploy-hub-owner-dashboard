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
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  IconPlus,
  IconRefresh,
  IconEdit,
  IconTrash,
  IconTicket,
  IconPercentage,
  IconCurrencyDollar,
  IconCopy,
} from "@tabler/icons-react";
import DashboardLayout from "@/components/dashboard-layout";
import { BreadcrumbItem } from "@/components/breadcrumb";
import { formatDate } from "@/utils/format";
import { Coupon, CreateCouponDto } from "@/common/types/coupon";
import couponService from "@/services/coupon";
import { toast } from "sonner";

const breadcrumbItems: BreadcrumbItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Coupons", href: "/dashboard/coupons" },
];

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(10);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreateCouponDto>({
    code: "",
    discount_type: "percent",
    discount_value: 10,
    max_uses: undefined,
    description: "",
    expires_at: undefined,
  });

  const fetchCoupons = async () => {
    try {
      setIsLoading(true);
      const response = await couponService.getCoupons(currentPage, itemsPerPage);
      setCoupons(response.items);
      setTotalItems(response.meta.totalItems);
    } catch (error) {
      toast.error("Failed to fetch coupons");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, [currentPage]);

  const handleCreateCoupon = async () => {
    try {
      setIsSubmitting(true);
      await couponService.createCoupon(formData);
      toast.success("Coupon created successfully");
      setIsCreateDialogOpen(false);
      resetForm();
      fetchCoupons();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to create coupon");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateCoupon = async () => {
    if (!selectedCoupon) return;

    try {
      setIsSubmitting(true);
      await couponService.updateCoupon(selectedCoupon.id, {
        discount_value: formData.discount_value,
        description: formData.description,
        expires_at: formData.expires_at,
        is_active: selectedCoupon.is_active,
      });
      toast.success("Coupon updated successfully");
      setIsEditDialogOpen(false);
      setSelectedCoupon(null);
      resetForm();
      fetchCoupons();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to update coupon");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm("Are you sure you want to delete this coupon?")) return;

    try {
      await couponService.deleteCoupon(id);
      toast.success("Coupon deleted successfully");
      fetchCoupons();
    } catch (error) {
      toast.error("Failed to delete coupon");
    }
  };

  const handleToggleActive = async (coupon: Coupon) => {
    try {
      await couponService.updateCoupon(coupon.id, {
        is_active: !coupon.is_active,
      });
      toast.success(`Coupon ${coupon.is_active ? "deactivated" : "activated"} successfully`);
      fetchCoupons();
    } catch (error) {
      toast.error("Failed to update coupon");
    }
  };

  const resetForm = () => {
    setFormData({
      code: "",
      discount_type: "percent",
      discount_value: 10,
      max_uses: undefined,
      description: "",
      expires_at: undefined,
    });
  };

  const openEditDialog = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setFormData({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      max_uses: coupon.max_uses || undefined,
      description: coupon.description || "",
      expires_at: coupon.expires_at || undefined,
    });
    setIsEditDialogOpen(true);
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Coupon code "${code}" copied to clipboard`);
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <DashboardLayout breadcrumbItems={breadcrumbItems}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Coupons</h1>
            <p className="text-muted-foreground">
              Create and manage discount codes for your licenses
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={fetchCoupons} disabled={isLoading}>
              <IconRefresh className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <IconPlus className="mr-2 h-4 w-4" />
                  Create Coupon
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Coupon</DialogTitle>
                  <DialogDescription>
                    Create a new discount coupon for your licenses
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="code">Coupon Code</Label>
                    <Input
                      id="code"
                      placeholder="SUMMER2025"
                      value={formData.code}
                      onChange={(e) =>
                        setFormData({ ...formData, code: e.target.value.toUpperCase() })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="discount_type">Discount Type</Label>
                      <Select
                        value={formData.discount_type}
                        onValueChange={(value: "percent" | "fixed") =>
                          setFormData({ ...formData, discount_type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percent">Percentage</SelectItem>
                          <SelectItem value="fixed">Fixed Amount</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="discount_value">
                        {formData.discount_type === "percent" ? "Percentage" : "Amount"}
                      </Label>
                      <Input
                        id="discount_value"
                        type="number"
                        min={0}
                        max={formData.discount_type === "percent" ? 100 : undefined}
                        value={formData.discount_value}
                        onChange={(e) =>
                          setFormData({ ...formData, discount_value: Number(e.target.value) })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="max_uses">Max Uses (optional)</Label>
                      <Input
                        id="max_uses"
                        type="number"
                        min={1}
                        placeholder="Unlimited"
                        value={formData.max_uses || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            max_uses: e.target.value ? Number(e.target.value) : undefined,
                          })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="expires_at">Expiration (optional)</Label>
                      <Input
                        id="expires_at"
                        type="datetime-local"
                        value={formData.expires_at || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            expires_at: e.target.value || undefined,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description (optional)</Label>
                    <Input
                      id="description"
                      placeholder="Summer sale promotion"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCreateDialogOpen(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleCreateCoupon} disabled={isSubmitting || !formData.code}>
                    {isSubmitting ? "Creating..." : "Create Coupon"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Coupons</CardTitle>
              <IconTicket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalItems}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Coupons</CardTitle>
              <IconPercentage className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {coupons.filter((c) => c.is_active).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Redemptions</CardTitle>
              <IconCurrencyDollar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {coupons.reduce((sum, c) => sum + c.current_uses, 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coupons Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Coupons</CardTitle>
            <CardDescription>Manage your discount codes</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : coupons.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <IconTicket className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>No coupons found</p>
                <p className="text-sm">Create your first coupon to get started</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Usage</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {coupons.map((coupon) => (
                      <TableRow key={coupon.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="font-mono font-bold">{coupon.code}</code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => copyToClipboard(coupon.code)}
                            >
                              <IconCopy className="h-3 w-3" />
                            </Button>
                          </div>
                          {coupon.description && (
                            <p className="text-sm text-muted-foreground">{coupon.description}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          {coupon.discount_type === "percent" ? (
                            <span>{coupon.discount_value}% off</span>
                          ) : (
                            <span>${coupon.discount_value} off</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span>
                            {coupon.current_uses}
                            {coupon.max_uses !== null && ` / ${coupon.max_uses}`}
                          </span>
                          {coupon.remaining_uses !== null && coupon.remaining_uses <= 5 && (
                            <p className="text-xs text-orange-500">
                              {coupon.remaining_uses} uses left
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          {coupon.expires_at ? (
                            <span
                              className={
                                new Date(coupon.expires_at) < new Date()
                                  ? "text-red-500"
                                  : ""
                              }
                            >
                              {formatDate(coupon.expires_at)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Never</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={coupon.is_active}
                              onCheckedChange={() => handleToggleActive(coupon)}
                            />
                            <Badge
                              variant={coupon.is_active ? "default" : "secondary"}
                            >
                              {coupon.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(coupon)}
                            >
                              <IconEdit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteCoupon(coupon.id)}
                            >
                              <IconTrash className="h-4 w-4 text-red-500" />
                            </Button>
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
                      Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                      {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} coupons
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

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Coupon</DialogTitle>
              <DialogDescription>
                Update the coupon details
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Coupon Code</Label>
                <Input value={formData.code} disabled />
                <p className="text-xs text-muted-foreground">
                  Coupon codes cannot be changed after creation
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Discount Type</Label>
                  <Input value={formData.discount_type} disabled />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit_discount_value">
                    {formData.discount_type === "percent" ? "Percentage" : "Amount"}
                  </Label>
                  <Input
                    id="edit_discount_value"
                    type="number"
                    min={0}
                    max={formData.discount_type === "percent" ? 100 : undefined}
                    value={formData.discount_value}
                    onChange={(e) =>
                      setFormData({ ...formData, discount_value: Number(e.target.value) })
                    }
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_expires_at">Expiration (optional)</Label>
                <Input
                  id="edit_expires_at"
                  type="datetime-local"
                  value={formData.expires_at || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      expires_at: e.target.value || undefined,
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_description">Description (optional)</Label>
                <Input
                  id="edit_description"
                  placeholder="Summer sale promotion"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setSelectedCoupon(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdateCoupon} disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
