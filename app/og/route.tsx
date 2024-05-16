import { ImageResponse } from "next/og";

export function GET(request: Request) {
  let url = new URL(request.url);
  let title = url.searchParams.get("title");

  return new ImageResponse(
    (
      <div tw="flex flex-col w-full h-full drop-shadow-2xl bg-[#FFF59D] p-8">
        <h1 tw="flex flex-col text-9xl font-extrabold tracking-tight text-left justify-start ml-16">
          {title}
        </h1>
        <h2 tw="text-3xl font-black justify-end">{url.host}</h2>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
