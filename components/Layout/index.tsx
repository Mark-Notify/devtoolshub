import * as React from "react";
import { useState } from "react";
import Header, { HeaderProps } from "components/Layout/Header";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";

export interface CommonLayoutProps {
  children?: any;
  headerProps?: HeaderProps;
  onThemeChange?: () => void; // Optional callback for theme change
}

export default function CommonLayout(props: CommonLayoutProps) {
  const { headerProps, children, onThemeChange } = props;
  // State เพื่อกระตุ้นการ re-render ของ children เมื่อธีมเปลี่ยน
  const [refreshKey, setRefreshKey] = useState(0);

  // ฟังก์ชันเพื่อจัดการการเปลี่ยนแปลงธีม
  const handleThemeChange = () => {
    setRefreshKey((prev) => prev + 1); // เพิ่ม refreshKey เพื่อกระตุ้น re-render
    if (onThemeChange) {
      onThemeChange(); // ตรวจสอบว่า onThemeChange ถูกกำหนดแล้วจึงเรียกใช้
    }
  };

  // ฟังก์ชันย่อยสำหรับ Analytics
  const RenderAnalytics = () => {
    return <Analytics debug={true} />;
  };

  // ฟังก์ชันย่อยสำหรับ SpeedInsights
  const RenderSpeedInsights = () => {
    return <SpeedInsights />;
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ fontFamily: "Courier Prime, serif" }}>
      <Header {...headerProps} onThemeChange={handleThemeChange} />
      <main>
        <RenderAnalytics />
        <div key={refreshKey} className="">
          {children}
        </div>
      </main>
      <footer className="p-4 shadow bg-base-100">
        <div className="text-center">
          <p className="text-lg">
            &copy; {new Date().getFullYear()} Dev Tools. All rights reserved. |{" "}
            <a
              href="https://www.devtoolshub.org"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-blue-500"
            >
              DevToolsHub.org
            </a>
          </p>
        </div>
        <RenderSpeedInsights />
      </footer>
    </div>
  );
}
