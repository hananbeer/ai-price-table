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
import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"

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

function valuePer1000Units(price: number, units: string): string {
  if (units.includes('seconds')) {
    return (1000 / price / 60 / 60).toFixed(2) + ' hours'
  } else if (units.includes('minutes')) {
    return (1000 / price / 60).toFixed(2) + ' hours'
  } else if (units.includes('mega pixels')) {
    return (1000 / price).toFixed(0) + ' HD images'
  } else if (units.includes('kilo video tokens')) {
    return (46.3 / price / 60 / 60).toFixed(2) + ' HD video hours'
  } else if (units.includes('mega video tokens')) {
    // for example, 5s HD price = $0.18, 1s HD price = $0.036, $1000 = 26315.8 seconds HD = 438.6 hours of HD video

    // video tokens = (height x width x FPS x duration) / 1024
    // video tokens per second = (1280 * 720 * 24) / 1024 = 21600
    // 1,000,000 tokens / 21,600 tokens per second = 46.3 seconds of HD video per million tokens price unit
    // price => 46.3 HD video seconds
    // $1 = (46.3 / price) HD video seconds
    // $1000 = (46.3 / price) * 1000 HD video seconds
    // 1MVT = price
    // price per second = price / 21,600
    // 1000 X = 46,000 seconds
    // $1000 = 46,000 / X
    return (46.3 / price * 1000 / 60 / 60).toFixed(2) + ' HD video hours'
  } else {
    return (1000 / price).toFixed(0) + ' ' + units
  }
}

