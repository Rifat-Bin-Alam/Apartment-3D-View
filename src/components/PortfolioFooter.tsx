import { Github, Globe, Linkedin, Mail } from 'lucide-react';

export function PortfolioFooter() {
  return (
    <footer
      id="portfolio-footer"
      className="relative border-t border-purple-500/20 bg-[#080a10] text-zinc-300"
    >
      <div
        aria-hidden="true"
        className="h-px w-full bg-gradient-to-r from-transparent via-purple-500/60 to-blue-500/40"
      />

      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div>
          <h2 className="font-display text-lg font-semibold tracking-tight text-white">
            Rifat Bin Alam
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            © 2026 Rifat Bin Alam. All rights reserved.
          </p>
        </div>

        <nav
          id="contact"
          aria-label="Connect links"
          className="flex flex-wrap items-center gap-5 text-sm"
        >
          <a
            href="https://rifat-bin-alam.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-zinc-300 transition-colors hover:text-purple-300"
          >
            <Globe className="h-4 w-4 text-purple-400" aria-hidden="true" />
            <span>Portfolio</span>
          </a>
          <a
            href="https://github.com/Rifat-Bin-Alam"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-zinc-300 transition-colors hover:text-purple-300"
          >
            <Github className="h-4 w-4 text-purple-400" aria-hidden="true" />
            <span>GitHub</span>
          </a>
          <a
            href="https://www.linkedin.com/in/rifat-bin-alam/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-zinc-300 transition-colors hover:text-blue-300"
          >
            <Linkedin className="h-4 w-4 text-blue-400" aria-hidden="true" />
            <span>LinkedIn</span>
          </a>
          <a
            href="mailto:rifat5566123@gmail.com"
            className="inline-flex items-center gap-2 text-zinc-300 transition-colors hover:text-blue-300"
          >
            <Mail className="h-4 w-4 text-blue-400" aria-hidden="true" />
            <span>Email</span>
          </a>
        </nav>
      </div>
    </footer>
  );
}
