import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State;
  public props: Props;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
    this.props = props;
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }


  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error inside ErrorBoundary:", error, errorInfo);
  }

  private handleReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-[#1a0b2e] via-[#100620] to-[#2d0f1a] text-white flex flex-col items-center justify-center p-4 text-center select-none font-sans">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.15)_0%,transparent_70%)] animate-pulse pointer-events-none" />
          
          <div className="bg-[#1a0b2e]/80 border-2 border-red-500/30 p-6 sm:p-8 rounded-2xl max-w-lg shadow-[0_0_50px_rgba(239,68,68,0.25)] relative backdrop-blur-md z-10 w-full">
            <div className="text-5xl sm:text-6xl mb-4 text-red-500 animate-pulse">⚡⚠️</div>
            <h1 className="text-2xl sm:text-3xl font-black italic uppercase tracking-wider text-yellow-400 mb-2">
              SYSTEM ANOMALY DETECTED
            </h1>
            <p className="text-xs sm:text-sm text-blue-300/80 mb-6 font-mono">
              Arcade core encountered a runtime execution glitch.
            </p>
            
            <div className="bg-black/60 border border-white/10 rounded-xl p-4 mb-6 font-mono text-[10px] sm:text-[11px] text-red-400 text-left overflow-x-auto max-h-48 subtle-scrollbar select-text selection:bg-red-500/30">
              <span className="text-white/40 block border-b border-white/10 pb-1 mb-2">SYSTEM ERROR STACK:</span>
              <p className="whitespace-pre-wrap">{this.state.error?.toString()}</p>
              {this.state.error?.stack && (
                <p className="whitespace-pre-wrap mt-2 text-white/50">{this.state.error.stack.split('\n').slice(0, 3).join('\n')}</p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-5 py-3 bg-blue-600 hover:bg-blue-500 font-bold rounded-lg shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all active:scale-95 uppercase tracking-wider text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                🔄 Reload System
              </button>
              
              <button
                onClick={this.handleReset}
                className="px-5 py-3 bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 font-bold rounded-lg transition-all active:scale-95 uppercase tracking-wider text-xs flex items-center justify-center gap-2 text-red-300 cursor-pointer"
              >
                🗑️ Clear Cache & Reset
              </button>
            </div>
            
            <p className="mt-6 text-[9px] sm:text-[10px] text-white/30 font-mono italic">
              Solstice Arcade Terminal Code: 0xDEADBEEF
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
