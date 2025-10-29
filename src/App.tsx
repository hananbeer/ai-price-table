import PriceTable from "@/components/PriceTable"
import "./App.css"

function App() {
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            AI Model Pricing Comparison
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Compare pricing across leading AI models from OpenAI, Anthropic, Google, Meta, and more.
            All prices are per 1K tokens unless otherwise specified.
          </p>
        </div>
        <PriceTable />
      </div>
    </div>
  )
}

export default App
