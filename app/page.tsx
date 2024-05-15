export default function Page() {
  return (
    <div className="drop-shadow-2xl flex flex-col items-center justify-center max-w-3xl px-8 mx-auto mt-8 sm:mt-0 sm:px-0">
      <div>
        <h1 className="py-4 text-4xl font-extrabold text-black tracking-tight items-center sm:text-1xl md:text-2xl lg:text-5xl md:-mb-4 flex flex-col gap-3  lg:items-start">
          <span className="relative">Eric Lawson</span>
          <span className="whitespace-nowrap relative ">
            <span className="relative whitespace-nowrap">
              <span className="absolute bg-yellow-200 -left-2 -top-1 -bottom-1 -right-2 md:-left-3 md:-top-0 md:-bottom-0 md:-right-3"></span>
              <span className="relative font-bold text-black">
                @erichasinternet
              </span>
            </span>
          </span>
          <span className="relative text-xl sm:text-xl md:text-2xl lg:text-3xl">
            Software Engineer | Denver, CO
          </span>
        </h1>
      </div>
    </div>
  );
}
