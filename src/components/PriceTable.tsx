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
  provider: string
  inputPrice: number
  outputPrice: number
  unit: string
  contextWindow: string
  description: string
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: price < 0.01 ? 4 : 2,
    maximumFractionDigits: price < 0.01 ? 4 : 2,
  }).format(price)
}

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
              <TableHead>Provider</TableHead>
              <TableHead>Input Price</TableHead>
              <TableHead>Output Price</TableHead>
              <TableHead>Context Window</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {models.map((model) => (
              <TableRow key={`${model.provider}-${model.name}`}>
                <TableCell className="font-medium">{model.name}</TableCell>
                <TableCell>{model.provider}</TableCell>
                <TableCell>
                  {formatPrice(model.inputPrice)} {model.unit}
                </TableCell>
                <TableCell>
                  {formatPrice(model.outputPrice)} {model.unit}
                </TableCell>
                <TableCell>{model.contextWindow}</TableCell>
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

