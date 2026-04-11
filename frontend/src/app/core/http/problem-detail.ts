import { HttpErrorResponse } from '@angular/common/http';

interface ProblemDetailLike {
  readonly title?: unknown;
  readonly detail?: unknown;
  readonly message?: unknown;
  readonly code?: unknown;
}

interface ProblemHttpErrorFormatOptions {
  readonly fallbackMessage: string;
  readonly networkFallbackMessage: string;
  readonly codeLabel: string;
}

export function formatProblemHttpError(
  error: unknown,
  options: ProblemHttpErrorFormatOptions,
): string {
  if (!(error instanceof HttpErrorResponse)) {
    return options.fallbackMessage;
  }

  const problem = asProblemDetail(error.error);
  if (problem) {
    const title = asNonBlankString(problem.title);
    const detail = asNonBlankString(problem.detail) ?? asNonBlankString(problem.message);
    const code = asNonBlankString(problem.code);
    const lines = [
      title && title !== detail ? title : null,
      detail ?? title,
      code ? `${options.codeLabel}: ${code}` : null,
    ].filter((line): line is string => !!line);

    if (lines.length > 0) {
      return lines.join('\n');
    }
  }

  if (typeof error.error === 'string' && error.error.trim()) {
    return error.error.trim();
  }

  if (error.status === 0) {
    return options.networkFallbackMessage;
  }

  if (error.status > 0) {
    return `${error.status} ${error.statusText || 'Request failed'}`;
  }

  return options.fallbackMessage;
}

function asProblemDetail(value: unknown): ProblemDetailLike | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as ProblemDetailLike;
}

function asNonBlankString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}
