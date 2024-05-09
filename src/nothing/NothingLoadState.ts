import {
  buttonify,
  Easing,
  Engine,
  HelperFunctions,
  Helpers,
  LoaderType,
  State,
  FullscreenFunctions,
  Graphics,
  Text,
  Container,
  IVector2,
  Rectangle,
} from "whiskerweb";
import OSUJSON from "./osu-json";
import { OsuCommon, OsuFile } from "./OsuCommon";
import AudioLoader from "audio-loader";
import { NothingMainState } from "./NothingMainState";
import { AudioSingleton } from "whiskerweb/dist/engine/AudioSingleton";

export class NothingLoadState extends State {
  private progress: number = 0;
  private loadingBar: Graphics;
  private title: Text;
  private desc: Text;
  private slider: Container;
  private liteMode: Container;
  private nowLoading: Text;

  private createTickbox(_label: string, ref: any, key: string): Container {
    const container = new Container();
    const bg = new Graphics();
    container.addChild(bg);

    const tickbox = new Text({
      text: (ref[key] ? "✅" : "❌") + ` ${_label}`,
      style: {
        fill: 0xfefefe,
        align: "center",
        fontFamily: "Times New Roman",
        fontSize: 64,
      },
    });
    buttonify(tickbox, {
      onFire: () => {
        ref[key] = !ref[key];
        tickbox.text = (ref[key] ? "✅" : "❌") + ` ${_label}`;
      },
    });
    container.addChild(tickbox);

    bg.rect(-8, -8, tickbox.width + 16, tickbox.height + 16)
      .stroke({
        color: 0xfefefe,
        width: 2,
      })
      .rect(-8, -8, 84 + 16, tickbox.height + 16)
      .stroke({
        color: 0xfefefe,
        width: 2,
      });

    return container;
  }

  private createSlider(
    _label: string,
    ref: any,
    key: string,
    width?: number,
  ): Container {
    const container = new Container();

    const sliderAmount = new Graphics();
    const bg = new Graphics();
    container.addChild(sliderAmount);
    container.addChild(bg);

    const slider = new Text({
      text: `${_label}`,
      style: {
        fill: 0xfefefe,
        align: "center",
        fontFamily: "Times New Roman",
        fontSize: 64,
      },
    });
    slider.position.set(width ? width * 0.5 - slider.width * 0.5 : 0, 0);
    container.addChild(slider);

    bg.rect(-8, -8, width || slider.width + 16, slider.height + 16)
      .stroke({
        color: 0xfefefe,
        width: 2,
      })
      .rect(-8, -8, width || slider.width + 16, slider.height + 16)
      .stroke({
        color: 0xfefefe,
        width: 2,
      });

    sliderAmount
      .rect(0, 0, width || slider.width + 16, slider.height + 16)
      .fill({
        color: 0xccccff,
        alpha: 0.4,
      });
    sliderAmount.position.set(-8, -8);
    sliderAmount.scale.set(ref[key], 1);

    const half = (width || slider.width + 16) * 0.5;
    slider.position.set(slider.position.x + -half, slider.position.y);
    sliderAmount.position.set(
      sliderAmount.position.x + -half,
      sliderAmount.position.y,
    );
    bg.position.set(bg.position.x + -half, bg.position.y);

    let pointerDown: IVector2 = null;
    buttonify(container, {
      onFire: () => {},
      onPointerOut: () => (pointerDown = null),
      onPointerMove: (e) => {
        if (pointerDown) {
          ref[key] = Math.max(
            0,
            Math.min(1, (e.pageX + half - container.x + 8) / container.width),
          );
          sliderAmount.scale.set(ref[key], 1);
        }
      },
      onPointerDown: (e) => {
        ref[key] = Math.max(
          0,
          Math.min(1, (e.pageX + half - container.x + 8) / container.width),
        );
        sliderAmount.scale.set(ref[key], 1);
        pointerDown = {
          x: e.pageX - container.x,
          y: e.pageY,
        };
      },
      onPointerUp: () => {
        pointerDown = null;
        container.scale.set(1.1, 1.1);
        HelperFunctions.TWEENVec2AsPromise(
          container.scale,
          { x: 1, y: 1 },
          Easing.Linear.None,
          100,
        );
        AudioSingleton.playSound("soundtest", { volume: OsuCommon.volume });
      },
    });

    container.hitArea = new Rectangle(
      -8 + -half,
      -8,
      width || slider.width + 16,
      slider.height + 16,
    );

    container.position.set(half, 0);

    return container;
  }

