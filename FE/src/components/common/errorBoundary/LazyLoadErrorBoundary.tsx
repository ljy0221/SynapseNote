import React from 'react';

interface Props {
    children: React.ReactNode;
    className?: string;
}

interface State {
    hasError: boolean;
}

// Catches React.lazy() chunk-load failures (stale hash after redeploy, flaky network)
// so one block's failed dynamic import can't blank the whole note page.
export class LazyLoadErrorBoundary extends React.Component<Props, State> {
    state: State = { hasError: false };

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error: unknown) {
        console.error('Failed to load lazy component chunk:', error);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className={this.props.className ?? 'code-block-loading'}>
                    <span>블록을 불러오지 못했습니다.</span>
                    <button type="button" onClick={() => window.location.reload()}>
                        새로고침
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}
