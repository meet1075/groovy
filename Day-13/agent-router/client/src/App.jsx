import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Calculator, MessageSquare, Terminal, Settings, 
  CheckCircle2, XCircle, Clock, ChevronRight, Activity, X
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// --- Icons & Colors Mapping ---
const TOOL_CONFIG = {
  web_search: { label: "Search", icon: Search, color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-500/20" },
  calculator: { label: "Calculator", icon: Calculator, color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-500/20" },
  send_slack: { label: "Slack", icon: MessageSquare, color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-500/20" },
};

// --- Sub-components for Results ---
function SearchResult({ result }) {
  if (!result || !result.results) return null;
  return (
    <div className="mt-3 flex flex-col gap-2">
      <div className="font-mono text-xs text-zinc-500 mb-1">Query: {result.query}</div>
      {result.results.map((item, idx) => (
        <a key={idx} href={item.url} target="_blank" rel="noreferrer" className="block p-3 rounded-md bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors">
          <div className="text-blue-400 text-sm font-medium mb-1 truncate">{item.title}</div>
          <div className="text-zinc-400 text-xs line-clamp-2 leading-relaxed">{item.content}</div>
          <div className="text-zinc-600 text-[10px] mt-2 truncate">{item.url}</div>
        </a>
      ))}
    </div>
  );
}

function CalculatorResult({ result }) {
  if (!result) return null;
  return (
    <div className="mt-3 p-4 rounded-md bg-zinc-900 border border-amber-500/20 flex flex-col gap-2">
      <div className="font-mono text-xs text-zinc-500">Expression parsed: <span className="text-amber-500/70">{result.parsed}</span></div>
      <div className="font-mono text-2xl text-amber-400 font-medium">
        = {typeof result.result === 'number' ? result.result.toLocaleString() : result.result}
      </div>
    </div>
  );
}

function SlackResult({ result }) {
  if (!result) return null;
  return (
    <div className="mt-3 p-4 rounded-md bg-zinc-900 border border-emerald-500/20">
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        <span className="text-xs font-medium text-emerald-400">Message Sent to Webhook</span>
      </div>
      <div className="pl-4 border-l-2 border-zinc-800 text-sm text-zinc-300 whitespace-pre-wrap font-sans">
        {result.message}
      </div>
    </div>
  );
}

// --- Trace Card Component ---
function TraceCard({ entry }) {
  const [stage, setStage] = useState(entry.status === 'complete' || entry.status === 'error' ? 4 : 1);
  
  useEffect(() => {
    // If it's a streaming event, we just follow the status
    if (entry.status === 'analyzing') setStage(1);
    if (entry.status === 'detected') setStage(2);
    if (entry.status === 'executing') setStage(3);
    if (entry.status === 'complete' || entry.status === 'error') setStage(4);
  }, [entry.status]);

  const ToolMeta = entry.tool && TOOL_CONFIG[entry.tool] ? TOOL_CONFIG[entry.tool] : null;
  const ToolIcon = ToolMeta?.icon || Activity;
  const borderColor = entry.status === 'error' ? 'border-red-500/50' : (ToolMeta?.border || 'border-zinc-800');

  return (
    <div className={cn("p-5 rounded-lg bg-zinc-950 border border-l-4 shadow-sm transition-all duration-300", borderColor)}>
      {/* Request Line */}
      <div className="flex justify-between items-start mb-4">
        <div className="font-mono text-sm text-zinc-100">{entry.message}</div>
        <div className="text-[10px] text-zinc-600 font-mono ml-4 shrink-0">
          {new Date(entry.timestamp).toLocaleTimeString()}
        </div>
      </div>

      {/* Routing Decision Progression */}
      <div className="flex items-center gap-2 text-xs font-mono bg-zinc-900/50 p-2 rounded border border-zinc-800/50 mb-4">
        <span className={cn("transition-opacity", stage >= 1 ? "text-zinc-400" : "opacity-30")}>Analyzing</span>
        <ChevronRight className="w-3 h-3 text-zinc-600" />
        
        {stage >= 2 && ToolMeta ? (
          <span className={cn("flex items-center gap-1.5 transition-opacity px-1.5 py-0.5 rounded", ToolMeta.bg, ToolMeta.color)}>
            <ToolIcon className="w-3 h-3" />
            Detected: {ToolMeta.label}
          </span>
        ) : (
          <span className={cn("transition-opacity", stage >= 2 ? "text-zinc-400" : "opacity-30")}>Routing</span>
        )}
        
        <ChevronRight className="w-3 h-3 text-zinc-600" />
        <span className={cn("transition-opacity", stage >= 3 ? "text-zinc-400" : "opacity-30")}>Executing</span>
      </div>

      {/* Reasoning (if detected) */}
      {entry.reason && stage >= 2 && (
        <div className="text-xs text-zinc-500 mb-4 ml-1 flex items-center gap-1.5">
          <Terminal className="w-3 h-3" />
          <span>{entry.reason}</span>
        </div>
      )}

      {/* Execution Result */}
      {stage >= 4 && entry.status === 'complete' && entry.result && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
          {entry.tool === 'web_search' && <SearchResult result={entry.result} />}
          {entry.tool === 'calculator' && <CalculatorResult result={entry.result} />}
          {entry.tool === 'send_slack' && <SlackResult result={entry.result} />}
        </div>
      )}

      {/* Error State */}
      {stage >= 4 && entry.status === 'error' && (
        <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-md text-red-400 text-sm flex items-start gap-2">
          <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{entry.error}</span>
        </div>
      )}

      {/* Footer Metadata */}
      {stage >= 4 && entry.metadata && (
        <div className="mt-4 pt-3 border-t border-zinc-800/50 flex gap-4 text-[10px] text-zinc-600 font-mono">
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {entry.metadata.duration}ms</span>
          {entry.metadata.cost > 0 && <span>Cost: ${entry.metadata.cost.toFixed(4)}</span>}
        </div>
      )}
    </div>
  );
}

// --- Main Application ---
export default function App() {
  const [config, setConfig] = useState({ search: {}, calculator: {}, slack: {} });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [input, setInput] = useState('');
  const [traces, setTraces] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef(null);

  // Fetch config status
  useEffect(() => {
    fetch('http://localhost:3001/api/config')
      .then(res => res.json())
      .then(data => setConfig(data))
      .catch(err => console.error("Failed to load config", err));
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [traces]);

  const handleSubmit = async (text) => {
    if (!text.trim() || isProcessing) return;
    
    setInput('');
    setIsProcessing(true);
    
    const traceId = Date.now().toString();
    const newTrace = {
      id: traceId,
      message: text.trim(),
      timestamp: Date.now(),
      status: 'analyzing',
    };
    
    setTraces(prev => [...prev, newTrace]);

    try {
      const response = await fetch('http://localhost:3001/api/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text.trim() })
      });

      if (!response.ok) throw new Error("Network response was not ok");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            
            setTraces(prev => prev.map(t => {
              if (t.id === traceId) {
                return { ...t, ...data }; // Merge incoming stream data (status, tool, reason, result, etc.)
              }
              return t;
            }));
          }
        }
      }
    } catch (error) {
      setTraces(prev => prev.map(t => 
        t.id === traceId ? { ...t, status: 'error', error: error.message || "Failed to connect to router" } : t
      ));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(input);
    }
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-300 font-sans overflow-hidden">
      
      {/* Sidebar (Config) */}
      <div className={cn(
        "fixed md:relative z-20 h-full bg-zinc-900 border-r border-zinc-800 transition-all duration-300 flex flex-col",
        sidebarOpen ? "w-64 translate-x-0" : "w-64 -translate-x-full md:w-0 md:translate-x-0 md:border-none md:overflow-hidden"
      )}>
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
          <span className="font-medium text-sm text-zinc-100 flex items-center gap-2">
            <Settings className="w-4 h-4" /> Integrations
          </span>
          <button className="md:hidden text-zinc-500 hover:text-zinc-300" onClick={() => setSidebarOpen(false)}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 space-y-6 overflow-y-auto">
          {/* Config Items */}
          {[
            { id: 'web_search', title: 'Tavily Search API' },
            { id: 'calculator', title: 'Local Calculator' },
            { id: 'send_slack', title: 'Slack Webhook' }
          ].map(tool => {
            const key = tool.id.replace('web_', '').replace('send_', '');
            const isConfigured = config[key]?.configured;
            const meta = TOOL_CONFIG[tool.id];
            const Icon = meta.icon;
            
            return (
              <div key={tool.id}>
                <div className="flex items-center gap-2 mb-2 text-sm font-medium text-zinc-200">
                  <Icon className={cn("w-4 h-4", meta.color)} /> {tool.title}
                </div>
                <div className="text-xs bg-zinc-950 p-2 rounded border border-zinc-800 flex justify-between items-center">
                  <span className="text-zinc-500">Status</span>
                  <div className="flex items-center gap-1.5">
                    <div className={cn("w-2 h-2 rounded-full", isConfigured ? "bg-emerald-500" : "bg-zinc-600")} />
                    <span className={isConfigured ? "text-emerald-400" : "text-zinc-500"}>
                      {isConfigured ? "Connected" : "Missing"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex-1 flex flex-col min-w-0 bg-zinc-950 relative">
        
        {/* Header */}
        <header className="h-14 border-b border-zinc-800/80 bg-zinc-900/50 backdrop-blur flex items-center justify-between px-4 sm:px-6 shrink-0 z-10">
          <div className="flex items-center gap-3">
            <button className="md:hidden text-zinc-400 hover:text-zinc-100" onClick={() => setSidebarOpen(true)}>
              <Settings className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-zinc-100" />
              <h1 className="font-semibold text-zinc-100 tracking-tight">Agent Router</h1>
            </div>
          </div>
          
          {/* Status Row */}
          <div className="hidden sm:flex items-center gap-3">
            {Object.entries(TOOL_CONFIG).map(([id, meta]) => {
              const key = id.replace('web_', '').replace('send_', '');
              const isConfigured = config[key]?.configured;
              return (
                <div key={id} className={cn("flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border", meta.bg, meta.color, meta.border)}>
                  <meta.icon className="w-3 h-3" />
                  {meta.label}
                  <div className={cn("w-1.5 h-1.5 rounded-full ml-1", isConfigured ? "bg-current" : "bg-current opacity-30")} />
                </div>
              );
            })}
          </div>
        </header>

        {/* Log View (Traces) */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {traces.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
              <Terminal className="w-12 h-12 text-zinc-600 mb-4" />
              <p className="text-zinc-400 max-w-sm">Type a request below to see it automatically routed to the right tool.</p>
              <div className="flex gap-4 mt-6 grayscale opacity-50">
                <Search className="w-6 h-6 text-blue-400" />
                <Calculator className="w-6 h-6 text-amber-400" />
                <MessageSquare className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-6 pb-4">
              {traces.map((trace) => (
                <TraceCard key={trace.id} entry={trace} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </main>

        {/* Sticky Input Area */}
        <footer className="p-4 sm:px-6 lg:px-8 border-t border-zinc-800 bg-zinc-950 shrink-0">
          <div className="max-w-4xl mx-auto">
            <div className="relative flex items-center">
              <input
                type="text"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-4 pr-12 py-3 text-sm font-mono text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 transition-all"
                placeholder="Ask something — search the web, do a calculation, or send a Slack message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isProcessing}
              />
              <button 
                className="absolute right-2 p-1.5 rounded-md bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-50 transition-colors"
                onClick={() => handleSubmit(input)}
                disabled={!input.trim() || isProcessing}
              >
                <Terminal className="w-4 h-4" />
              </button>
            </div>
            
            {/* Example Chips */}
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={() => handleSubmit("What's the latest news on AI regulation?")} className="px-3 py-1.5 rounded-md border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-xs text-zinc-400 font-mono transition-colors">
                "What's the latest news on AI regulation?"
              </button>
              <button onClick={() => handleSubmit("What's 18% tip on $64.50?")} className="px-3 py-1.5 rounded-md border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-xs text-zinc-400 font-mono transition-colors">
                "What's 18% tip on $64.50?"
              </button>
              <button onClick={() => handleSubmit("Send 'Deploy complete ✅' to #engineering")} className="px-3 py-1.5 rounded-md border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-xs text-zinc-400 font-mono transition-colors">
                "Send 'Deploy complete ✅' to #engineering"
              </button>
            </div>
          </div>
        </footer>
        
      </div>
    </div>
  );
}
