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
    <html lang="en">
      <body className="bg-[#FFF3EE] text-[#291A17] antialiased min-h-screen selection:bg-[#FFD4C7] selection:text-[#291A17]">
        {children}
      </body>
    </html>
  );
}
