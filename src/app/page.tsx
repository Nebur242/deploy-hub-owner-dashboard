"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { subscriptionService } from "@/services/subscription";
import { BillingInterval, PlanConfig, SubscriptionPlan } from "@/common/types/subscription";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { authenticateUser } from "@/store/features/auth";
import { toast } from "sonner";
import {
  IconRocket,
  IconCode,
  IconCurrencyDollar,
  IconShieldCheck,
  IconChartBar,
  IconUsers,
  IconBrandGithub,
  IconCloud,
  IconLicense,
  IconArrowRight,
  IconCheck,
  IconStar,
  IconBolt,
  IconWorld,
  IconHeadset,
  IconBrandTwitter,
  IconBrandDiscord,
  IconMail,
  IconLoader2,
} from "@tabler/icons-react";

// Feature data
const features = [
  {
    icon: IconCode,
    title: "Sell Your Projects",
    description: "Transform your templates, boilerplates, and SaaS starters into a recurring revenue stream. List once, earn forever.",
  },
  {
    icon: IconRocket,
    title: "Instant Deployments",
    description: "Buyers deploy your projects with one click to their own infrastructure. No manual setup required.",
  },
  {
    icon: IconLicense,
    title: "Flexible License Tiers",
    description: "Create multiple license options with different deployment limits, pricing, and durations to maximize your earnings.",
  },
  {
    icon: IconShieldCheck,
    title: "Secure Licensing",
    description: "Our license system protects your work. Buyers get deployment access while your code stays secure.",
  },
  {
    icon: IconChartBar,
    title: "Sales Analytics",
    description: "Track sales, license usage, and customer activity with detailed dashboards and reports.",
  },
  {
    icon: IconCurrencyDollar,
    title: "Easy Payouts",
    description: "Receive payments directly to your account. We handle payment processing and invoicing for you.",
  },
];

// How it works steps
const howItWorks = [
  {
    step: "01",
    title: "Create Your Project",
    description: "Add your project details, connect your repository, and configure deployment settings and environment variables.",
  },
  {
    step: "02",
    title: "Set Up Licenses",
    description: "Create license tiers with different deployment limits and pricing. Offer monthly, yearly, or lifetime options.",
  },
  {
    step: "03",
    title: "Publish to Marketplace",
    description: "Your project goes live on our marketplace where developers can discover, review, and purchase your licenses.",
  },
  {
    step: "04",
    title: "Earn Revenue",
    description: "Get notified for every sale. Track your earnings, manage customers, and grow your developer business.",
  },
];

// Pricing plans - fallback static data
const defaultPricingPlans = [
  {
    name: "Free",
    price: "Free",
    period: "",
    description: "Perfect for trying out the platform",
    features: [
      "Up to 1 project",
      "10 deployments/month",
      "Basic analytics",
      "Community support",
    ],
    cta: "Get Started Free",
    popular: false,
    plan: "FREE",
    monthlyPrice: 0,
    yearlyPrice: 0,
  },
  {
    name: "Starter",
    price: "$19",
    period: "/month",
    description: "For indie developers",
    features: [
      "Up to 10 projects",
      "500 deployments/month",
      "Sales analytics",
      "Email support",
    ],
    cta: "Start Starter",
    popular: false,
    plan: "STARTER",
    monthlyPrice: 19,
    yearlyPrice: 190,
  },
  {
    name: "Pro",
    price: "$49",
    period: "/month",
    description: "For professional sellers",
    features: [
      "Up to 50 projects",
      "2000 deployments/month",
      "Advanced analytics",
      "Priority support",
      "Custom branding",
    ],
    cta: "Start Pro",
    popular: true,
    plan: "PRO",
    monthlyPrice: 49,
    yearlyPrice: 490,
  },
  {
    name: "Enterprise",
    price: "$199",
    period: "/month",
    description: "For agencies & teams",
    features: [
      "Unlimited projects",
      "Unlimited deployments",
      "White-label options",
      "Dedicated support",
      "Custom integrations",
      "SLA guarantee",
    ],
    cta: "Contact Sales",
    popular: false,
    plan: "ENTERPRISE",
    monthlyPrice: 199,
    yearlyPrice: 1990,
  },
];

