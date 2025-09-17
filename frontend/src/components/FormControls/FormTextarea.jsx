import React from "react";
import { Label } from "../ui/label";

const FormTextarea = React.forwardRef(({ 
  label, 
  error, 
  rows = 3,
  className = "", 
  ...props 
}, ref) => {
  return (
    <div className="space-y-2">
      {label && <Label htmlFor={props.id}>{label}</Label>}
      <textarea
        ref={ref}
        rows={rows}
        className={`
          flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background 
          placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring 
          focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none
          ${error ? 'border-red-500 focus-visible:ring-red-500' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
});

FormTextarea.displayName = "FormTextarea";

export default FormTextarea; 