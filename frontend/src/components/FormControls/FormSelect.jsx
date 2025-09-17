import React from "react";
import { Label } from "../ui/label";
import DropdownSelect from "../ui/dropdown-select";

const FormSelect = React.forwardRef(({ 
  label, 
  options = [], 
  error, 
  className = "", 
  onChange,
  value,
  placeholder = "Select an option",
  ...props 
}, ref) => {
  const handleChange = (newValue) => {
    if (onChange) {
      onChange(newValue);
    }
  };

  return (
    <div className="space-y-2">
      {label && <Label htmlFor={props.id} className="text-sm font-medium text-gray-700">{label}</Label>}
      <DropdownSelect
        ref={ref}
        options={options}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className={`
          ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
});

FormSelect.displayName = "FormSelect";

export default FormSelect; 