// Stats
const stats = [
  { value: "5K+", label: "Active Sellers" },
  { value: "$1M+", label: "Paid to Creators" },
  { value: "25K+", label: "Licenses Sold" },
  { value: "99.9%", label: "Uptime" },
];

// Testimonials
const testimonials = [
  {
    quote: "I turned my Next.js starter kit into a steady $4K/month. Deploy Hub handles payments and licensing — I just focus on building.",
    author: "Sarah Chen",
    role: "Full-Stack Developer",
    avatar: "SC",
  },
  {
    quote: "The licensing system is perfect. I offer different tiers and my customers can choose what fits their needs best.",
    author: "Marcus Johnson",
    role: "Indie Maker",
    avatar: "MJ",
  },
  {
    quote: "Finally a marketplace that gets developers. My customers love the instant deployment, and I love the recurring revenue.",
    author: "Elena Rodriguez",
    role: "SaaS Creator",
    avatar: "ER",
  },
];

export default function LandingPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isLoggedIn, infos, authenticate } = useAppSelector((state) => state.auth);
  const userIsLoggedIn = isLoggedIn || !!infos || authenticate.status === 'success';
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [plans, setPlans] = useState(defaultPricingPlans);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [loadingPlanAction, setLoadingPlanAction] = useState<string | null>(null);

  // Trigger authentication check on mount
  useEffect(() => {
    if (authenticate.status === 'pending') {
      dispatch(authenticateUser());
    }
  }, [dispatch, authenticate.status]);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const apiPlans = await subscriptionService.getPublicPlans();
        if (apiPlans && apiPlans.length > 0) {
          const formattedPlans = apiPlans.map((plan: PlanConfig) => ({
            name: plan.name,
            price: plan.monthlyPrice === 0 ? "Free" : `$${plan.monthlyPrice}`,
            period: plan.monthlyPrice === 0 ? "" : "/month",
            description: plan.description,
            features: buildFeatures(plan),
            cta: plan.plan === SubscriptionPlan.FREE ? "Get Started Free" :
              plan.plan === SubscriptionPlan.ENTERPRISE ? "Contact Sales" : `Start ${plan.name}`,
            popular: plan.plan === SubscriptionPlan.PRO,
            plan: plan.plan,
            monthlyPrice: plan.monthlyPrice,
            yearlyPrice: plan.yearlyPrice,
          }));
          setPlans(formattedPlans);
        }
      } catch (error) {
        console.error("Failed to fetch plans:", error);
        // Keep using default plans on error
      } finally {
        setLoadingPlans(false);
      }
    };

    fetchPlans();
  }, []);

  // Handle plan selection
  const handlePlanAction = async (plan: typeof plans[0]) => {
    // For FREE plan, redirect to register/dashboard
    if (plan.plan === "FREE") {
      if (isLoggedIn) {
        router.push("/dashboard");
      } else {
        router.push("/auth/register");
      }
      return;
    }

    // For ENTERPRISE plan, redirect to contact
    if (plan.plan === "ENTERPRISE") {
      // You can replace this with your contact page or email
      window.location.href = "mailto:sales@deployhub.com?subject=Enterprise Plan Inquiry";
      return;
    }

    // For paid plans, create checkout session
    if (!isLoggedIn) {
      // Store the selected plan in sessionStorage to use after login
      sessionStorage.setItem("selectedPlan", JSON.stringify({
        plan: plan.plan,
        billingInterval: billingPeriod,
      }));
      toast.info("Please login or register to subscribe to a plan");
      router.push("/auth/register");
      return;
    }

    // Create checkout session
    try {
      setLoadingPlanAction(plan.plan);
      const response = await subscriptionService.createCheckoutSession({
        plan: plan.plan.toLowerCase() as SubscriptionPlan,
        billing_interval: billingPeriod as BillingInterval,
        success_url: `${window.location.origin}/dashboard/billing?success=true`,
        cancel_url: `${window.location.origin}/#pricing`,
      });

      if (response.url) {
        window.location.href = response.url;
      } else {
        toast.error("Failed to create checkout session");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Failed to start checkout. Please try again.");
    } finally {
      setLoadingPlanAction(null);
    }
  };

  // Helper function to build feature list from plan config
  const buildFeatures = (plan: PlanConfig): string[] => {
    const features: string[] = [];

    if (plan.maxProjects === -1) {
      features.push("Unlimited projects");
    } else {
      features.push(`Up to ${plan.maxProjects} projects`);
    }

    if (plan.maxDeploymentsPerMonth === -1) {
      features.push("Unlimited deployments");
    } else {
      features.push(`${plan.maxDeploymentsPerMonth} deployments/month`);
    }

    if (plan.customDomainEnabled) {
      features.push("Custom domains");
    }

    if (plan.prioritySupport) {
      features.push("Priority support");
    }

    if (plan.analyticsEnabled) {
      features.push("Advanced analytics");
    }

    return features;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <IconRocket className="h-8 w-8 text-primary" />
            <span className="font-bold text-xl">Deploy Hub</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              How It Works
            </Link>
            <Link href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
          </div>
          <div className="flex items-center gap-3">
            {authenticate.loading ? (
              <Button size="sm" variant="ghost" disabled className="gap-2">
                <IconLoader2 className="h-4 w-4 animate-spin" />
              </Button>
            ) : userIsLoggedIn ? (
              <Link href="/dashboard">
                <Button size="sm" className="gap-2">
                  Dashboard
                  <IconArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">
                    Log In
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm">
                    Get Started
                    <IconArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <Badge variant="secondary" className="mb-6">
            <IconBolt className="h-3 w-3 mr-1" />
            Software License Marketplace
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            {/* Sell Your Projects,{" "}
            <span className="text-primary">Earn Revenue</span> */}
            Turn Your Code Into Passive Income
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            List your software projects on our marketplace and sell licenses to developers worldwide.
            We handle licensing, payments, and deployments — you focus on building.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/auth/register">
              <Button size="lg" className="w-full sm:w-auto">
                Start Selling Today
                <IconArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                See How It Works
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-8 border-t">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Features</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to Sell Your Software
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From project listing to payment processing, we provide all the tools you need to build a successful software business.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="bg-background hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">How It Works</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              From Project to Sales in 4 Steps
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get your projects listed and start selling in minutes. Our streamlined process makes it easy to reach customers.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((step, index) => (
              <div key={index} className="relative">
                <div className="text-6xl font-bold text-primary/10 mb-4">{step.step}</div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
                {index < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-8 right-0 translate-x-1/2">
                    <IconArrowRight className="h-6 w-6 text-muted-foreground/30" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Developers Love Us */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Why Deploy Hub</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Built for Software Sellers
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We understand the challenges of selling software. That&apos;s why we built the marketplace we wished existed.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="bg-background">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconBrandGithub className="h-5 w-5" />
                  GitHub Integration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Connect your repositories directly. We automatically sync updates, manage versions, and handle deployments through GitHub Actions.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm">
                    <IconCheck className="h-4 w-4 text-green-500" />
                    Automatic version syncing
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <IconCheck className="h-4 w-4 text-green-500" />
                    Branch-based deployments
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <IconCheck className="h-4 w-4 text-green-500" />
                    Private repository support
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-background">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconCloud className="h-5 w-5" />
                  Multi-Cloud Deployments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Your customers can deploy to their preferred cloud provider. We support all major platforms out of the box.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm">
                    <IconCheck className="h-4 w-4 text-green-500" />
                    Vercel, Netlify, Railway
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <IconCheck className="h-4 w-4 text-green-500" />
                    AWS, GCP, Azure
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <IconCheck className="h-4 w-4 text-green-500" />
                    Custom infrastructure
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-background">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconLicense className="h-5 w-5" />
                  Smart Licensing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Create flexible license tiers that match your business model. From one-time purchases to subscriptions.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm">
                    <IconCheck className="h-4 w-4 text-green-500" />
                    Deployment limits
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <IconCheck className="h-4 w-4 text-green-500" />
                    Time-based licenses
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <IconCheck className="h-4 w-4 text-green-500" />
                    Feature gating
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-background">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconUsers className="h-5 w-5" />
                  Customer Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Full CRM capabilities to manage your customers, track their deployments, and provide support.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm">
                    <IconCheck className="h-4 w-4 text-green-500" />
                    Customer dashboard
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <IconCheck className="h-4 w-4 text-green-500" />
                    Deployment tracking
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <IconCheck className="h-4 w-4 text-green-500" />
                    Usage analytics
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Testimonials</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Trusted by Sellers Worldwide
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-background">
                <CardHeader>
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <IconStar key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">&ldquo;{testimonial.quote}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-semibold">{testimonial.author}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Pricing</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Start for free, upgrade as you grow. No hidden fees, no surprises.
            </p>

            {/* Billing toggle */}
            <div className="flex items-center justify-center gap-4">
              <span className={billingPeriod === "monthly" ? "font-semibold" : "text-muted-foreground"}>
                Monthly
              </span>
              <button
                onClick={() => setBillingPeriod(billingPeriod === "monthly" ? "yearly" : "monthly")}
                className="relative h-6 w-12 rounded-full bg-primary/20 transition-colors"
              >
                <div
                  className={`absolute top-1 h-4 w-4 rounded-full bg-primary transition-transform ${billingPeriod === "yearly" ? "translate-x-7" : "translate-x-1"
                    }`}
                />
              </button>
              <span className={billingPeriod === "yearly" ? "font-semibold" : "text-muted-foreground"}>
                Yearly
                <Badge variant="secondary" className="ml-2">Save 20%</Badge>
              </span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {loadingPlans ? (
              <div className="col-span-full flex justify-center py-12">
                <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              plans.map((plan, index) => (
                <Card key={index} className={`bg-background relative ${plan.popular ? "border-primary shadow-lg scale-105" : ""}`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary">Most Popular</Badge>
                    </div>
                  )}
                  <CardHeader className="text-center pb-2">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="mb-6">
                      <span className="text-4xl font-bold">
                        {plan.price === "Free" ? plan.price : (
                          billingPeriod === "yearly"
                            ? `$${plan.yearlyPrice}`
                            : `$${plan.monthlyPrice}`
                        )}
                      </span>
                      {plan.period && (
                        <span className="text-muted-foreground">
                          {billingPeriod === "yearly" ? "/year" : plan.period}
                        </span>
                      )}
                    </div>
                    <ul className="space-y-3 text-left mb-6">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center gap-2 text-sm">
                          <IconCheck className="h-4 w-4 text-green-500 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full"
                      variant={plan.popular ? "default" : "outline"}
                      onClick={() => handlePlanAction(plan)}
                      disabled={loadingPlanAction === plan.plan}
                    >
                      {loadingPlanAction === plan.plan ? (
                        <>
                          <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        plan.cta
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="text-center py-12">
              <IconWorld className="h-16 w-16 mx-auto mb-6 opacity-80" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Start Selling?
              </h2>
              <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
                Join our marketplace and reach developers looking for software solutions.
                Create your seller account today — it&apos;s free to get started.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth/register">
                  <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                    Create Seller Account
                    <IconArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="#pricing">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent border-primary-foreground/30 hover:bg-primary-foreground/10">
                    View Plans
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <Link href="/" className="flex items-center gap-2 mb-4">
                <IconRocket className="h-6 w-6 text-primary" />
                <span className="font-bold text-lg">Deploy Hub</span>
              </Link>
              <p className="text-sm text-muted-foreground mb-4">
                The marketplace for selling software licenses and deployable projects.
              </p>
              <div className="flex items-center gap-3">
                <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  <IconBrandTwitter className="h-5 w-5" />
                </Link>
                <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  <IconBrandGithub className="h-5 w-5" />
                </Link>
                <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  <IconBrandDiscord className="h-5 w-5" />
                </Link>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#features" className="hover:text-foreground transition-colors">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Changelog</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Roadmap</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">Documentation</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">API Reference</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Community</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">About</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Careers</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          <Separator className="mb-8" />

          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} Deploy Hub. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link href="#" className="hover:text-foreground transition-colors flex items-center gap-1">
                <IconHeadset className="h-4 w-4" />
                Support
              </Link>
              <Link href="#" className="hover:text-foreground transition-colors flex items-center gap-1">
                <IconMail className="h-4 w-4" />
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
