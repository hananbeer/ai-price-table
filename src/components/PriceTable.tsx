import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import pricesData from "@/data/prices.json"

interface PriceModel {
  name: string
  creator: string
  provider: string[]
  type: string
  inferenceFormula: string
  unit: string
  description: string
}

// function formatPrice(price: number): string {
//   return new Intl.NumberFormat("en-US", {
//     style: "currency",
//     currency: "USD",
//     minimumFractionDigits: price < 0.01 ? 4 : 2,
//     maximumFractionDigits: price < 0.01 ? 4 : 2,
//   }).format(price)
// }

export default function PriceTable() {
  const models = pricesData.models as PriceModel[]

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle>AI Model Pricing</CardTitle>
        <CardDescription>
          Compare pricing across different AI models and providers
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Model</TableHead>
              <TableHead>Creator</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Pricing Formula</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {models.map((model) => (
              <TableRow key={`${model.creator}-${model.name}`}>
                <TableCell className="font-medium">{model.name}</TableCell>
                <TableCell>{model.creator}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {model.provider.map((p, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </TableCell>
                <TableCell>{model.type}</TableCell>
                <TableCell>
                  <code className="text-sm bg-muted px-2 py-1 rounded">
                    {model.inferenceFormula}
                  </code>
                  <div className="text-xs text-muted-foreground mt-1">
                    {model.unit}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {model.description}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

