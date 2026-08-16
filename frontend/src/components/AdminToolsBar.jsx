import React from "react";
import { NavLink } from "react-router";
import {
  FaChartLine,
  FaStore,
  FaTachometerAlt,
} from "react-icons/fa";

const links = [
  {
    to: "/admin/dashboard",
    label: "Dashboard",
    icon: FaTachometerAlt,
  },
  {
    to: "/admin/analytics",
    label: "Analytics",
    icon: FaChartLine,
  },
  {
    to: "/admin/markaz",
    label: "Markaz",
    icon: FaStore,
  },
];

const AdminToolsBar = () => {
  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 sm:px-6 lg:px-8">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `relative inline-flex shrink-0 items-center gap-2 px-4 py-3 text-xs font-semibold transition ${
                isActive
                  ? "text-slate-950"
                  : "text-slate-400 hover:text-slate-700"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className="text-[11px]" />
                {label}
                {isActive && (
                  <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-slate-950" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default AdminToolsBar;
