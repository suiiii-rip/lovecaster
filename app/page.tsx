import {
  FrameButton,
  FrameContainer,
  FrameImage,
  FrameInput,
  FrameReducer,
  NextServerPageProps,
  getPreviousFrame,
  useFramesReducer,
  getFrameMessage,
} from "frames.js/next/server";
import Link from "next/link";
import { DEBUG_HUB_OPTIONS } from "./debug/constants";
import { getTokenUrl } from "frames.js";
import Image from "next/image";

type State = {
  phase: "start" | "matching" | "matched";
  user?: User;
};

type User = {
  fid: number;
  image: string;
  name: string;
};

const initialState: State = { phase: "start" };

const reducer: FrameReducer<State> = (state, action) => {
  if (state.phase === "start" || state.phase === "matched") {
    return { ...state, phase: "matching" };
  }
  return {
    ...state,
  };
};

const MAX_FID = 326948;

const findUser = async (): Promise<User> => {
  const findRandomUser = async (): Promise<User | null> => {
    const id = Math.ceil(Math.random() * MAX_FID);

    const res = await fetch(`https://searchcaster.xyz/api/profiles?fid=${id}`);

    if (res.ok) {
      const data = await res.json();
      console.log("fetched data", data);
      const user = data[0];
      if (user.body.avatarUrl && user.body.displayName) {
        return {
          fid: user.body.id,
          image: user.body.avatarUrl,
          name: user.body.displayName,
        };
      }
    }
    return null;
  };

  let user: User | null = null;
  let i = 0;
  while (!user || i < 5) {
    user = await findRandomUser();
    i++;
  }

  if (user) {
    return user;
  }

  return {
    fid: 0,
    name: "invalid",
    image: `https://picsum.photos/id/237/200/400.jpg`,
  };
};

// This is a react server component only
export default async function Home({
  params,
  searchParams,
}: NextServerPageProps) {
  const previousFrame = getPreviousFrame<State>(searchParams);

  const frameMessage = await getFrameMessage(previousFrame.postBody, {
    ...DEBUG_HUB_OPTIONS,
  });

  if (frameMessage && !frameMessage?.isValid) {
    throw new Error("Invalid frame payload");
  }

  const [state, dispatch] = useFramesReducer<State>(
    reducer,
    initialState,
    previousFrame,
  );

  // Here: do a server side side effect either sync or async (using await), such as minting an NFT if you want.
  // example: load the users credentials & check they have an NFT

  console.log("info: state is:", state);

  let otherUser: User | undefined;

  if (frameMessage) {
    const {
      isValid,
      buttonIndex,
      inputText,
      castId,
      requesterFid,
      casterFollowsRequester,
      requesterFollowsCaster,
      likedCast,
      recastedCast,
      requesterVerifiedAddresses,
      requesterUserData,
    } = frameMessage;

    if (state.phase === "matching") {
      if (state.user) {
        // store and check matches
        if (buttonIndex === 2 && state.user.fid % 2 === 0) {
          state.phase = "matched";
          // store like
        } else {
          // store like / dislike
          otherUser = await findUser();
        }
      } else {
        // first matching after start
        // get new fid
        otherUser = await findUser();
      }
    } else if (state.phase === "matched") {
      // user hit the 'continue' button
      // get new fid
      otherUser = await findUser();
    }

    console.log("info: frameMessage is:", frameMessage);
  }

  const baseUrl = process.env.NEXT_PUBLIC_HOST || "http://localhost:3000";

  let frameContainer = null;

  if (state.phase === "start") {
    frameContainer = (
      <FrameContainer
        pathname="/"
        postUrl="/frames"
        state={state}
        previousFrame={previousFrame}
      >
        <FrameImage>
          <div tw="flex w-full h-full bg-slate-700 text-white justify-center items-center">
            <h1>Lovecaster ❤️</h1>
          </div>
        </FrameImage>
        <FrameButton onClick={dispatch}>Start!</FrameButton>
      </FrameContainer>
    );
  } else if (state.phase === "matching") {
    frameContainer = (
      <FrameContainer
        pathname="/"
        postUrl="/frames"
        state={{ ...state, user: otherUser }}
        previousFrame={previousFrame}
      >
        <FrameImage>
          <div tw="flex w-full h-full bg-slate-700 text-white justify-center items-center">
            <img src={otherUser?.image} tw="object-cover w-96 h-96" />
            <p>
              you like? {otherUser?.name} ({otherUser?.fid}) ??
            </p>
          </div>
        </FrameImage>
        <FrameButton onClick={dispatch}>nope</FrameButton>
        <FrameButton onClick={dispatch}>yay</FrameButton>
      </FrameContainer>
    );
  } else if (state.phase === "matched") {
    frameContainer = (
      <FrameContainer
        pathname="/"
        postUrl="/frames"
        state={state}
        previousFrame={previousFrame}
      >
        <FrameImage>
          <div tw="flex w-full h-full bg-slate-700 text-white justify-center items-center">
            Matched! {state.user?.fid} !
          </div>
        </FrameImage>
        <FrameButton onClick={dispatch}>meh</FrameButton>
        <FrameButton href={`https://www.google.com`}>to Profile</FrameButton>
      </FrameContainer>
    );
  }

  // then, when done, return next frame
  return (
    <div className="p-4">
      frames.js starter kit.{" "}
      <Link href={`/debug?url=${baseUrl}`} className="underline">
        Debug
      </Link>
      {frameContainer}
    </div>
  );
}

// <Image src={otherUser!.image} objectFit="cover" layout="fill" alt="bla" width={400} height={400}/>
