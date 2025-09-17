import React from "react";
import { useFormContext } from "react-hook-form";
import { Button } from "../ui/button";
import { Trash2 } from "lucide-react";
import FormInput from "../FormControls/FormInput";
import FormNumberInput from "../FormControls/FormNumberInput";

const InvoiceItemRow = ({ field, remove, formatAmount }) => {
  const { watch, setValue } = useFormContext();
  
  const calculateTotal = (quantity, price) => {
    if (!quantity || !price) return 0;
    return Number(quantity) * Number(price);
  };

  const handleQuantityChange = (value) => {
    const price = watch(`items.${field.name}.price`);
    const total = calculateTotal(value, price);
    setValue(`items.${field.name}.total`, total);
  };

  const handlePriceChange = (value) => {
    const quantity = watch(`items.${field.name}.quantity`);
    const total = calculateTotal(quantity, value);
    setValue(`items.${field.name}.total`, total);
  };

  return (
    <div className="grid grid-cols-12 gap-4 items-center">
      <div className="col-span-3">
        <FormInput
          placeholder="Item name"
          {...field}
          name={`items.${field.name}.name`}
          rules={{ required: "Required" }}
        />
      </div>
      
      <div className="col-span-3">
        <FormInput
          placeholder="Description"
          {...field}
          name={`items.${field.name}.description`}
        />
      </div>
      
      <div className="col-span-2">
        <FormNumberInput
          min={1}
          step={1}
          placeholder="1"
          {...field}
          name={`items.${field.name}.quantity`}
          rules={{ required: "Required" }}
          onChange={(e) => {
            const value = e.target.value === '' ? 1 : Number(e.target.value);
            setValue(`items.${field.name}.quantity`, value);
            handleQuantityChange(value);
          }}
        />
      </div>
      
      <div className="col-span-2">
        <FormNumberInput
          min={0}
          step={0.01}
          placeholder="0.00"
          {...field}
          name={`items.${field.name}.price`}
          rules={{ required: "Required" }}
          onChange={(e) => {
            const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
            setValue(`items.${field.name}.price`, value);
            handlePriceChange(value);
          }}
        />
      </div>
      
      <div className="col-span-2">
        <div className="h-10 px-3 py-2 bg-white border border-input rounded-md text-sm flex items-center justify-end">
          {formatAmount(watch(`items.${field.name}.total`) || 0)}
        </div>
      </div>
      
      <div className="col-span-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => remove(field.name)}
          className="text-red-500 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default InvoiceItemRow;
