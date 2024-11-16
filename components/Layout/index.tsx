import * as React from "react";
import NextLink from "next/link";
import {
  Bars3Icon,
  MagnifyingGlassIcon,
  ShoppingBagIcon,
  XMarkIcon,
  ShoppingCartIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

import Header, { HeaderProps } from "components/Layout/Header";

export interface CommonLayoutProps {
  children?: any;
  headerProps?: HeaderProps;
}

export default function CommonLayout(props: CommonLayoutProps) {
  const { headerProps, children } = props;

  return (
    <>
      <div
        className="min-h-full"
        style={{ fontFamily: "Noto Serif Ahom, serif" }}
      >
        <Header {...headerProps} />

        <main>
          <div className="mx-auto max-w-7xl py-6 px-4">
            {/* Your content */}
            {children}
          </div>
          <footer className="footer">
            <div className="container mx-auto text-center">
              <p className="text-white">
                &copy; {new Date().getFullYear()} Dev Tools. All rights
                reserved. |{" "}
                <a
                  href="https://devtools2.vercel.app"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  devtools.app
                </a>
              </p>
            </div>
          </footer>
        </main>
      </div>
    </>
  );
}