  onAwake(_engine: Engine, _params?: unknown): void {
    _engine.setBackgroundColor(0x070707);
    _engine.getTicker().start();

    const width =
      _engine.getRenderManager().width * (1 / window.devicePixelRatio);
    const height =
      _engine.getRenderManager().height * (1 / window.devicePixelRatio);

    const title = (this.title = new Text({
      text: '"Nothing" - PIKASONIC',
      style: {
        align: "center",
        fill: 0xfefefe,
        fontSize: 64,
        fontWeight: "bold",
        fontFamily: "Times New Roman",
      },
    }));
    title.alpha = 0;
    this.scene.getStage().addChild(title);

    const descText = `This is an audio/visual demo of the WhiskerWeb framework, using beatmaps from the game 'osu!' 
    
It lasts about 3 minutes, and is best viewed in 16:9 aspect ratio.

Please adjust your volume, and enable high quality mode if your device can handle it (not recommended for mobile)`;
    const desc = (this.desc = new Text({
      text: descText,
      style: {
        align: "center",
        wordWrapWidth: 620,
        wordWrap: true,
        fill: 0xfefefe,
        fontSize: 24,
        fontFamily: "Times New Roman",
      },
    }));
    desc.alpha = 0;
    this.scene.getStage().addChild(desc);

    const slider = (this.slider = this.createSlider(
      "Volume",
      OsuCommon,
      "volume",
      440,
    ));
    slider.alpha = 0;
    this.scene.getStage().addChild(slider);

    const liteMode = this.createTickbox(
      "High quality",
      OsuCommon,
      "HIGH_QUALITY_MODE",
    );
    this.liteMode = liteMode;
    liteMode.alpha = 0;
    this.scene.getStage().addChild(liteMode);

    const nowLoading = (this.nowLoading = new Text({
      text: "Now Loading",
      style: {
        fill: 0xfefefe,
        align: "center",
        fontSize: 92,
        fontFamily: "Times New Roman",
      },
    }));
    nowLoading.anchor.set(0.5);
    this.scene.getStage().addChild(nowLoading);
    const loadingBar = (this.loadingBar = new Graphics()
      .rect(0, 0, nowLoading.width * 1.2, 32)
      .fill(0x00ff00));
    loadingBar.scale.set(0, 1);
    this.scene.getStage().addChild(loadingBar);
    this.onResize(_engine);

    this.loadAssets((_prog) => {
      // loadingBar.scale.set(_prog, 1);
      this.progress = _prog;
    }).then(() => {
      HelperFunctions.TWEENAsPromise(
        loadingBar,
        "alpha",
        0,
        Easing.Linear.None,
        1000,
        () => {
          nowLoading.alpha = loadingBar.alpha;
          return true;
        },
      ).promise.then(() => {
        loadingBar.removeFromParent();
        loadingBar.destroy();
        nowLoading.text = "Click me to start";
        // nowLoading.position.set(width * 0.5, liteMode.y + liteMode.height + 64);
        this.onResize(_engine);
        HelperFunctions.TWEENAsPromise(
          title,
          "alpha",
          1,
          Easing.Linear.None,
          1000,
          () => {
            desc.alpha = title.alpha;
            return true;
          },
        ).promise.then(() => {
          HelperFunctions.TWEENAsPromise(
            liteMode,
            "alpha",
            1,
            Easing.Linear.None,
            1000,
            () => {
              slider.alpha = liteMode.alpha;
              return true;
            },
          ).promise.then(() => {
            HelperFunctions.TWEENAsPromise(
              nowLoading,
              "alpha",
              1,
              Easing.Linear.None,
              1000,
            );
          });
        });
        buttonify(nowLoading, {
          onFire: () => {
            if (Helpers.isTouchDevice()) {
              FullscreenFunctions.openFullscreen();
            }
            _engine.changeState(new NothingMainState());
            // nowLoading.removeFromParent();
            // nowLoading.destroy();
          },
        });
      });
    });
  }

  onResize(_engine: Engine, _params?: unknown): void {
    const devPixRat_f = 1 / window.devicePixelRatio;
    const width = window.innerWidth;
    const height = window.innerHeight;
    const startPoint = 0 + this.title.height;
    //
    this.scene.getStage().scale.set(devPixRat_f);
    //
    console.log(devPixRat_f);
    console.log(_engine.getRenderManager().width);
    console.log(window.innerWidth);

    this.title.position.set(width * 0.5 - this.title.width * 0.5, startPoint);

    this.desc.position.set(
      width * 0.5 - this.desc.width * 0.5,
      this.title.position.y + this.title.height + 36,
    );

    this.slider.position.set(
      width * 0.5,
      this.desc.position.y + (this.desc.height + 42),
    );

    this.liteMode.position.set(
      width * 0.5 - this.liteMode.width * 0.5,
      this.slider.position.y + 122,
    );

    if (this.nowLoading.text == "Click me to start") {
      this.nowLoading.position.set(
        width * 0.5,
        height - this.nowLoading.height - 32,
      );
    } else {
      this.nowLoading.position.set(width * 0.5, height * 0.43);
    }

    this.loadingBar?.position?.set(
      width * 0.5 - this.nowLoading.width * 1.2 * 0.5,
      this.nowLoading.position.y + 64,
    );
  }

