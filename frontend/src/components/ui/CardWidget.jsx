import { Card, CardContent } from "./card";
import currency from "currency.js";

export default function CardWidget({ title, value, prefix = "", suffix = "" }) {
  return (
    <Card>
      <CardContent className="p-6">
        <p className="text-sm font-medium text-muted-foreground mb-2">{title}</p>
        <p className="text-2xl font-bold">
          {prefix}
          {currency(value).format()}
          {suffix}
        </p>
      </CardContent>
    </Card>
  );
}
