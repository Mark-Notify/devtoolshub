// src/app/layout.tsx

import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

export const metadata: Metadata = {
  title: "Programmer Helper Tool",
  description:
    "Format JSON and Unserialize Data in one place with a user-friendly Monaco editor. Perfect for developers to easily format and process data.",
  keywords:
    "Programmer Helper, JSON formatter, Unserialize, Monaco editor, Developer tools, Data processing",
  openGraph: {
    title: "Programmer Helper Tool",
    description: "A tool for developers to format JSON and unserialize data with ease.",
    image: "https://wallpaperaccess.com/full/187161.jpg",
    url: "https://mark-notify.github.io/formatter",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Prompt:wght@100;200;300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-dark text-light" style={{ fontFamily: "Prompt, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
