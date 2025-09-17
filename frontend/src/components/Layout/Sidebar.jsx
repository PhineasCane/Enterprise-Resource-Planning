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
  Menu,
} from "lucide-react";
import logo from "../../assets/file.png";
import UserPopup from "./UserPopup";

const Sidebar = ({ isOpen, onToggle }) => {
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
    <>
      {/* Sidebar */}
      <div
        className={`
        fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col h-full
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-center flex-1">
            <div className="w-50 h-20 flex items-center justify-center flex-shrink-0">
              <img
                src={logo}
                alt="logo"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          <button
            onClick={onToggle}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-6 overflow-y-auto">
          <div className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200
                    ${
                      isActive(item.href)
                        ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }
                  `}
                >
                  <Icon
                    className={`
                      mr-3 h-5 w-5 transition-colors duration-200
                      ${
                        isActive(item.href)
                          ? "text-blue-700"
                          : "text-gray-400 group-hover:text-gray-500"
                      }
                    `}
                  />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User section at bottom */}
        <div className="flex-shrink-0 p-4 border-t border-gray-200 mt-auto">
          <UserPopup isSidebar={true} />
        </div>
      </div>
    </>
  );
};

export default Sidebar;
