# Lovecaster

A simple frame based on the starter kit that tries to match farcaster users.

This is a fast and dirty implementation just for fun.

It queries the id counter from the Id Registry on optimism and tries to randomly
find a user based on the FID. As many users do not have a name or an image,
they are diregarded and a new random user is picked. We try this a number of
times and throw an error if we exceed the retry counter.

User data is queried from searchcaster.xyz, sorry for the spam boys.

Matches are stores in vercel kv

## Quickstart

1. Install dependencies `yarn install`

2. Run the dev server `yarn dev`

3. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

4. Edit `app/page.tsx`

5. Visit [http://localhost:3000/debug](http://localhost:3000/debug) to debug your frame.

6. (Optional) To use a real signer (costs warps), copy `.env.sample` to `.env` and fill in the env variables following the comments provided

## Docs, Questions and Help

- [Frames.js Documentation](https://framesjs.org)
- [Awesome frames](https://github.com/davidfurlong/awesome-frames?tab=readme-ov-file)
- Join the [/frames-dev](https://warpcast.com/~/channel/frames-devs) channel on Farcaster to ask questions

## If you get stuck or have feedback, [Message @df please!](https://warpcast.com/df)

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy

```bash
vercel
```

more deployment links coming soon, PRs welcome!
