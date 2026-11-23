import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                    <div className="bg-white p-8 rounded-lg shadow-xl max-w-2xl w-full border border-red-100">
                        <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
                        <div className="bg-red-50 p-4 rounded-md border border-red-100 mb-6">
                            <p className="font-mono text-sm text-red-800 break-words">
                                {this.state.error?.toString()}
                            </p>
                        </div>
                        {this.state.errorInfo && (
                            <details className="mt-4">
                                <summary className="cursor-pointer text-gray-600 font-medium mb-2">Stack Trace</summary>
                                <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto h-64 font-mono text-gray-700">
                                    {this.state.errorInfo.componentStack}
                                </pre>
                            </details>
                        )}
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-6 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
