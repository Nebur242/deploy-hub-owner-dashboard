"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import DashboardLayout from "@/components/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  IconSearch,
  IconMessageQuestion,
  IconLoader,
  IconCheck,
  IconRocket,
  IconLicense,
  IconCreditCard,
  IconSettings,
} from "@tabler/icons-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "sonner";
import {
  useCreateSupportTicketMutation,
  TicketCategory,
  TicketPriority,
} from "@/store/features/support";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { MultipleMediaSelector } from "@/app/dashboard/media/components/media-selector";
import { Media } from "@/common/types";

// Zod schema for support form validation
const supportFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  category: z.nativeEnum(TicketCategory, {
    message: "Please select a category",
  }),
  priority: z.nativeEnum(TicketPriority, {
    message: "Please select a priority",
  }),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  message: z.string().min(20, "Message must be at least 20 characters"),
});

type SupportFormValues = z.infer<typeof supportFormSchema>;

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

// Help content for Deploy Hub Owner Dashboard
const helpData: HelpData = {
  gettingStarted: [
    {
      question: "How do I create my first project?",
      answer:
        "Navigate to Projects in the sidebar and click 'Create Project'. Enter your project name, description, connect your GitHub repository, and configure your deployment settings. Your project will be ready for deployments once saved.",
    },
    {
      question: "How do I connect my GitHub account?",
      answer:
        "Go to Settings > Integrations and click 'Connect GitHub'. You'll be redirected to GitHub to authorize Deploy Hub. Once authorized, you can access your repositories for deployments.",
    },
    {
      question: "What are the different deployment environments?",
      answer:
        "Deploy Hub supports three environments: Development (for testing), Staging (for pre-production), and Production (for live sites). Each environment can have its own configuration and environment variables.",
    },
    {
      question: "How do I organize my projects with categories?",
      answer:
        "Categories help you organize projects by type or purpose. Go to Categories in the sidebar to create new categories, then assign them when creating or editing projects.",
    },
  ],
  deployments: [
    {
      question: "How do I trigger a new deployment?",
      answer:
        "Go to Deployments > Create Deployment. Select your project, choose the branch and environment, then click 'Deploy'. You can also enable automatic deployments from your project settings to deploy on every push to a branch.",
    },
    {
      question: "How can I view deployment logs?",
      answer:
        "Click on any deployment in the Deployments list to view its details. The Logs tab shows real-time build and deployment logs. You can also access full logs by clicking 'View Full Logs'.",
    },
    {
      question: "What should I do if my deployment fails?",
      answer:
        "Check the deployment logs for error messages. Common issues include build errors, missing environment variables, or configuration problems. You can retry a failed deployment after fixing the issue by clicking 'Retry Deployment'.",
    },
    {
      question: "How do I set environment variables?",
      answer:
        "Environment variables can be set per project in Project Settings > Environment Variables. You can define different values for each environment (development, staging, production). Sensitive values are encrypted and never exposed in logs.",
    },
    {
      question: "What is a test deployment?",
      answer:
        "Test deployments allow you to verify your configuration without counting against your deployment limits. They're perfect for testing new configurations or troubleshooting issues before going live.",
    },
  ],
  licenses: [
    {
      question: "How do I create a license for my project?",
      answer:
        "Go to Licenses > Create License. Select a project, set the price, choose a license type (perpetual, subscription, or time-limited), and define what's included. Once published, customers can purchase licenses from the marketplace.",
    },
    {
      question: "What license types are available?",
      answer:
        "Deploy Hub supports several license types: Perpetual (one-time purchase with lifetime access), Subscription (recurring monthly/yearly payment), and Time-limited (access for a specific period). You can also create custom license tiers with different features.",
    },
    {
      question: "How do I track license sales?",
      answer:
        "View your sales in the Sales section of the dashboard. You'll see orders, revenue analytics, and customer information. The Analytics page provides detailed insights into your best-selling licenses and revenue trends.",
    },
    {
      question: "Can I offer different pricing tiers?",
      answer:
        "Yes! Create multiple licenses for the same project with different features and prices. For example, you might offer a Basic license with limited deployments and a Pro license with unlimited deployments and priority support.",
    },
  ],
  billing: [
    {
      question: "How do I view my subscription status?",
      answer:
        "Go to Billing in the sidebar to view your current plan, usage, and billing history. You can see your next billing date, payment method, and upgrade to a higher plan if needed.",
    },
    {
      question: "How do I update my payment method?",
      answer:
        "Navigate to Billing > Manage Subscription. Click 'Update Payment Method' to add a new card or change your existing payment details. We use Stripe for secure payment processing.",
    },
    {
      question: "How do I receive payouts from license sales?",
      answer:
        "Payouts are processed automatically to your connected Stripe account. Go to Earnings to view your balance, pending payouts, and payout history. Set up your payout schedule in Billing > Payout Settings.",
    },
    {
      question: "What happens if my subscription expires?",
      answer:
        "If your subscription expires, you'll retain access to your projects and data, but new deployments will be paused. Renew your subscription or update your payment method to resume deployments.",
    },
  ],
};

