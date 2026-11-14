import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RevenueMate | Merchant Sales & Lead Workflow Dashboard",
  description: "Next.js Merchant-Facing Dashboard Prototype for RevenueMate sales workflow automation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#121214] text-white antialiased min-h-screen selection:bg-purple-500 selection:text-black">
        {children}
      </body>
    </html>
  );
}

