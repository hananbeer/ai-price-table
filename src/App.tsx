import { useState } from "react"
import PriceTable from "@/components/PriceTable"
import PriceTableV1 from "@/components/PriceTableV1"
import "./App.css"

function App() {
  const [activeTable, setActiveTable] = useState<'v1' | 'v2'>('v1')

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          {/* <h1 className="text-4xl font-bold tracking-tight mb-4">
            AI Inference Price Table
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Calculate exact inference costs
          </p> */}
          
          {/* Table Navigation */}
          {/* <div className="flex justify-center space-x-2">
            <button
              onClick={() => setActiveTable('v1')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTable === 'v1'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Detailed Models (v1)
            </button>
            <button
              onClick={() => setActiveTable('v2')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTable === 'v2'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Standard Models (v2)
            </button>
          </div> */}
        </div>
        
        {activeTable === 'v1' ? <PriceTableV1 /> : <PriceTable />}
      </div>
    </div>
  )
}

export default App
