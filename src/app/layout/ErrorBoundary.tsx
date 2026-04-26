import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { Ornament } from '@/shared/molecules/Ornament/Ornament';
import { Reveal } from '@/shared/molecules/Reveal/Reveal';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Catches runtime errors in the tree below it and renders a quiet
 * recovery surface rather than a white screen. Stylistically matches
 * NotFound so failure feels like it happened inside the house,
 * not outside it. Copy is bracketed as placeholder per
 * VOICE_AND_COPY.md.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error, info);
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <Reveal>
        <div className="py-16">
          <div className="font-heading text-deck font-light italic text-text-3 leading-relaxed">
            <p>[Something here caught and fell.]</p>
            <p>[The rest of the house is still here.]</p>
          </div>
          <Ornament />
          <Link
            to="/"
            viewTransition={false}
            className="inline-block border-b border-transparent text-list italic text-text-3 no-underline transition-colors duration-200 hover:border-text-3 hover:text-text"
          >
            [Back home →]
          </Link>
        </div>
      </Reveal>
    );
  }
}