export default function HelpPage() {
  const searchParams = useSearchParams();
  const urlSearchQuery = searchParams.get("search") || "";
  const [searchQuery, setSearchQuery] = useState(urlSearchQuery);
  const [activeTab, setActiveTab] = useState("getting-started");
  const [submitted, setSubmitted] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<Media[]>([]);

  // User data from Redux
  const user = useSelector((state: RootState) => state.auth.infos);

  // RTK Query mutation
  const [createTicket, { isLoading }] = useCreateSupportTicketMutation();

  // React Hook Form with Zod validation
  const form = useForm<SupportFormValues>({
    resolver: zodResolver(supportFormSchema),
    defaultValues: {
      name: user ? `${user.first_name || ""} ${user.last_name || ""}`.trim() : "",
      email: user?.firebase?.email || "",
      category: TicketCategory.GENERAL,
      priority: TicketPriority.MEDIUM,
      subject: "",
      message: "",
    },
  });

  // Update form when user data loads
  useEffect(() => {
    if (user) {
      form.setValue(
        "name",
        `${user.first_name || ""} ${user.last_name || ""}`.trim()
      );
      form.setValue("email", user.firebase?.email || "");
    }
  }, [user, form]);

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
    Object.entries(helpData).forEach(([cat, items]) => {
      const results = items.filter(
        (item) =>
          item.question.toLowerCase().includes(query) ||
          item.answer.toLowerCase().includes(query)
      );

      if (results.length > 0) {
        allResults.push({
          category: cat,
          results,
        });
      }
    });

    return allResults.length > 0 ? allResults : null;
  };

  const searchResults = getFilteredFAQs();

  // Handle contact support form submission
  const onSubmit = async (data: SupportFormValues) => {
    // Get image URLs from selected media
    const attachments = selectedMedia.map(media => media.url);

    try {
      await createTicket({
        ...data,
        attachments: attachments.length > 0 ? attachments : undefined,
      }).unwrap();

      setSubmitted(true);
      setSelectedMedia([]);
      toast.success("Support request submitted!", {
        description:
          "Our team will review your request and get back to you soon.",
      });

      // Reset form after a delay
      setTimeout(() => {
        form.reset({
          name: user
            ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
            : "",
          email: user?.firebase?.email || "",
          category: TicketCategory.GENERAL,
          priority: TicketPriority.MEDIUM,
          subject: "",
          message: "",
        });
        setSubmitted(false);
      }, 3000);
    } catch (error) {
      console.error("Failed to submit support ticket:", error);
      toast.error("Failed to submit request", {
        description: "Please try again or contact us directly.",
      });
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "gettingStarted":
        return <IconSettings className="h-5 w-5" />;
      case "deployments":
        return <IconRocket className="h-5 w-5" />;
      case "licenses":
        return <IconLicense className="h-5 w-5" />;
      case "billing":
        return <IconCreditCard className="h-5 w-5" />;
      default:
        return null;
    }
  };

  const formatCategoryName = (cat: string) => {
    switch (cat) {
      case "gettingStarted":
        return "Getting Started";
      case "deployments":
        return "Deployments";
      case "licenses":
        return "Licenses";
      case "billing":
        return "Billing & Payments";
      default:
        return cat;
    }
  };

  return (
    <DashboardLayout
      breadcrumbItems={[{ href: "/dashboard/help", label: "Help & Support" }]}
      title="Help & Support"
    >
      <div className="grid gap-6">
        {/* Search section */}
        <Card>
          <CardHeader>
            <CardTitle>Search Help Center</CardTitle>
            <CardDescription>
              Find answers to common questions about Deploy Hub
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search for help with projects, deployments, licenses..."
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
                  ? `Found ${searchResults.reduce((total, cat) => total + cat.results.length, 0)} results for "${searchQuery}"`
                  : `No results found for "${searchQuery}"`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {searchResults && (
                <div className="space-y-6">
                  {searchResults.map((cat, categoryIndex) => (
                    <div key={categoryIndex} className="space-y-4">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(cat.category)}
                        <h3 className="text-lg font-medium">
                          {formatCategoryName(cat.category)}
                        </h3>
                      </div>
                      <Accordion type="single" collapsible className="w-full">
                        {cat.results.map((item, index) => (
                          <AccordionItem
                            key={index}
                            value={`search-${cat.category}-${index}`}
                          >
                            <AccordionTrigger>{item.question}</AccordionTrigger>
                            <AccordionContent className="text-muted-foreground">
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
                  <p className="text-muted-foreground">
                    No results match your search criteria.
                  </p>
                  <p className="mt-2 text-sm">
                    Try different keywords or browse our help categories below.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* FAQ Categories */}
        {(searchQuery.trim() === "" || !searchResults) && (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid grid-cols-2 md:grid-cols-4 mb-4">
              <TabsTrigger value="getting-started" className="gap-2">
                <IconSettings className="h-4 w-4 hidden sm:inline" />
                Getting Started
              </TabsTrigger>
              <TabsTrigger value="deployments" className="gap-2">
                <IconRocket className="h-4 w-4 hidden sm:inline" />
                Deployments
              </TabsTrigger>
              <TabsTrigger value="licenses" className="gap-2">
                <IconLicense className="h-4 w-4 hidden sm:inline" />
                Licenses
              </TabsTrigger>
              <TabsTrigger value="billing" className="gap-2">
                <IconCreditCard className="h-4 w-4 hidden sm:inline" />
                Billing
              </TabsTrigger>
            </TabsList>

            <TabsContent value="getting-started">
              <Card>
                <CardHeader>
                  <CardTitle>Getting Started</CardTitle>
                  <CardDescription>
                    Learn the basics of setting up and using Deploy Hub
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {helpData.gettingStarted.map((item, index) => (
                      <AccordionItem key={index} value={`gs-${index}`}>
                        <AccordionTrigger>{item.question}</AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">
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
                  <CardDescription>
                    Everything about deploying and managing your projects
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {helpData.deployments.map((item, index) => (
                      <AccordionItem key={index} value={`dep-${index}`}>
                        <AccordionTrigger>{item.question}</AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">
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
                  <CardDescription>
                    Create and manage licenses for your projects
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {helpData.licenses.map((item, index) => (
                      <AccordionItem key={index} value={`lic-${index}`}>
                        <AccordionTrigger>{item.question}</AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">
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
                  <CardDescription>
                    Subscriptions, payments, and earnings information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {helpData.billing.map((item, index) => (
                      <AccordionItem key={index} value={`bill-${index}`}>
                        <AccordionTrigger>{item.question}</AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">
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

        {/* Contact Support Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconMessageQuestion className="h-5 w-5" />
              Contact Support
            </CardTitle>
            <CardDescription>
              Can&apos;t find what you&apos;re looking for? Submit a support
              ticket and our team will help you.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {submitted ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="rounded-full bg-green-500/10 p-3 mb-4">
                  <IconCheck className="h-8 w-8 text-green-500" />
                </div>
                <h3 className="text-lg font-medium">Request Submitted!</h3>
                <p className="text-muted-foreground mt-2">
                  We&apos;ve received your support request and will get back to
                  you within 24 hours.
                </p>
              </div>
            ) : (
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Your Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="john@example.com"
                              type="email"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value={TicketCategory.GENERAL}>
                                General Question
                              </SelectItem>
                              <SelectItem value={TicketCategory.TECHNICAL}>
                                Technical Issue
                              </SelectItem>
                              <SelectItem value={TicketCategory.DEPLOYMENT}>
                                Deployment Help
                              </SelectItem>
                              <SelectItem value={TicketCategory.LICENSE}>
                                License Question
                              </SelectItem>
                              <SelectItem value={TicketCategory.BILLING}>
                                Billing & Payments
                              </SelectItem>
                              <SelectItem value={TicketCategory.ACCOUNT}>
                                Account Issue
                              </SelectItem>
                              <SelectItem value={TicketCategory.OTHER}>
                                Other
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select priority" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value={TicketPriority.LOW}>
                                Low - General question
                              </SelectItem>
                              <SelectItem value={TicketPriority.MEDIUM}>
                                Medium - Need help soon
                              </SelectItem>
                              <SelectItem value={TicketPriority.HIGH}>
                                High - Blocking my work
                              </SelectItem>
                              <SelectItem value={TicketPriority.URGENT}>
                                Urgent - Critical issue
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Brief description of your issue"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Please describe your issue in detail. Include any relevant information such as project names, error messages, or steps to reproduce the problem..."
                            className="min-h-[150px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Minimum 20 characters. The more details you provide,
                          the faster we can help.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Attachments Section */}
                  <div className="space-y-2">
                    <MultipleMediaSelector
                      label="Attachments (Optional)"
                      value={selectedMedia}
                      onChange={setSelectedMedia}
                    />
                    <p className="text-[0.8rem] text-muted-foreground">
                      Add screenshots or files that help explain your issue.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full sm:w-auto"
                  >
                    {isLoading ? (
                      <>
                        <IconLoader className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Support Request"
                    )}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
