import * as React from "react";
import { useState } from "react";
import Header, { HeaderProps } from "components/Layout/Header";

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

  return (
    <div className="min-h-full" style={{ fontFamily: "Courier Prime, serif" }}>
      <Header {...headerProps} onThemeChange={handleThemeChange} />
      <main>
        <div key={refreshKey} className="mx-auto max-w-7xl py-6 px-4">
          {/* การเพิ่ม key ให้กับ children เพื่อให้ React รีเรนเดอร์ใหม่ทุกครั้งที่ refreshKey เปลี่ยน */}
          {children}
        </div>
        <footer className="py-4 shadow">
          <div className="container mx-auto text-center">
            <p className="text-lg">
              &copy; {new Date().getFullYear()} Dev Tools. All rights reserved. |{" "}
              <a
                href="https://devtools2.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-blue-500"
              >
                devtools.app
              </a>
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
