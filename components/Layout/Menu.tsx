import * as React from "react";
import { useRecoilState } from "recoil";
import { homePageQueryState } from "atoms";
import clsx from "clsx";

export default function SettingMenu() {
  // ใช้ข้อมูลแบบสแตติกแทนการดึงข้อมูลจากฐานข้อมูลหรือ API
  const menuList = ["UnSerialized", "xxx"];

  const [homePageQueryData, setHomePageQueryData] =
    useRecoilState(homePageQueryState);

  return (
    <div>
      <ul
        tabIndex={0}
        className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52"
      >
        <li>
          <div className="menu-title">Menu</div>
          <ul>
            {menuList.map((menuText) => (
              <li
                key={menuText}
                onClick={() => {
                  setHomePageQueryData({
                    ...homePageQueryData,
                    page: 1,
                    type: menuText,
                  });
                }}
              >
                <span
                  className={clsx({
                    active: homePageQueryData.type === menuText,
                  })}
                >
                  {menuText}
                </span>
              </li>
            ))}
          </ul>
        </li>
      </ul>
    </div>
  );
}
