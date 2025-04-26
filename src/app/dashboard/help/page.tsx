"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { IconSearch, IconMessageQuestion } from "@tabler/icons-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface HelpItem {
    question: string;
    answer: string;
}

interface HelpData {
    gettingStarted: HelpItem[];
    deployments: HelpItem[];
    licenses: HelpItem[];
    billing: HelpItem[];
    [key: string]: HelpItem[];
}

interface SearchResult {
    category: string;
    results: HelpItem[];
}

// Mock data for help categories and FAQs
const helpData: HelpData = {
    gettingStarted: [
        {
            question: "How do I create a new project?",
            answer: "To create a new project, navigate to the Projects section in the dashboard and click on the 'Create Project' button. Fill in the required fields in the form and click 'Save' to create your project."
        },
        {
            question: "How do I upload media files?",
            answer: "You can upload media files by going to the Media section in the dashboard. Click on the 'Upload' button, select the files from your device, and click 'Upload'. Supported file types include images, videos, and documents."
        },
        {
            question: "What are categories and how do I use them?",
            answer: "Categories help you organize your projects and media. You can create categories in the Categories section and assign them to your projects for better organization and easier search."
        }
    ],
    deployments: [
        {
            question: "How do I deploy my project?",
            answer: "To deploy a project, go to the Deployments section and click 'Create Deployment'. Select your project, choose the configuration, and follow the deployment wizard steps."
        },
        {
            question: "What happens if my deployment fails?",
            answer: "If your deployment fails, you'll receive an error notification. You can view the deployment logs to identify the issue, fix it, and then try to deploy again."
        },
        {
            question: "Can I rollback to a previous deployment?",
            answer: "Yes, you can rollback to a previous deployment by accessing the specific deployment in the Deployments section and clicking on the 'Rollback' button."
        }
    ],
    licenses: [
        {
            question: "How do licenses work?",
            answer: "Licenses allow users to access and use your projects. You can create different license types with varying permissions and durations."
        },
        {
            question: "How do I create a license?",
            answer: "To create a license, go to the Licenses section and click 'Create License'. Fill in the license details including name, type, duration, and permissions, then click 'Save'."
        },
        {
            question: "How do I assign a license to a user?",
            answer: "You can assign a license to a user by going to the Licenses section, finding the appropriate license, and clicking 'Assign'. Then search for and select the user to assign the license to."
        }
    ],
    billing: [
        {
            question: "How do I view my current billing information?",
            answer: "You can view your billing information in the Payment section of the dashboard, where you'll find details about your current plan, payment history, and invoices."
        },
        {
            question: "How do I update my payment method?",
            answer: "To update your payment method, navigate to the Payment section, click on 'Payment Methods', and select 'Add New' or 'Edit' an existing method."
        },
        {
            question: "What payment methods do you accept?",
            answer: "We accept major credit cards including Visa, MasterCard, American Express, and Discover. We also support payment via PayPal for select regions."
        }
    ]
};

