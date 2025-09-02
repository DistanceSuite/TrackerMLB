import {
  isRouteErrorResponse,
  Links,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import { GithubIcon, TwitterIcon } from "lucide-react";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="bg-gray-100 text-white">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Links />
      </head>
      <body className="font-inter flex flex-col min-h-screen">
        {/* Navbar */}
        <header className="bg-gray-900 shadow-lg fixed top-0 left-0 right-0 z-50 w-screen ">
          <div className="container mx-auto flex items-center justify-between py-4 px-4">
            <a href="/" className="text-2xl font-bold tracking-tight">
              Distance Tracker
            </a>
            <nav className="flex gap-6 text-sm font-medium">
              <a href="/" className="hover:text-green-300 transition text-lg">
                Home
              </a>
              <a href="/visualization" className="hover:text-green-300 transition text-lg">
                Visualize
              </a>
              <a href="https://x.com/distancetracker" className="hover:text-green-300 transition text-lg">
                <TwitterIcon/>
              </a>
              <a href="https://x.com/distancetracker" className="hover:text-green-300 transition text-lg">
                <GithubIcon/>
              </a>
            </nav>
          </div>
        </header>
        <div className="h-16" /> {/* Spacer for fixed navbar */}

        {/* Main content */}
        <main className="flex-1">{children}</main>


        {/* Footer */}
        <footer className="bg-gray-900 text-gray-400 text-center py-6 z-100">
          © {new Date().getFullYear()} Distance Tracker · This project uses Statcast, Baseball Savant, & MLB data but is not affiliated with any of them · Built by{" "}
          <a
            href="https://twitter.com/DistanceTracker"
            target="_blank"
            rel="noopener noreferrer"
            className="text-yellow-400 hover:text-yellow-300"
          >
            @DistanceTracker
          </a>
        </footer>

        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}


export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
