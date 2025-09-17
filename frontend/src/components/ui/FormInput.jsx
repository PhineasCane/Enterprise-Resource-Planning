import { Input } from "./input";
import { Label } from "./label";

export default function FormInput({
  label,
  name,
  value,
  onChange,
  type = "text",
  ...rest
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        type={type}
        {...rest}
      />
    </div>
  );
}
