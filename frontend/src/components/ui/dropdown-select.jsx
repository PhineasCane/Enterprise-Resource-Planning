import React, { useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { cn } from "@/lib/utils";

const DropdownSelect = React.forwardRef(({ 
  options = [], 
  value, 
  onChange, 
  placeholder = "Select option", 
  className = "",
  disabled = false,
  ...props 
}, ref) => {
  const [open, setOpen] = useState(false);
  
  const selectedOption = options.find(option => option.value === value);
  const displayValue = selectedOption ? selectedOption.label : placeholder;

  const handleSelect = (optionValue) => {
    try {
      if (onChange) {
        onChange(optionValue);
      }
      setOpen(false);
    } catch (error) {
      console.error('Error in dropdown select:', error);
      setOpen(false);
    }
  };

  // Fallback to native select if dropdown fails
  if (!DropdownMenu || !DropdownMenuContent || !DropdownMenuItem || !DropdownMenuTrigger) {
    return (
      <select
        ref={ref}
        value={value || ""}
        onChange={(e) => onChange && onChange(e.target.value)}
        className={cn(
          "flex h-10 w-full appearance-none rounded-md border border-input bg-white px-3 py-2 text-sm",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 cursor-pointer",
          className
        )}
        disabled={disabled}
        {...props}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          ref={ref}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between h-10 px-3 py-2 text-sm",
            "border border-input bg-white hover:bg-gray-50 hover:border-gray-300",
            "focus:border-blue-500 focus:ring-blue-500 focus:ring-2 focus:ring-offset-2",
            "transition-all duration-200",
            disabled && "opacity-50 cursor-not-allowed",
            className
          )}
          disabled={disabled}
          type="button"
          {...props}
        >
          <span className={cn(
            "truncate",
            !selectedOption && "text-gray-500"
          )}>
            {displayValue}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-full min-w-[8rem] p-1">
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            className={cn(
              "cursor-pointer px-3 py-2 text-sm",
              "hover:bg-gray-100 focus:bg-gray-100",
              "flex items-center justify-between"
            )}
            onClick={() => handleSelect(option.value)}
          >
            <span>{option.label}</span>
            {value === option.value && (
              <Check className="h-4 w-4 text-blue-600" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

DropdownSelect.displayName = "DropdownSelect";

export default DropdownSelect; 