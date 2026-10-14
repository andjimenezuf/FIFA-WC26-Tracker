import { cn } from "cnfast";
import { Link, useLocation } from "react-router-dom";

const baseClass =
  "rounded-md px-2.5 py-1.5 text-sm font-bold text-white transition-colors";

const linkClass = (active: boolean) =>
  cn(baseClass, active ? "bg-white/20" : "hover:bg-white/15");

/** Cross-page nav shared by every page — lives on the blue header bar. */
export function SiteNav() {
  const { pathname } = useLocation();
  return (
    <nav className="flex items-center gap-0.5">
      <Link
        to="/predictions"
        className={linkClass(pathname.startsWith("/predictions"))}
      >
        Predictions
      </Link>
      <Link
        to="/project-architecture"
        className={linkClass(pathname.startsWith("/project-architecture"))}
      >
        Project Architecture
      </Link>
    </nav>
  );
}
