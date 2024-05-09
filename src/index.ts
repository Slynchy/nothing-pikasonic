import { Engine } from "whiskerweb";
// import { CreateStarMapState } from "./nothing/CreateStarMapState";
import { NothingLoadState } from "./nothing/NothingLoadState";

async function main() {
  const engine = new Engine();
  await engine.init(
    new NothingLoadState(),
    {
      renderType: "webgpu",
      adjustHeightForBannerAd: false,
      antialias: true,
      autoInitAnalytics: false,
      autoInitFirebase: false,
      autoResize: "auto",
      autoSave: 1000,
      autoStart: false,
      backgroundAlpha: 1,
      backgroundColor: 0xfafafa,
      playerDataKeys: [
        // "testKey1"
      ],
      bootAssets: [
        // {
        //   key: "whiskerweb",
        //   path: "whiskerweb.png",
        //   type: LoaderType.PIXI,
        // },
      ],
      devicePixelRatio: window.devicePixelRatio,
      gamePlatform: "offline",
      getLatestData(e: any[]): any {
        return e[0];
      },
      height: window.innerHeight,
      loadingScreenComponent: undefined,
      logErrors: "none",
      pauseOnFocusLoss: false,
      printFatalErrorsToHTML: false,
      scaleMode: "linear",
      roundPixels: false,
      sharedLoader: false,
      sharedTicker: false,
      showFPSTracker: false,
      width: window.innerWidth,
    },
  );
}

main();
