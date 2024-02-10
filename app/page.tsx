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
  fid?: number
};

type User = {
  fid: number;
  image: string;
  username: string;
  displayName: string;
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
const MAX_USER_RETRY = 5;

const findUserById = async (fid: number): Promise<User |null> => {
    const res = await fetch(`https://searchcaster.xyz/api/profiles?fid=${fid}`);

    if (res.ok) {
      const data = await res.json();
      console.log("fetched data", data);
      const user = data[0];
      if (user.body.avatarUrl && user.body.displayName) {
        return {
          fid: user.body.id,
          image: user.body.avatarUrl,
          username: user.body.username,
          displayName: user.body.displayName,
        };
      }
    }
    return null;

}
const findUser = async (): Promise<User> => {
  const findRandomUser = async (): Promise<User | null> => {
    const id = Math.ceil(Math.random() * MAX_FID);
    return findUserById(id);
  };

  let user: User | null = null;
  let i = 0;
  while (!user || i < MAX_USER_RETRY) {
    user = await findRandomUser();
    i++;
  }

  if (user) {
    return user;
  }

  return {
    fid: 0,
    displayName: "invalid",
    username: "invalid",
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
      if (state.fid) {
        // store and check matches
        if (buttonIndex === 2 && state.fid % 2 === 0) {
          state.phase = "matched";
          // store like
          // find user again
          otherUser = (await findUserById(state.fid!))!;
        } else {
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
        state={{ ...state, fid: otherUser?.fid }}
        previousFrame={previousFrame}
      >
        <FrameImage>
          <div tw="flex w-full h-full bg-slate-700 text-white justify-center items-center">
            <img src={otherUser?.image} tw="object-cover w-96 h-96" />
            <p>
              you like? {otherUser?.displayName} ({otherUser?.fid}) ??
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
            <img src={otherUser?.image} tw="object-cover w-96 h-96" />
            Matched! {otherUser?.fid} !
          </div>
        </FrameImage>
        <FrameButton onClick={dispatch}>meh</FrameButton>
        <FrameButton href={`https://warpcast.com/${otherUser?.username}`}>to Profile</FrameButton>
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