  async preload(_engine: Engine): Promise<void> {}

  onStep(_engine: Engine): void {
    this.loadingBar?.scale?.set(
      HelperFunctions.lerp(
        this.loadingBar.scale.x,
        this.progress,
        0.33 * _engine.deltaTime,
      ),
      1,
    );
  }

  private async loadAssets(_onProgress?: (p: number) => void): Promise<void> {
    let assets = [
      {
        key: "skyBackground",
        type: LoaderType.PIXI,
        path: "pieces_1440p/sky.png",
      },
      {
        key: "cityForeground",
        type: LoaderType.PIXI,
        path: "pieces_1440p/foreground.png",
      },
      {
        key: "footer",
        type: LoaderType.PIXI,
        path: "pieces_1440p/footer.png",
      },
      {
        key: "left",
        type: LoaderType.PIXI,
        path: "pieces_1440p/left.png",
      },
      {
        key: "right",
        type: LoaderType.PIXI,
        path: "pieces_1440p/right.png",
      },
      {
        key: "stars",
        type: LoaderType.PIXI,
        path: "pieces_1440p/stars.png",
      },
      {
        key: "firework1",
        type: LoaderType.PIXI,
        path: "firework1/firework1-0.json",
      },
      {
        key: "firework2",
        type: LoaderType.PIXI,
        path: "firework1/firework2-0.json",
      },
      {
        key: "firework3",
        type: LoaderType.PIXI,
        path: "firework1/firework3-0.json",
      },
      {
        key: "meteorite_blue",
        type: LoaderType.PIXI,
        path: "pieces/meteorite_blue.png",
      },
      {
        key: "meteorite_white",
        type: LoaderType.PIXI,
        path: "pieces/meteorite_white.png",
      },
      {
        key: "meteorite_green",
        type: LoaderType.PIXI,
        path: "pieces/meteorite_green.png",
      },
      {
        key: "meteorite_red",
        type: LoaderType.PIXI,
        path: "pieces/meteorite_red.png",
      },
      {
        key: "vignette",
        type: LoaderType.PIXI,
        path: "pieces_1440p/vignette.png",
      },
      {
        key: "greenlight",
        type: LoaderType.PIXI,
        path: "pieces/greenlight.png",
      },
      {
        key: "foreground_g",
        type: LoaderType.PIXI,
        path: "pieces_1440p/foreground_green.png",
      },
      {
        key: "foreground_g_less",
        type: LoaderType.PIXI,
        path: "pieces_1440p/foreground_green_less.png",
      },
      {
        key: "whiskerweb_icon",
        type: LoaderType.PIXI,
        path: "whiskerweb_icon.png",
      },
      {
        key: "whiskerweb_mask",
        type: LoaderType.PIXI,
        path: "whiskerweb_mask.png",
      },
      {
        key: "left_red",
        type: LoaderType.PIXI,
        path: "pieces_1440p/left_red.png",
      },
      {
        key: "right_red",
        type: LoaderType.PIXI,
        path: "pieces_1440p/right_red.png",
      },
      {
        key: "left_pink",
        type: LoaderType.PIXI,
        path: "pieces_1440p/left_pink.png",
      },
      {
        key: "right_pink",
        type: LoaderType.PIXI,
        path: "pieces_1440p/right_pink.png",
      },
      {
        key: "left_yellow",
        type: LoaderType.PIXI,
        path: "pieces_1440p/left_yellow.png",
      },
      {
        key: "right_yellow",
        type: LoaderType.PIXI,
        path: "pieces_1440p/right_yellow.png",
      },
      {
        key: "left_green",
        type: LoaderType.PIXI,
        path: "pieces_1440p/left_green.png",
      },
      {
        key: "right_green",
        type: LoaderType.PIXI,
        path: "pieces_1440p/right_green.png",
      },
    ];

    assets = assets.filter((e) => !ENGINE.hasPIXIResource(e.key));

    let progress = 0;
    await ENGINE.loadAssets(assets, (_prog) => {
      console.log("Progress %o", (progress = (_prog / 100) * 0.8));
      _onProgress?.(progress);
      // loadingBar.scale.set(_prog / 100, loadingBar.scale.y);
    });

    const osuSrc = await fetch("./assets/PIKASONIC-Nothing.osu");
    await osuSrc
      .text()
      .then((osuText) => {
        return OSUJSON.ParseOSUFileAsync(osuText);
      })
      .then((f: OsuFile) => {
        console.log(f);
        OsuCommon.activeTrack = f;
        console.log("Progress %o", (progress = 0.9));
        _onProgress?.(progress);
      })
      .then(() => {
        // AudioSingleton.stopAllSounds();
      });

    OsuCommon.audioBuffer = await AudioLoader("./assets/audio/audio.mp3");
    console.log("Progress %o", (progress = 1));
    _onProgress?.(progress);
  }
}
