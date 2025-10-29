import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import pricesV1Data from "@/data/prices-v1.json"
import { useState } from "react"

interface PriceModelV1 {
  model_id: string
  tag: string
  inputs: string
  output: string
  options: string | null
  bip_units: string
  bip_price_usd: number | string
  notes: string | null
  description: string | null
}

type SortColumn = 'model_id' | 'tag' | 'inputs' | 'output' | 'bip_price_usd' | 'bip_units'
type SortDirection = 'asc' | 'desc'

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: price < 0.01 ? 4 : 2,
    maximumFractionDigits: price < 0.01 ? 4 : 2,
  }).format(price)
}

function formatModelId(modelId: string): string {
  // Extract the model name from the model_id (everything after the last slash)
  const parts = modelId.split('/')
  return parts[parts.length - 1] || modelId
}

function formatTag(tag: string): string {
  // Convert kebab-case to title case
  return tag
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash)
}

function getLabelColor(text: string): { bg: string; text: string } {
  const hash = hashString(text)
  const colors = [
    { bg: 'bg-red-100', text: 'text-red-800' },
    { bg: 'bg-blue-100', text: 'text-blue-800' },
    { bg: 'bg-green-100', text: 'text-green-800' },
    { bg: 'bg-yellow-100', text: 'text-yellow-800' },
    { bg: 'bg-purple-100', text: 'text-purple-800' },
    { bg: 'bg-pink-100', text: 'text-pink-800' },
    { bg: 'bg-indigo-100', text: 'text-indigo-800' },
    { bg: 'bg-orange-100', text: 'text-orange-800' },
    { bg: 'bg-teal-100', text: 'text-teal-800' },
    { bg: 'bg-cyan-100', text: 'text-cyan-800' },
    { bg: 'bg-lime-100', text: 'text-lime-800' },
    { bg: 'bg-amber-100', text: 'text-amber-800' },
  ]
  return colors[hash % colors.length]
}

function sortData(data: PriceModelV1[], column: SortColumn, direction: SortDirection): PriceModelV1[] {
  return [...data].sort((a, b) => {
    let aValue: string | number
    let bValue: string | number

    switch (column) {
      case 'model_id':
        aValue = formatModelId(a.model_id).toLowerCase()
        bValue = formatModelId(b.model_id).toLowerCase()
        break
      case 'tag':
        aValue = formatTag(a.tag).toLowerCase()
        bValue = formatTag(b.tag).toLowerCase()
        break
      case 'inputs':
        aValue = a.inputs.toLowerCase()
        bValue = b.inputs.toLowerCase()
        break
      case 'output':
        aValue = a.output.toLowerCase()
        bValue = b.output.toLowerCase()
        break
      case 'bip_price_usd':
        aValue = a.bip_price_usd
        bValue = b.bip_price_usd
        break
      case 'bip_units':
        aValue = a.bip_units.toLowerCase()
        bValue = b.bip_units.toLowerCase()
        break
      default:
        return 0
    }

    if (aValue < bValue) return direction === 'asc' ? -1 : 1
    if (aValue > bValue) return direction === 'asc' ? 1 : -1
    return 0
  })
}

export default function PriceTableV1() {
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  
  const models = pricesV1Data as PriceModelV1[]
  const sortedModels = sortColumn ? sortData(models, sortColumn, sortDirection) : models

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) {
      return (
        <span className="ml-1 text-gray-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        </span>
      )
    }
    
    return (
      <span className="ml-1 text-blue-600">
        {sortDirection === 'asc' ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </span>
    )
  }

  return (
    <Card className="w-full max-w-7xl mx-auto">
      <CardHeader>
        <CardTitle>AI Inference Price Table</CardTitle>
        <CardDescription>
          Calculate exact inference costs
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="w-[200px] cursor-pointer hover:bg-gray-50 select-none"
                  onClick={() => handleSort('model_id')}
                >
                  <div className="flex items-center">
                    Model
                    {getSortIcon('model_id')}
                  </div>
                </TableHead>
                <TableHead 
                  className="w-[120px] cursor-pointer hover:bg-gray-50 select-none"
                  onClick={() => handleSort('tag')}
                >
                  <div className="flex items-center">
                    Type
                    {getSortIcon('tag')}
                  </div>
                </TableHead>
                <TableHead 
                  className="w-[100px] cursor-pointer hover:bg-gray-50 select-none"
                  onClick={() => handleSort('inputs')}
                >
                  <div className="flex items-center">
                    Input
                    {getSortIcon('inputs')}
                  </div>
                </TableHead>
                <TableHead 
                  className="w-[100px] cursor-pointer hover:bg-gray-50 select-none"
                  onClick={() => handleSort('output')}
                >
                  <div className="flex items-center">
                    Output
                    {getSortIcon('output')}
                  </div>
                </TableHead>
                <TableHead 
                  className="w-[120px] cursor-pointer hover:bg-gray-50 select-none"
                  onClick={() => handleSort('bip_price_usd')}
                >
                  <div className="flex items-center">
                    Price
                    {getSortIcon('bip_price_usd')}
                  </div>
                </TableHead>
                <TableHead 
                  className="w-[120px] cursor-pointer hover:bg-gray-50 select-none"
                  onClick={() => handleSort('bip_units')}
                >
                  <div className="flex items-center">
                    Units
                    {getSortIcon('bip_units')}
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedModels.map((model, index) => (
                <TableRow key={`${model.model_id}-${index}`}>
                  <TableCell className="font-medium max-w-[200px] truncate">
                    <div className="space-y-1 max-w-[200px]">
                      <div className="font-semibold truncate">
                        <a href={`https://fal.ai/models/${model.model_id}`} target="_blank" rel="noopener noreferrer">{model.model_id}</a>
                      </div>
                      <div className="text-xs text-muted-foreground font-mono whitespace-pre-wrap">
                        {model.description}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const tagText = formatTag(model.tag)
                      const colors = getLabelColor(tagText)
                      return (
                        <span className={`inline-flex items-center rounded-md ${colors.bg} px-2 py-1 text-xs font-medium ${colors.text}`}>
                          {tagText}
                        </span>
                      )
                    })()}
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const colors = getLabelColor(model.inputs || 'N/A')
                      return (
                        <span className={`inline-flex items-center rounded-md ${colors.bg} px-2 py-1 text-xs font-medium ${colors.text}`}>
                          {model.inputs || 'N/A'}
                        </span>
                      )
                    })()}
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const colors = getLabelColor(model.output)
                      return (
                        <span className={`inline-flex items-center rounded-md ${colors.bg} px-2 py-1 text-xs font-medium ${colors.text}`}>
                          {model.output}
                        </span>
                      )
                    })()}
                  </TableCell>
                  <TableCell className="font-mono text-nowrap max-w-[200px] truncate">
                    {model.options ? model.options.split('\n').map((option, idx) => {
                      return <p>{formatPrice(Number(model.bip_price_usd.toString().split('\n')[idx])) + ' for ' + option}</p>
                    }) :
                    formatPrice(model.bip_price_usd as number)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground text-nowrap">
                    {model.bip_units}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
