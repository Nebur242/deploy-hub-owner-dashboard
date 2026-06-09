"use client";

import { useEffect, useMemo, useRef } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { BreadcrumbItem } from "@/components/breadcrumb";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/utils/format";
import {
  useCreatePayoutOnboardingLinkMutation,
  useGetPayoutBalanceQuery,
  useGetPayoutLedgerQuery,
  useGetPayoutStatusQuery,
  useSyncPayoutStatusMutation,
  type LedgerStatus,
  type PayoutAccountStatus,
} from "@/store/features/payouts";
import {
  IconAlertCircle,
  IconArrowRight,
  IconCheck,
  IconRefresh,
  IconWallet,
} from "@tabler/icons-react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const breadcrumbItems: BreadcrumbItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Payouts", href: "/dashboard/payouts" },
];

const statusLabels: Record<PayoutAccountStatus, string> = {
  not_started: "Not started",
  onboarding: "Onboarding",
  active: "Ready",
  restricted: "Action needed",
  disabled: "Disabled",
};

const ledgerLabels: Record<LedgerStatus, string> = {
  pending: "Pending",
  available: "Available",
  processing: "Processing",
  paid: "Paid",
  reversed: "Reversed",
  failed: "Failed",
};

function statusVariant(status?: PayoutAccountStatus) {
  if (status === "active") return "default";
  if (status === "restricted" || status === "disabled") return "destructive";
  return "secondary";
}

function ledgerVariant(status: LedgerStatus) {
  if (status === "paid") return "default";
  if (status === "failed" || status === "reversed") return "destructive";
  return "secondary";
}

export default function PayoutsPage() {
  const searchParams = useSearchParams();
  const didAutoSync = useRef(false);
  const { data: status, isLoading: isStatusLoading } = useGetPayoutStatusQuery();
  const { data: balance, isLoading: isBalanceLoading } = useGetPayoutBalanceQuery();
  const { data: ledger = [], isLoading: isLedgerLoading } = useGetPayoutLedgerQuery();
  const [createOnboardingLink, { isLoading: isCreatingLink }] =
    useCreatePayoutOnboardingLinkMutation();
  const [syncPayoutStatus, { isLoading: isSyncing }] = useSyncPayoutStatusMutation();

  useEffect(() => {
    const returnedFromSetup = searchParams.get("setup") === "return";
    const returnedFromLegacyStripe = searchParams.get("stripe") === "return";
    if ((!returnedFromSetup && !returnedFromLegacyStripe) || didAutoSync.current) return;

    didAutoSync.current = true;
    syncPayoutStatus();
  }, [searchParams, syncPayoutStatus]);

  const isReady = status?.status === "active";
  const requirementText = useMemo(() => {
    if (!status?.requirements_due?.length) return null;
    return status.requirements_due.slice(0, 3).join(", ");
  }, [status]);

  const handleStartOnboarding = async () => {
    const result = await createOnboardingLink({
      country: status?.country || undefined,
    }).unwrap();
    globalThis.location.assign(result.url);
  };

  const statusBadge = isStatusLoading ? (
    <Skeleton className="h-9 w-32" />
  ) : (
    <Badge variant={statusVariant(status?.status)}>
      {status ? statusLabels[status.status] : "Not started"}
    </Badge>
  );

  const statusAlert = isReady ? (
      <Alert>
      <IconCheck className="h-4 w-4" />
      <AlertTitle>Royalty payouts are ready</AlertTitle>
      <AlertDescription>
        Your Stripe Connect recipient profile can receive royalty disbursements when ledger
        entries become available.
      </AlertDescription>
    </Alert>
  ) : (
    <Alert variant={status?.status === "restricted" ? "destructive" : "default"}>
      <IconAlertCircle className="h-4 w-4" />
      <AlertTitle>Action required</AlertTitle>
      <AlertDescription>
        {requirementText
          ? `Payout setup still needs: ${requirementText}.`
          : "Start or continue Stripe Connect payout setup to enable royalty disbursements."}
      </AlertDescription>
    </Alert>
  );

  let ledgerContent = (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Source</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Available</TableHead>
          <TableHead className="text-right">Gross</TableHead>
          <TableHead className="text-right">Platform fee</TableHead>
          <TableHead className="text-right">Owner net</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ledger.map((entry) => (
          <TableRow key={entry.id}>
            <TableCell>
              <div className="font-medium">{entry.license?.name || "Sale"}</div>
              <div className="text-xs text-muted-foreground">
                {entry.order?.reference_number || entry.source_order_id}
              </div>
            </TableCell>
            <TableCell>
              <Badge variant={ledgerVariant(entry.status)}>{ledgerLabels[entry.status]}</Badge>
            </TableCell>
            <TableCell>{formatDate(entry.available_at)}</TableCell>
            <TableCell className="text-right">
              {formatCurrency(entry.currency, Number(entry.gross_sale_amount))}
            </TableCell>
            <TableCell className="text-right">
              {formatCurrency(entry.currency, Number(entry.platform_revenue_amount))}
            </TableCell>
            <TableCell className="text-right font-medium">
              {formatCurrency(entry.currency, Number(entry.royalty_amount))}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  if (isLedgerLoading) {
    ledgerContent = (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  } else if (ledger.length === 0) {
    ledgerContent = (
      <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
        No royalty ledger entries yet.
      </div>
    );
  }

  return (
    <DashboardLayout
      breadcrumbItems={breadcrumbItems}
      title="Payouts"
      actions={
        <Button variant="outline" onClick={() => syncPayoutStatus()} disabled={isSyncing}>
          <IconRefresh className={cn("mr-2 h-4 w-4", isSyncing && "animate-spin")} />
          Sync
        </Button>
      }
    >
      <div className="space-y-6">
        <Alert>
          <IconWallet className="h-4 w-4" />
          <AlertTitle>Deploy Hub billing, Stripe Connect royalty payouts</AlertTitle>
          <AlertDescription>
            Deploy Hub sells customer subscriptions and license purchases through Stripe. Owner
            earnings accrue in the royalty ledger and are released through Stripe Connect after the
            platform hold period.
          </AlertDescription>
        </Alert>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pending</CardDescription>
              <CardTitle>
                {isBalanceLoading || !balance ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  formatCurrency(balance.currency, balance.pending)
                )}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Available</CardDescription>
              <CardTitle>
                {isBalanceLoading || !balance ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  formatCurrency(balance.currency, balance.available)
                )}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Processing</CardDescription>
              <CardTitle>
                {isBalanceLoading || !balance ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  formatCurrency(balance.currency, balance.processing)
                )}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Paid</CardDescription>
              <CardTitle>
                {isBalanceLoading || !balance ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  formatCurrency(balance.currency, balance.paid)
                )}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Royalty Payout Setup</CardTitle>
                <CardDescription>
                  Complete recipient and tax setup before publishing paid projects.
                </CardDescription>
              </div>
              {statusBadge}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {statusAlert}

            <div className="flex flex-wrap gap-3">
              {!isReady && (
                <Button onClick={handleStartOnboarding} disabled={isCreatingLink}>
                  {status?.provider_recipient_id ? "Continue setup" : "Start setup"}
                  <IconArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
              <Button variant="outline" onClick={() => syncPayoutStatus()} disabled={isSyncing}>
                <IconRefresh className={cn("mr-2 h-4 w-4", isSyncing && "animate-spin")} />
                Refresh status
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ledger</CardTitle>
            <CardDescription>
              Royalties move from pending to available after the platform hold period.
            </CardDescription>
          </CardHeader>
          <CardContent>{ledgerContent}</CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
