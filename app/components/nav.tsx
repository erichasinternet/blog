import Link from "next/link";

const navItems = {
  "/": {
    name: "home",
  },
  "/blog": {
    name: "blog",
  },
};

export function Navbar() {
  return (
    <aside className="tracking-tight">
      <div className="lg:sticky lg:top-20">
        <nav
          className="flex flex-row items-center justify-center relative px-0 pb-0 fade md:overflow-auto scroll-pr-6 md:relative"
          id="nav"
        >
          <div className="flex flex-row space-x-0 px-4">
            {Object.entries(navItems).map(([path, { name }]) => {
              return (
                <Link
                  key={path}
                  href={path}
                  className="transition-all font-bold dark:hover:text-neutral-200 flex align-middle relative py-1 px-2 m-1"
                >
                  <span className="hover:before:block hover:before:absolute hover:before:-inset-1 hover:before:bg-yellow-200 relative inline-block">
                    <span className="relative">{name}</span>
                  </span>
                </Link>
              );
            })}
            <a
              className="transition-all hover:text-neutral-800 dark:hover:text-neutral-200 flex align-middle relative py-1 px-2 m-1"
              rel="noopener noreferrer"
              target="_blank"
              href="https://github.com/erichasinternet"
            >
              <span className="hover:before:block hover:before:absolute hover:before:-inset-1 hover:before:bg-yellow-200 relative">
                <span className="relative font-bold">github</span>
              </span>
            </a>
          </div>
        </nav>
      </div>
    </aside>
  );
}
