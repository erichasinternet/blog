// The social card for a post, rendered to a PNG by src/pages/og/[slug].png.ts.
// Satori reads plain { type, props } trees, and `tw` takes Tailwind classes.
export function ogCard(title: string, host: string) {
  return {
    type: "div",
    props: {
      tw: "flex flex-col w-full h-full bg-[#FFF59D] p-8",
      children: [
        {
          type: "h1",
          props: {
            tw: "flex flex-col text-9xl font-extrabold tracking-tight text-left justify-start ml-16",
            children: title,
          },
        },
        {
          type: "h2",
          props: { tw: "text-3xl font-black justify-end", children: host },
        },
      ],
    },
  };
}
