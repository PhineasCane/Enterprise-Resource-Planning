import React from "react";
import { Bell, Menu, RefreshCw } from "lucide-react";
import { Button } from "../ui/button";
import UserPopup from "./UserPopup";

const Navbar = ({ onToggleSidebar }) => {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-2 lg:px-6 h-16 flex items-center">
      <div className="flex items-center justify-between w-full">
        {/* Left side - Mobile menu button only */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Right side - Refresh button and user */}
        <div className="flex items-center space-x-3">
          {/* Refresh button */}
          <Button
            onClick={handleRefresh}
            size="sm"
            className="h-9 w-9 p-0 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
            title="Refresh page"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          
          {/* User menu */}
          <UserPopup />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
