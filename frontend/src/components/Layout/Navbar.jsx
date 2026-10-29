import React from "react";
import { Menu, RefreshCw, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "../ui/button";
import UserPopup from "./UserPopup";

const Navbar = ({ onToggleSidebar, isCollapsed }) => {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-3 lg:px-4 h-12 flex items-center justify-between flex-shrink-0 z-20">
      {/* Left side - Retract/Expand sidebar toggle button */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
          title={isCollapsed ? "Expand sidebar" : "Retract sidebar"}
          aria-label="Toggle sidebar"
        >
          {isCollapsed ? (
            <PanelLeftOpen className="w-5 h-5 text-gray-600 hover:text-blue-600" />
          ) : (
            <PanelLeftClose className="w-5 h-5 text-gray-600 hover:text-blue-600" />
          )}
        </button>
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 hidden sm:inline">
          B2B Portal
        </span>
      </div>

      {/* Right side - Refresh button and user */}
      <div className="flex items-center space-x-2">
        {/* Refresh button */}
        <Button
          onClick={handleRefresh}
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
          title="Refresh application"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
        
        {/* User menu */}
        <UserPopup />
      </div>
    </nav>
  );
};

export default Navbar;