function formatPrice(price: number, units: string, option?: string): React.ReactNode {
  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 5,
  }).format(price)
  return <>
    <p>{formattedPrice}{option ? ` for ${option}` : ''}</p>
    <p className="text-xs text-muted-foreground">$1000 = {valuePer1000Units(price, units)}</p>
  </>
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
        aValue = (a.inputs || '').toLowerCase()
        bValue = (b.inputs || '').toLowerCase()
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
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set())
  const [showTypeMenu, setShowTypeMenu] = useState<boolean>(false)
  const [selectedInputs, setSelectedInputs] = useState<Set<string>>(new Set())
  const [showInputMenu, setShowInputMenu] = useState<boolean>(false)
  const [selectedOutputs, setSelectedOutputs] = useState<Set<string>>(new Set())
  const [showOutputMenu, setShowOutputMenu] = useState<boolean>(false)
  const [selectedUnits, setSelectedUnits] = useState<Set<string>>(new Set())
  const [showUnitsMenu, setShowUnitsMenu] = useState<boolean>(false)
  
  const models = pricesV1Data as PriceModelV1[]
  const tagOptions = useMemo(() => {
    const unique = new Set<string>()
    for (const item of models) {
      if (typeof item.tag === 'string' && item.tag.trim().length > 0) {
        unique.add(item.tag)
      }
    }
    return Array.from(unique).sort((a, b) => formatTag(a).localeCompare(formatTag(b)))
  }, [models])

  const inputOptions = useMemo(() => {
    const unique = new Set<string>()
    for (const item of models) {
      if (typeof item.inputs === 'string' && item.inputs.trim().length > 0) unique.add(item.inputs)
    }
    return Array.from(unique).sort((a, b) => a.localeCompare(b))
  }, [models])

  const outputOptions = useMemo(() => {
    const unique = new Set<string>()
    for (const item of models) {
      if (typeof item.output === 'string' && item.output.trim().length > 0) unique.add(item.output)
    }
    return Array.from(unique).sort((a, b) => a.localeCompare(b))
  }, [models])

  const unitOptions = useMemo(() => {
    const unique = new Set<string>()
    for (const item of models) {
      if (typeof item.bip_units === 'string' && item.bip_units.trim().length > 0) unique.add(item.bip_units)
    }
    return Array.from(unique).sort((a, b) => a.localeCompare(b))
  }, [models])

  let filteredModels = models
  if (selectedTags.size > 0) filteredModels = filteredModels.filter(m => selectedTags.has(m.tag))
  if (selectedInputs.size > 0) filteredModels = filteredModels.filter(m => selectedInputs.has(m.inputs))
  if (selectedOutputs.size > 0) filteredModels = filteredModels.filter(m => selectedOutputs.has(m.output))
  if (selectedUnits.size > 0) filteredModels = filteredModels.filter(m => selectedUnits.has(m.bip_units))
  const sortedModels = sortColumn ? sortData(filteredModels, sortColumn, sortDirection) : filteredModels

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

        {/* Add chart here */}

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
                  className="w-[120px] cursor-pointer hover:bg-gray-50 select-none relative"
                  onClick={() => handleSort('tag')}
                >
                  <div className="flex items-center gap-2">
                    <span className="flex items-center">
                      Type
                      {getSortIcon('tag')}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={(e) => { e.stopPropagation(); setShowTypeMenu(!showTypeMenu) }}
                      aria-expanded={showTypeMenu}
                      aria-haspopup="true"
                    >
                      Filter{selectedTags.size ? ` (${selectedTags.size})` : ''}
                    </Button>
                  </div>
                  {showTypeMenu && (
                    <div
                      className="absolute z-20 mt-2 w-64 rounded-md border border-gray-200 bg-white p-2 shadow-lg"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-600">Filter types</span>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => setSelectedTags(new Set())}
                          >
                            Clear
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => setSelectedTags(new Set(tagOptions))}
                          >
                            All
                          </Button>
                        </div>
                      </div>
                      <div className="max-h-64 overflow-auto pr-1">
                        {tagOptions.map(tag => {
                          const id = `tag-${tag}`
                          const checked = selectedTags.has(tag)
                          return (
                            <label key={tag} htmlFor={id} className="flex items-center gap-2 py-1.5 px-1 rounded hover:bg-gray-50 cursor-pointer">
                              <input
                                id={id}
                                type="checkbox"
                                className="h-4 w-4"
                                checked={checked}
                                onChange={(e) => {
                                  setSelectedTags(prev => {
                                    const next = new Set(prev)
                                    if (e.target.checked) {
                                      next.add(tag)
                                    } else {
                                      next.delete(tag)
                                    }
                                    return next
                                  })
                                }}
                              />
                              <span className="text-sm text-gray-800">{formatTag(tag)}</span>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </TableHead>
                <TableHead 
                  className="w-[120px] cursor-pointer hover:bg-gray-50 select-none relative"
                  onClick={() => handleSort('inputs')}
                >
                  <div className="flex items-center gap-2">
                    <span className="flex items-center">
                      Input
                      {getSortIcon('inputs')}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={(e) => { e.stopPropagation(); setShowInputMenu(!showInputMenu) }}
                      aria-expanded={showInputMenu}
                      aria-haspopup="true"
                    >
                      Filter{selectedInputs.size ? ` (${selectedInputs.size})` : ''}
                    </Button>
                  </div>
                  {showInputMenu && (
                    <div
                      className="absolute z-20 mt-2 w-64 rounded-md border border-gray-200 bg-white p-2 shadow-lg"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-600">Filter inputs</span>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => setSelectedInputs(new Set())}
                          >
                            Clear
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => setSelectedInputs(new Set(inputOptions))}
                          >
                            All
                          </Button>
                        </div>
                      </div>
                      <div className="max-h-64 overflow-auto pr-1">
                        {inputOptions.map(val => {
                          const id = `input-${val}`
                          const checked = selectedInputs.has(val)
                          return (
                            <label key={val} htmlFor={id} className="flex items-center gap-2 py-1.5 px-1 rounded hover:bg-gray-50 cursor-pointer">
                              <input
                                id={id}
                                type="checkbox"
                                className="h-4 w-4"
                                checked={checked}
                                onChange={(e) => {
                                  setSelectedInputs(prev => {
                                    const next = new Set(prev)
                                    if (e.target.checked) next.add(val); else next.delete(val)
                                    return next
                                  })
                                }}
                              />
                              <span className="text-sm text-gray-800">{val}</span>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </TableHead>
                <TableHead 
                  className="w-[120px] cursor-pointer hover:bg-gray-50 select-none relative"
                  onClick={() => handleSort('output')}
                >
                  <div className="flex items-center gap-2">
                    <span className="flex items-center">
                      Output
                      {getSortIcon('output')}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={(e) => { e.stopPropagation(); setShowOutputMenu(!showOutputMenu) }}
                      aria-expanded={showOutputMenu}
                      aria-haspopup="true"
                    >
                      Filter{selectedOutputs.size ? ` (${selectedOutputs.size})` : ''}
                    </Button>
                  </div>
                  {showOutputMenu && (
                    <div
                      className="absolute z-20 mt-2 w-64 rounded-md border border-gray-200 bg-white p-2 shadow-lg"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-600">Filter outputs</span>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => setSelectedOutputs(new Set())}
                          >
                            Clear
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => setSelectedOutputs(new Set(outputOptions))}
                          >
                            All
                          </Button>
                        </div>
                      </div>
                      <div className="max-h-64 overflow-auto pr-1">
                        {outputOptions.map(val => {
                          const id = `output-${val}`
                          const checked = selectedOutputs.has(val)
                          return (
                            <label key={val} htmlFor={id} className="flex items-center gap-2 py-1.5 px-1 rounded hover:bg-gray-50 cursor-pointer">
                              <input
                                id={id}
                                type="checkbox"
                                className="h-4 w-4"
                                checked={checked}
                                onChange={(e) => {
                                  setSelectedOutputs(prev => {
                                    const next = new Set(prev)
                                    if (e.target.checked) next.add(val); else next.delete(val)
                                    return next
                                  })
                                }}
                              />
                              <span className="text-sm text-gray-800">{val}</span>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </TableHead>
                <TableHead 
                  className="w-[120px] cursor-pointer hover:bg-gray-50 select-none relative"
                  onClick={() => handleSort('bip_units')}
                >
                  <div className="flex items-center gap-2">
                    <span className="flex items-center">
                      Units
                      {getSortIcon('bip_units')}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={(e) => { e.stopPropagation(); setShowUnitsMenu(!showUnitsMenu) }}
                      aria-expanded={showUnitsMenu}
                      aria-haspopup="true"
                    >
                      Filter{selectedUnits.size ? ` (${selectedUnits.size})` : ''}
                    </Button>
                  </div>
                  {showUnitsMenu && (
                    <div
                      className="absolute z-20 mt-2 w-64 rounded-md border border-gray-200 bg-white p-2 shadow-lg"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-600">Filter units</span>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => setSelectedUnits(new Set())}
                          >
                            Clear
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => setSelectedUnits(new Set(unitOptions))}
                          >
                            All
                          </Button>
                        </div>
                      </div>
                      <div className="max-h-64 overflow-auto pr-1">
                        {unitOptions.map(val => {
                          const id = `units-${val}`
                          const checked = selectedUnits.has(val)
                          return (
                            <label key={val} htmlFor={id} className="flex items-center gap-2 py-1.5 px-1 rounded hover:bg-gray-50 cursor-pointer">
                              <input
                                id={id}
                                type="checkbox"
                                className="h-4 w-4"
                                checked={checked}
                                onChange={(e) => {
                                  setSelectedUnits(prev => {
                                    const next = new Set(prev)
                                    if (e.target.checked) next.add(val); else next.delete(val)
                                    return next
                                  })
                                }}
                              />
                              <span className="text-sm text-gray-800">{val}</span>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </TableHead>
                <TableHead 
                  className="w-[320px] cursor-pointer hover:bg-gray-50 select-none"
                  onClick={() => handleSort('bip_price_usd')}
                >
                  <div className="flex items-center">
                    Base Inference Price
                    {getSortIcon('bip_price_usd')}
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
                  <TableCell>
                    {(() => {
                      const colors = getLabelColor(model.bip_units || 'N/A')
                      return (
                        <span className={`inline-flex items-center rounded-md ${colors.bg} px-2 py-1 text-xs font-medium ${colors.text}`}>
                          {model.bip_units || 'N/A'}
                        </span>
                      )
                    })()}
                  </TableCell>
                  <TableCell className="font-mono text-nowrap max-w-[200px] truncate">
                    {model.options ? model.options.split('\n').map((option, idx) => {
                      return formatPrice(Number(model.bip_price_usd.toString().split('\n')[idx]), model.bip_units, option)
                    }) :
                    formatPrice(model.bip_price_usd as number, model.bip_units)}
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
