import type { Metadata } from "next";
import { Poppins, Mulish } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});
const mulish = Mulish({
  variable: "--font-mulish",
  subsets: ["latin"],
  weight: [ "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Order Tracker",
  description: "A realtime order tracker application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${mulish.variable}  antialiased`}>{children}</body>
    </html>
  );
}
