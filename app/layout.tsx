import type React from "react"
import type { Metadata, Viewport } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: {
    default: "RZManager - Modular RPG Development Studio",
    template: "%s | RZManager",
  },
  description:
    "A modular RPG game development studio with isolated environments for NPC editing, item management, database viewing, and visual node scripting.",
}

export const viewport: Viewport = {
  themeColor: "#1a1d2e",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Suspense fallback={<div className="flex h-screen items-center justify-center bg-background text-foreground">Loading...</div>}>{children}</Suspense>
        <Analytics />
      </body>
    </html>
  )
}
