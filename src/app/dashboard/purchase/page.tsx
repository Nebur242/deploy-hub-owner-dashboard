"use client";

import { useGetLicensesQuery } from "@/store/features/licenses";
import { LicenseCard } from "./components/license-card";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Currency } from "@/common/enums/project";
import { Search, Filter, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function PurchasePage() {
    const [searchParams, setSearchParams] = useState({
        search: "",
        currency: "",
        page: 1,
        limit: 8
    });

    const { data, isLoading, isFetching, error, refetch } = useGetLicensesQuery(searchParams);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchParams((prev) => ({ ...prev, search: e.target.value, page: 1 }));
    };

    const handleCurrencyChange = (value: string) => {
        setSearchParams((prev) => ({ ...prev, currency: value, page: 1 }));
    };


    const handleClearFilters = () => {
        setSearchParams({ search: "", currency: "", page: 1, limit: 8 });
    };

    // Function to render license cards or skeletons during loading
    const renderLicenseCards = () => {
        if (isLoading) {
            return Array(4).fill(0).map((_, index) => (
                <Card key={index} className="p-6">
                    <Skeleton className="h-8 w-3/4 mb-4" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3 mb-6" />
                    <div className="space-y-4">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-4 w-1/4" />
                    </div>
                    <Skeleton className="h-9 w-full mt-6" />
                </Card>
            ));
        }

        if (error) {
            return (
                <div className="col-span-full flex justify-center p-8">
                    <div className="text-center">
                        <h3 className="text-lg font-medium text-red-600 mb-2">Failed to load licenses</h3>
                        <p className="text-gray-500 mb-4">There was an error loading the licenses. Please try again.</p>
                        <Button onClick={() => refetch()} variant="outline" size="sm">
                            <RefreshCw className="mr-2 h-4 w-4" /> Retry
                        </Button>
                    </div>
                </div>
            );
        }

        if (!data?.items?.length) {
            return (
                <div className="col-span-full flex justify-center p-8">
                    <div className="text-center">
                        <h3 className="text-lg font-medium mb-2">No licenses found</h3>
                        <p className="text-gray-500">
                            {searchParams.search || searchParams.currency
                                ? "Try adjusting your filters or search terms."
                                : "There are no licenses available at this time."}
                        </p>
                    </div>
                </div>
            );
        }

        return data.items.map((license) => (
            <LicenseCard
                key={license.id}
                license={license}
            />
        ));
    };

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Purchase Licenses</h1>
                    <p className="text-gray-500 mt-1">
                        Browse and purchase licenses for your projects
                    </p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-[1fr_3fr]">
                {/* Filters sidebar */}
                <div className="space-y-6">
                    <Card className="p-4">
                        <h3 className="text-lg font-medium mb-4">Filters</h3>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Search className="h-4 w-4 text-gray-500" />
                                    <span className="text-sm font-medium">Search</span>
                                </div>
                                <Input
                                    placeholder="Search licenses..."
                                    value={searchParams.search}
                                    onChange={handleSearchChange}
                                    className="w-full"
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Filter className="h-4 w-4 text-gray-500" />
                                    <span className="text-sm font-medium">Currency</span>
                                </div>
                                <Select
                                    value={searchParams.currency || "all"}
                                    onValueChange={handleCurrencyChange}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="All currencies" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All currencies</SelectItem>
                                        <SelectItem value={Currency.USD}>USD</SelectItem>
                                        <SelectItem value={Currency.EUR}>EUR</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button
                                variant="outline"
                                onClick={handleClearFilters}
                                className="w-full mt-2"
                            >
                                Clear Filters
                            </Button>
                        </div>
                    </Card>
                </div>

                {/* Main content */}
                <div className="space-y-6">
                    <div className="relative">
                        {isFetching && !isLoading && (
                            <div className="absolute inset-0 bg-gray-100/50 dark:bg-gray-900/50 flex items-center justify-center z-10 rounded-lg">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {renderLicenseCards()}
                        </div>
                    </div>


                </div>
            </div>
        </div>
    );
}