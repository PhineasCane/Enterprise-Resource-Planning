import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Users,
  FileText,
  Box,
  CreditCard,
  BarChart3,
  Settings,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import logo from "../../assets/file.png";
import UserPopup from "./UserPopup";

const Sidebar = ({ isOpen, onClose, isCollapsed, onToggleCollapse }) => {
  const location = useLocation();

  const navigation = [
    { name: "Dashboard", href: "/", icon: Home },
    { name: "Customers", href: "/customers", icon: Users },
    { name: "Products", href: "/products", icon: Box },
    { name: "Invoices", href: "/invoices", icon: FileText },
    { name: "Payments", href: "/payments", icon: CreditCard },
    { name: "Inventory", href: "/inventory", icon: Box },
    { name: "Expenses", href: "/expenses", icon: CreditCard },
    { name: "Reports", href: "/reports", icon: BarChart3 },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const isActive = (href) => {
    if (href === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(href);
  };

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-40 bg-white border-r border-gray-200 transform transition-all duration-300 ease-in-out lg:static lg:inset-0 flex flex-col h-full flex-shrink-0
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        ${isCollapsed ? "lg:w-20" : "lg:w-64"}
        w-64
      `}
    >
      {/* Header matching Navbar h-12 */}
      <div className="flex items-center justify-between h-12 px-3 border-b border-gray-200 flex-shrink-0">
        <div className={`flex items-center ${isCollapsed ? "justify-center w-full" : "space-x-2 pl-2"}`}>
          <img
            src={logo}
            alt="logo"
            className={`${isCollapsed ? "h-7 w-7 object-contain" : "h-7 max-w-[140px] object-contain"}`}
          />
          {!isCollapsed && (
            <span className="font-bold text-sm tracking-tight text-gray-900 truncate">
              African Garden
            </span>
          )}
        </div>

        {/* Mobile close button */}
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-2.5 py-4 overflow-y-auto space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => {
                if (isOpen && window.innerWidth < 1024) onClose();
              }}
              title={isCollapsed ? item.name : undefined}
              className={`
                group flex items-center rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer
                ${isCollapsed ? "justify-center p-2.5" : "px-3 py-2"}
                ${
                  active
                    ? "bg-blue-600 text-white shadow-sm font-semibold"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }
              `}
            >
              <Icon
                className={`
                  h-5 w-5 flex-shrink-0 transition-colors
                  ${isCollapsed ? "" : "mr-3"}
                  ${active ? "text-white" : "text-gray-500 group-hover:text-gray-700"}
                `}
              />
              {!isCollapsed && <span className="truncate">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Retract toggle button at bottom for desktop */}
      <div className="hidden lg:flex items-center justify-between px-3 py-2 border-t border-gray-100 bg-gray-50/50">
        {!isCollapsed && (
          <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
            Collapse view
          </span>
        )}
        <button
          onClick={onToggleCollapse}
          className={`p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 transition-colors cursor-pointer ${
            isCollapsed ? "mx-auto" : ""
          }`}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* User section at bottom */}
      <div className="flex-shrink-0 p-2.5 border-t border-gray-200 mt-auto">
        <UserPopup isSidebar={true} isCollapsed={isCollapsed} />
      </div>
    </aside>
  );
};

export default Sidebar;
