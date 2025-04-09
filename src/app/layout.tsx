import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import StoreProvider from "@/providers/StoreProvider";
import { ThemeProvider as NextThemeProvider } from "@/components/theme-provider";
import { ThemeProvider } from "@/hooks/theme-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Deployment hub",
  description: "A deployment hub for your projects",
  icons: {
    icon: "/launching.png",
    shortcut: "/launching.png",
    apple: "/launching.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <StoreProvider>
          <NextThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ThemeProvider>{children}</ThemeProvider>
          </NextThemeProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
