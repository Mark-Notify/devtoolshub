import { useRouter } from "next/router";
import React from "react";
import JsonFormat from "components/JsonFormat/JsonFormat";
import JsonFormatVertical from "components/JsonFormat/JsonFormatVertical";
import ComponentA from "components/DefaultComponent";
import CommonLayout from "components/Layout";

const SlugPage = () => {
  const router = useRouter();
  const { slug } = router.query; // ดึง slug จาก URL

  // ฟังก์ชันเลือก Component ที่จะแสดงตาม slug
  const renderComponent = () => {
    switch (slug) {
      case "json-format":
        return <JsonFormat />;
      case "json-format-vertical":
        return <JsonFormatVertical />;
      case "component-a":
        return <ComponentA />;
      default:
        return <div>Page not found</div>; // แสดงข้อความหาก slug ไม่ถูกต้อง
    }
  };

  return (
    <CommonLayout>
      <div className="mt-4">{renderComponent()}</div>
    </CommonLayout>
  );
};

export default SlugPage;
