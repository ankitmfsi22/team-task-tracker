import { Link, Outlet } from 'react-router';
import { APP_NAME } from '@/lib/use-document-meta';

export function Component() {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:ring-3 focus:ring-ring/50"
      >
        Skip to main content
      </a>
      <header className="flex items-center justify-between border-b px-6 py-3">
        <Link to="/" className="font-semibold">
          {APP_NAME}
        </Link>
        <nav aria-label="Main" className="text-sm text-muted-foreground">
          Projects and boards arrive with the next tickets.
        </nav>
      </header>
      <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-4xl flex-1 p-6">
        <Outlet />
      </main>
      <footer className="border-t px-6 py-3 text-sm text-muted-foreground">
        <p>{APP_NAME}</p>
      </footer>
    </div>
  );
}
