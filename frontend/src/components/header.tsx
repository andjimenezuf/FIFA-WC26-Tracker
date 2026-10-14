import { Link } from "react-router-dom";
import { BallIcon, GitHubIcon } from "@/components/icons";
import { NewChatButton } from "@/components/new-chat-button";
import { SiteNav } from "@/components/site-nav";
import { buttonVariants } from "@/components/ui/button";

export function Header() {
  return (
    <header className="shrink-0 bg-wc-blue shadow-sm">
      <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-4 sm:px-6">
        {/* Home is the empty prompt — the new-chat screen. The active chat is
            kept until a new one is sent, so the Chat link can return to it. */}
        <Link
          to="/"
          aria-label="New chat"
          title="New chat"
          className="flex items-center gap-2.5 rounded-md transition-opacity hover:opacity-80"
        >
          <span className="flex size-8 items-center justify-center rounded-[9px] bg-white text-wc-blue shadow-sm">
            <BallIcon style={{ width: "18px", height: "18px" }} />
          </span>
          <span className="text-base mr-2 font-bold tracking-tight text-white">
            WC26<span className="text-white/75"> Tracker</span>
          </span>
        </Link>
        {/* Slanted divider between the wordmark and the nav, à la Vercel. */}
        <span className="mx-2 hidden h-4 w-px rotate-18 bg-white/35 sm:block" />
        <SiteNav />
        <div className="ml-auto flex items-center gap-1.5">
          <NewChatButton />
          {/* External link — a plain anchor is correct here. */}
          <a
            href="https://github.com/andjimenezuf/FIFA-WC26-Tracker"
            target="_blank"
            rel="noreferrer"
            aria-label="Open GitHub repository"
            title="GitHub repository"
            className={buttonVariants({
              variant: "ghost",
              size: "icon",
              className: "text-wc-mint hover:bg-white/15 hover:text-wc-mint",
            })}
          >
            <GitHubIcon style={{ width: "30px", height: "30px" }} />
          </a>
        </div>
      </div>
    </header>
  );
}
