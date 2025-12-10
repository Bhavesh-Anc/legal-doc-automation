import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AnalyticsProvider } from "@/components/providers/AnalyticsProvider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Legal Doc Automation - Generate Legal Documents in Minutes",
  description: "Automated document generation for family law attorneys. Save 3+ hours per case with AI-powered templates.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AnalyticsProvider>{children}</AnalyticsProvider>
      </body>
    </html>
  )
}