export default function HelpPage() {
    const searchParams = useSearchParams();
    const urlSearchQuery = searchParams.get('search') || "";
    const [searchQuery, setSearchQuery] = useState(urlSearchQuery);
    const [activeTab, setActiveTab] = useState("getting-started");

    // Search from URL parameter on component mount
    useEffect(() => {
        if (urlSearchQuery) {
            setSearchQuery(urlSearchQuery);
        }
    }, [urlSearchQuery]);

    // Filter FAQs based on search query
    const getFilteredFAQs = (): SearchResult[] | null => {
        if (!searchQuery.trim()) return null;

        const allResults: SearchResult[] = [];
        const query = searchQuery.toLowerCase();

        // Search through all categories
        Object.entries(helpData).forEach(([category, items]) => {
            const results = items.filter(
                item =>
                    item.question.toLowerCase().includes(query) ||
                    item.answer.toLowerCase().includes(query)
            );

            if (results.length > 0) {
                allResults.push({
                    category,
                    results
                });
            }
        });

        return allResults.length > 0 ? allResults : null;
    };

    const searchResults = getFilteredFAQs();

    // Mock function to handle contact support form
    const handleContactSupport = (e: React.FormEvent) => {
        e.preventDefault();
        alert("Support request submitted! Our team will contact you shortly.");
    };

    return (
        <DashboardLayout
            breadcrumbItems={[
                { href: "/dashboard/help", label: "Help & Support" }
            ]}
            title="Help & Support"
        >
            <div className="grid gap-6">
                {/* Search section */}
                <Card>
                    <CardHeader>
                        <CardTitle>Search Help Center</CardTitle>
                        <CardDescription>
                            Find answers to common questions or search our documentation
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="relative">
                            <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search help articles..."
                                className="pl-10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Search Results */}
                {searchQuery.trim() !== "" && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Search Results</CardTitle>
                            <CardDescription>
                                {searchResults
                                    ? `Found ${searchResults.reduce((total, category) => total + category.results.length, 0)} results for "${searchQuery}"`
                                    : `No results found for "${searchQuery}"`}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {searchResults && (
                                <div className="space-y-6">
                                    {searchResults.map((category, categoryIndex) => (
                                        <div key={categoryIndex} className="space-y-4">
                                            <h3 className="text-lg font-medium capitalize">
                                                {category.category.replace(/([A-Z])/g, " $1").trim()}
                                            </h3>
                                            <Accordion type="single" collapsible className="w-full">
                                                {category.results.map((item, index) => (
                                                    <AccordionItem key={index} value={`search-${category.category}-${index}`}>
                                                        <AccordionTrigger>{item.question}</AccordionTrigger>
                                                        <AccordionContent>
                                                            {item.answer}
                                                        </AccordionContent>
                                                    </AccordionItem>
                                                ))}
                                            </Accordion>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {!searchResults && (
                                <div className="text-center py-8">
                                    <p className="text-muted-foreground">No results match your search criteria.</p>
                                    <p className="mt-2">Try using different keywords or check our categories below.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Only show tabs when not searching or no results found */}
                {(searchQuery.trim() === "" || !searchResults) && (
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid grid-cols-4 mb-4">
                            <TabsTrigger value="getting-started">Getting Started</TabsTrigger>
                            <TabsTrigger value="deployments">Deployments</TabsTrigger>
                            <TabsTrigger value="licenses">Licenses</TabsTrigger>
                            <TabsTrigger value="billing">Billing & Payments</TabsTrigger>
                        </TabsList>

                        <TabsContent value="getting-started">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Getting Started</CardTitle>
                                    <CardDescription>Learn the basics of using the Deploy Hub dashboard</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Accordion type="single" collapsible className="w-full">
                                        {helpData.gettingStarted.map((item, index) => (
                                            <AccordionItem key={index} value={`item-${index}`}>
                                                <AccordionTrigger>{item.question}</AccordionTrigger>
                                                <AccordionContent>
                                                    {item.answer}
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="deployments">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Deployments</CardTitle>
                                    <CardDescription>Learn about deploying and managing your projects</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Accordion type="single" collapsible className="w-full">
                                        {helpData.deployments.map((item, index) => (
                                            <AccordionItem key={index} value={`item-${index}`}>
                                                <AccordionTrigger>{item.question}</AccordionTrigger>
                                                <AccordionContent>
                                                    {item.answer}
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="licenses">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Licenses</CardTitle>
                                    <CardDescription>Understand how licenses work and how to manage them</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Accordion type="single" collapsible className="w-full">
                                        {helpData.licenses.map((item, index) => (
                                            <AccordionItem key={index} value={`item-${index}`}>
                                                <AccordionTrigger>{item.question}</AccordionTrigger>
                                                <AccordionContent>
                                                    {item.answer}
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="billing">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Billing & Payments</CardTitle>
                                    <CardDescription>Information about billing, payments, and subscriptions</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Accordion type="single" collapsible className="w-full">
                                        {helpData.billing.map((item, index) => (
                                            <AccordionItem key={index} value={`item-${index}`}>
                                                <AccordionTrigger>{item.question}</AccordionTrigger>
                                                <AccordionContent>
                                                    {item.answer}
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                )}

                {/* Contact support section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <IconMessageQuestion className="mr-2" />
                            Contact Support
                        </CardTitle>
                        <CardDescription>
                            Can&apos;t find what you&apos;re looking for? Our support team is here to help.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleContactSupport} className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Input placeholder="Your name" required />
                                </div>
                                <div className="space-y-2">
                                    <Input placeholder="Your email" type="email" required />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Input placeholder="Subject" required />
                            </div>
                            <div className="space-y-2">
                                <textarea
                                    className="min-h-[120px] w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="Describe your issue in detail..."
                                    required
                                />
                            </div>
                            <Button type="submit">Submit Request</Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}