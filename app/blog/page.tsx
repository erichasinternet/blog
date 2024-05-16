import { BlogPosts } from "app/components/posts";

export const metadata = {
  title: "Eric's Blog",
  description: "This is a collection of my thoughts and ideas.",
};

export default function Page() {
  return (
    <div className="drop-shadow-2xl flex flex-col items-center justify-center max-w-3xl px-8 mx-auto mt-8 sm:mt-0 sm:px-0">
      <div>
        <h1 className="py-4 text-4xl font-extrabold text-black tracking-tight items-center sm:text-1xl md:text-2xl lg:text-5xl md:-mb-4 flex flex-col gap-3  lg:items-start">
          <span className="text-neutral-900 dark:text-neutral-100 tracking-tight before:block before:absolute before:-inset-1 before:bg-yellow-200 relative">
            <span className="relative dark:text-black">Posts:</span>
          </span>
          <span className="mt-8 relative text-xl sm:text-xl md:text-2xl lg:text-3xl">
            <BlogPosts />
          </span>
        </h1>
      </div>
    </div>
  );
}
