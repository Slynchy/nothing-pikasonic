import {
  AnimatedSprite,
  buttonify,
  Container,
  Easing,
  Engine,
  Filters,
  GameObject,
  Graphics,
  HelperFunctions,
  Helpers,
  IVector2,
  LoaderType,
  Sprite,
  SpriteComponent,
  Spritesheet,
  State,
  Text,
  TextStyle,
  Texture,
} from "whiskerweb";
import { OsuCommon, OsuFile, OsuHitObject } from "./OsuCommon";

export class NothingMainState extends State {
  private _currentXPosFromScale = 0;
  private _notePoolGreen: Array<Sprite> = [];
  private _notePoolWhite: Array<Sprite> = [];
  private _fireworkTrailPool: Array<Graphics> = [];
  private _fireworkEffectPool: Array<AnimatedSprite> = [];
  private vignette: Sprite;
  private greenLight: Sprite;
  private shockwaveFilter: Filters.ShockwaveFilter;
  private loopShockwave: boolean = false;
  private shockwaveSpeed: number = 0.01;

  private _progressContainer: Container;
  private _progressMask: Sprite;
  private _progressFill: Graphics;
  private _progressBg: Sprite;

  private _targetGreenlightScale: IVector2 = {
    x: 0.5,
    y: 0.133,
  };
  private _targetGreenlightBrightness: number = 0.0;

  private _spawnCount = 1;
  private _fireworksMode: "more" | "restricted" | "none" = "none";
  private _cameraSwayValue = 1;
  private _brightnessSpeed = 1;
  private _fireworkTimeThreshold = 300;
  private _backgroundTargetBrightness = 1;
  private _starBrightnessFlickerSpeed = 40;
  private _starBrightnessFlickerVariance = 0.1;
  private _targetStarBrightness = 0;
  private _brightnessVariance = 0.02;
  private _timingPointFunctions: Array<() => void> = [
    () => {
      const dimensions = {
        x: 2560,
        y: 1440,
      };

      console.log("Timing point 1");
      const whiteGraphics = new Graphics()
        .rect(0, 0, dimensions.x, dimensions.y)
        .fill({
          color: 0xfefefe,
        });
      whiteGraphics.position.copyFrom(this.backgroundContainer.position);
      this.sceneContainer.addChild(whiteGraphics);

      const duration = 1500;

      const cachedScale = this.scene.getStage().scale.clone();
      this.scene.getStage().scale.set(3.5);
      // this.sceneContainer.pivot.x =
      //   dimensions.x * (1 / this.sceneContainer.scale.x) * 0.5;
      // this.sceneContainer.pivot.y =
      //   dimensions.y * (1 / this.sceneContainer.scale.y) * 0.5;
      // this.sceneContainer.position.set(
      //   -((dimensions.x * this.sceneContainer.scale.x - dimensions.x) * 0.5),
      //   -((dimensions.y * this.sceneContainer.scale.y - dimensions.y) * 0.5),
      // );

      // this.sceneContainer.rotation = Math.PI / 15;
      // HelperFunctions.TWEENAsPromise(
      //   this.sceneContainer,
      //   "rotation",
      //   0,
      //   Easing.Circular.Out,
      //   duration,
      // );
      HelperFunctions.TWEENVec2AsPromise(
        this.scene.getStage().scale,
        cachedScale,
        Easing.Sinusoidal.Out,
        duration * 2.33,
        (obj, elapsed) => {
          this.scene
            .getStage()
            .position.set(
              2560 * (this.scene.getStage().scale.x - cachedScale.x) * -0.5,
              1440 * (this.scene.getStage().scale.y - cachedScale.y) * -0.5,
            );
          // -(
          //   (dimensions.x * this.scene.getStage().scale.x - dimensions.x) *
          //   0.5
          // ),
          // -(
          //   (dimensions.y * this.scene.getStage().scale.y - dimensions.y) *
          //   0.5
          // ),
          // this.sceneContainer.position.set(0, 0);
          return true;
        },
      ).promise.then(() => {
        this.showProgressMeter();
      });

      HelperFunctions.TWEENAsPromise(
        whiteGraphics,
        "alpha",
        0,
        Easing.Linear.None,
        duration,
      ).promise.then(() => {
        whiteGraphics.removeFromParent();
        whiteGraphics.destroy();
      });

      this._fireworksMode = "restricted";
    },
    () => {
      console.log("Timing point 2");
      HelperFunctions.TWEENAsPromise(
        this,
        "_targetGreenlightBrightness",
        0.9,
        Easing.Linear.None,
        5500,
      );
      // start showing stars in the sky
      HelperFunctions.TWEENAsPromise(
        this.starsBackground,
        "alpha",
        0.1,
        Easing.Linear.None,
        7000,
      );
      HelperFunctions.TWEENAsPromise(
        this,
        "_targetStarBrightness",
        4,
        Easing.Linear.None,
        12000,
      );
    },
    () => {
      this._fireworksMode = "none";
      console.log("Timing point 3");
      // starting to ramp up
      HelperFunctions.TWEENAsPromise(
        this,
        "_cameraSwayValue",
        1.66,
        Easing.Linear.None,
        4000,
      );
    },
    () => {
      console.log("Timing point 3.9");
      // intense mode about to start in 300ms
      const whiteGraphics = new Graphics().rect(0, 0, 2560, 1440).fill({
        color: 0xfefefe,
      });
      whiteGraphics.position.copyFrom(this.backgroundContainer.position);
      this.sceneContainer.addChild(whiteGraphics);
      whiteGraphics.alpha = 0;
      HelperFunctions.TWEENAsPromise(
        whiteGraphics,
        "alpha",
        1,
        Easing.Linear.None,
        200,
      )
        .promise.then(() => {
          if (OsuCommon.HIGH_QUALITY_MODE) {
            this.starsBackground.filters[0].bloomScale = 2;
          }
          this._targetStarBrightness = 8;
          this._backgroundTargetBrightness = 2;
          this._targetGreenlightScale.x = 0.8;
          this._targetGreenlightScale.y = 0.8;
          if (this.shockwaveFilter) this.shockwaveFilter.time = 0.0001;
          this.starsBackground.scale.set(1.045);
          this._targetGreenlightBrightness = 0.9;
          this.leftCharGreen.visible = true;
          this.leftCharGreen.alpha = 0.05;
          this.rightCharGreen.visible = true;
          this.rightCharGreen.alpha = 0.05;
          if (OsuCommon.HIGH_QUALITY_MODE) {
            this.greenLight.filters[0].threshold = 1;
          }
          this.cityForeground_green.visible = true;
          this.cityForeground_green_less.alpha = 0;
          this.cityForeground.alpha = 0;
          this.greenLight.visible = true;
          return HelperFunctions.TWEENAsPromise(
            whiteGraphics,
            "alpha",
            0,
            Easing.Linear.None,
            600,
          ).promise;
        })
        .then(() => {
          whiteGraphics.removeFromParent();
          whiteGraphics.destroy();
        });
    },
    () => {
      console.log("Timing point 4");
      this._spawnCount = 1;
      // intense mode start
      HelperFunctions.TWEENAsPromise(
        this,
        "_backgroundTargetBrightness",
        1.5,
        Easing.Linear.None,
        8000,
      );
      // this._targetStarBrightness = 10;
      this._starBrightnessFlickerVariance = 4;
      this._starBrightnessFlickerSpeed = 1.8;
      HelperFunctions.TWEENAsPromise(
        this,
        "_cameraSwayValue",
        2.22,
        Easing.Linear.None,
        2000,
      );
    },
    () => {
      console.log("Timing point 5");
      // still fast paced, more intense
    },
    () => {
      // cooldown here
      console.log("Timing point 6");
      this.cityForeground.alpha = 1;
      this._spawnCount = 1;
      HelperFunctions.TWEENAsPromise(
        this.cityForeground_green,
        "alpha",
        0,
        Easing.Linear.None,
        10000,
        () => {
          this.leftCharGreen.alpha = this.cityForeground_green.alpha * 0.05;
          this.rightCharGreen.alpha = this.cityForeground_green.alpha * 0.05;
          return true;
        },
      ).promise.then(() => {
        this.leftCharGreen.visible = false;
        this.rightCharGreen.visible = false;
      });
      HelperFunctions.TWEENAsPromise(
        this,
        "_targetGreenlightBrightness",
        0,
        Easing.Linear.None,
        10000,
      );
      HelperFunctions.TWEENAsPromise(
        this,
        "_backgroundTargetBrightness",
        1,
        Easing.Linear.None,
        5000,
      );
      HelperFunctions.TWEENAsPromise(
        this,
        "_cameraSwayValue",
        1,
        Easing.Linear.None,
        2000,
      );
      HelperFunctions.TWEENAsPromise(
        this,
        "_starBrightnessFlickerSpeed",
        40,
        Easing.Linear.None,
        4000,
      );
      HelperFunctions.TWEENAsPromise(
        this,
        "_starBrightnessFlickerVariance",
        0.1,
        Easing.Linear.None,
        4000,
      );
      HelperFunctions.TWEENAsPromise(
        this,
        "_targetStarBrightness",
        4,
        Easing.Linear.None,
        4000,
      );
      if (OsuCommon.HIGH_QUALITY_MODE) {
        HelperFunctions.TWEENAsPromise(
          this.starsBackground.filters[0],
          "bloomScale",
          1,
          Easing.Linear.None,
          5000,
        );
      }
    },
    () => {
      console.log("Timing point 7");
      // starting to pick up again
      this._targetGreenlightScale.x = 0.5;
      this._targetGreenlightScale.y = 0.133;
      if (OsuCommon.HIGH_QUALITY_MODE) {
        this.greenLight.filters[0].threshold = 0.85;
      }
      HelperFunctions.TWEENAsPromise(
        this,
        "_targetGreenlightBrightness",
        0.9,
        Easing.Linear.None,
        5500,
      );
      // HelperFunctions.TWEENAsPromise(
      //   this.cityForeground_green_less,
      //   "alpha",
      //   1,
      //   Easing.Linear.None,
      //   3500,
      // );
    },
    () => {
      console.log("Timing point 8");
    },
    () => {
      console.log("Timing point 8.9");
      // intense time coming up
    },
    () => {
      console.log("Timing point 8");
      // drums starting
      const whiteGraphics = new Graphics().rect(0, 0, 2560, 1440).fill({
        color: 0xfefefe,
      });
      whiteGraphics.position.copyFrom(this.backgroundContainer.position);
      this.sceneContainer.addChild(whiteGraphics);
      whiteGraphics.alpha = 0;
      HelperFunctions.TWEENAsPromise(
        whiteGraphics,
        "alpha",
        1,
        Easing.Linear.None,
        200,
      )
        .promise.then(() => {
          this._backgroundTargetBrightness = 2;
          if (OsuCommon.HIGH_QUALITY_MODE) {
            this.starsBackground.filters[0].bloomScale = 2;
          }
          HelperFunctions.TWEENAsPromise(
            this,
            "_backgroundTargetBrightness",
            1.5,
            Easing.Linear.None,
            8000,
          );
          this._targetStarBrightness = 8;
          if (this.shockwaveFilter) {
            this.loopShockwave = true;
            this.shockwaveSpeed = 0.025;
            this.shockwaveFilter.time = 0.0001;
          }
          this._starBrightnessFlickerVariance = 4;
          this._starBrightnessFlickerSpeed = 1.8;
          this._targetGreenlightScale.x = 0.8;
          this._targetGreenlightScale.y = 0.8;
          this.leftCharGreen.visible = true;
          this.leftCharGreen.alpha = 0.05;
          this.rightCharGreen.visible = true;
          this.rightCharGreen.alpha = 0.05;
          if (OsuCommon.HIGH_QUALITY_MODE) {
            this.greenLight.filters[0].threshold = 1;
          }
          this._targetGreenlightBrightness = 1;
          this.cityForeground_green.visible = true;
          this.cityForeground_green.alpha = 1;
          this.cityForeground_green_less.alpha = 0;
          this.cityForeground.alpha = 0;
          this._fireworksMode = "more";
          HelperFunctions.TWEENAsPromise(
            this,
            "_cameraSwayValue",
            2.22,
            Easing.Linear.None,
            2000,
          );
          return HelperFunctions.TWEENAsPromise(
            whiteGraphics,
            "alpha",
            0,
            Easing.Linear.None,
            600,
          ).promise;
        })
        .then(() => {
          whiteGraphics.removeFromParent();
          whiteGraphics.destroy();
        });
    },
    () => {
      console.log("Timing point 8.9");
      // intense time coming up
    },
    () => {
      console.log("Timing point 9");
      // intense
    },
    () => {
      console.log("Timing point 10");
      this._fireworksMode = "none";
      this.cityForeground.alpha = 1;
      if (OsuCommon.HIGH_QUALITY_MODE) {
        HelperFunctions.TWEENAsPromise(
          this.starsBackground.filters[0],
          "bloomScale",
          1,
          Easing.Linear.None,
          5000,
        );
      }
      this.loopShockwave = false;
      // cooldown
      HelperFunctions.TWEENAsPromise(
        this,
        "_backgroundTargetBrightness",
        1,
        Easing.Linear.None,
        5000,
      );
      HelperFunctions.TWEENAsPromise(
        this,
        "_cameraSwayValue",
        0.5,
        Easing.Linear.None,
        2000,
      );
      HelperFunctions.TWEENAsPromise(
        this,
        "_starBrightnessFlickerSpeed",
        40,
        Easing.Linear.None,
        4000,
      );
      HelperFunctions.TWEENAsPromise(
        this,
        "_starBrightnessFlickerVariance",
        0.1,
        Easing.Linear.None,
        4000,
      );
      HelperFunctions.TWEENAsPromise(
        this,
        "_targetStarBrightness",
        1,
        Easing.Linear.None,
        4000,
      );
      HelperFunctions.TWEENAsPromise(
        this.starsBackground,
        "alpha",
        0,
        Easing.Linear.None,
        12000,
      );
      HelperFunctions.TWEENAsPromise(
        this.cityForeground_green,
        "alpha",
        0,
        Easing.Linear.None,
        11000,
        () => {
          this.leftCharGreen.alpha = this.cityForeground_green.alpha * 0.05;
          this.rightCharGreen.alpha = this.cityForeground_green.alpha * 0.05;
          return true;
        },
      ).promise.then(() => {
        this.leftCharGreen.visible = false;
        this.rightCharGreen.visible = false;
      });
      HelperFunctions.TWEENAsPromise(
        this,
        "_targetGreenlightBrightness",
        0,
        Easing.Linear.None,
        11000,
      );
    },
    () => {
      console.log("Timing point 11, end");
      // end
      const blackGraphics = new Graphics().rect(0, 0, 2560, 1440).fill({
        color: 0x070707,
      });
      blackGraphics.position.copyFrom(this.backgroundContainer.position);
      this.sceneContainer.addChild(blackGraphics);
      blackGraphics.alpha = 0;
      HelperFunctions.TWEENAsPromise(
        blackGraphics,
        "alpha",
        1,
        Easing.Linear.None,
        3000,
      )
        .promise.then(() => HelperFunctions.wait(1000))
        .then(() => {
          ENGINE.getTicker().stop();
          window.location.assign("./assets/credits.html");
        });
    },
  ];

  public sceneContainer: Container;
  public meteorContainer: Container;
  public backgroundContainer: GameObject;
  public foregroundContainer: GameObject;

  public skyBackground: GameObject;
  public skyBackgroundComponent: SpriteComponent;
  public starsBackground: GameObject;
  public starsBackgroundComponent: SpriteComponent;
  public cityForeground: GameObject;
  public cityForegroundComponent: SpriteComponent;
  public cityForeground_green: GameObject;
  public cityForegroundComponent_green: SpriteComponent;
  public cityForeground_green_less: GameObject;
  public cityForegroundComponent_green_less: SpriteComponent;
  public footer: GameObject;
  public footerComponent: SpriteComponent;
  public leftChar: GameObject;
  public leftCharComponent: SpriteComponent;
  public leftCharGreen: GameObject;
  public leftCharGreenComponent: SpriteComponent;
  public leftCharPink: GameObject;
  public leftCharPinkComponent: SpriteComponent;
  public leftCharYellow: GameObject;
  public leftCharYellowComponent: SpriteComponent;
  public rightChar: GameObject;
  public rightCharComponent: SpriteComponent;
  public rightCharGreen: GameObject;
  public rightCharGreenComponent: SpriteComponent;
  public rightCharPink: GameObject;
  public rightCharPinkComponent: SpriteComponent;
  public rightCharYellow: GameObject;
  public rightCharYellowComponent: SpriteComponent;

  public onAwake(_engine: Engine, _params?: unknown): void {
    this.sceneContainer = new Container();
    console.log(this.scene);
    this.scene.addObject(this.sceneContainer);

    // const temp = this.activeTrack.HitObjects;
    // const cache = {};
    // temp.forEach((e) => {
    //   if (e.type.isOsuMania == true) {
    //     const travelTime = e["endTime"] - e.time;
    //     if (!cache[travelTime]) {
    //       cache[travelTime] = 1;
    //     } else {
    //       cache[travelTime]++;
    //     }
    //   }
    // });
    // console.log(cache);

    let advBloomFilter: Filters.AdvancedBloomFilter;
    if (OsuCommon.HIGH_QUALITY_MODE) {
      advBloomFilter = new Filters.AdvancedBloomFilter({
        threshold: 0.33,
        brightness: 1.3,
        bloomScale: 1,
        pixelSize: {
          x: 1 / window.devicePixelRatio,
          y: 1 / window.devicePixelRatio,
        },
      });
    }

    this.backgroundContainer = new GameObject();
    // this.backgroundContainer.filters = [advBloomFilter];
    this.sceneContainer.addChild(this.backgroundContainer);

    this.foregroundContainer = new GameObject();
    this.sceneContainer.addChild(this.foregroundContainer);

    this.skyBackground = new GameObject();
    this.skyBackgroundComponent = new SpriteComponent("skyBackground");
    this.skyBackground.addComponent(this.skyBackgroundComponent);
    this.skyBackgroundComponent.anchor.set(0);
    this.backgroundContainer.addChild(this.skyBackground);

    // const greenLightContainer = new Container();
    this.greenLight = new Sprite(
      ENGINE.getPIXIResource("greenlight") as Texture,
    );
    // this.greenLight.scale.set(0.33);
    if (OsuCommon.HIGH_QUALITY_MODE) {
      this.greenLight.filters = [
        new Filters.AdvancedBloomFilter({
          threshold: 0.85,
          brightness: 1,
          blur: 1,
          bloomScale: 1,
          pixelSize: {
            x: 1 / window.devicePixelRatio,
            y: 1 / window.devicePixelRatio,
          },
        }),
      ];
    }
    this.greenLight.visible = true;
    this.greenLight.anchor.set(0.5, 1);
    this.greenLight.alpha = 1;
    let counter = 0;
    setInterval(() => {
      counter += 0.0033;
      // this.greenLight.filters[0].threshold = 1;
      // this.greenLight.scale.set(1, 1 + Math.sin(counter) * 0.003);
      this.greenLight.scale.set(
        this._targetGreenlightScale.x,
        this._targetGreenlightScale.y + Math.sin(counter) * 0.003,
      );
      this.greenLight.alpha =
        this._targetGreenlightBrightness + Math.sin(counter) * 0.05;
      if (OsuCommon.HIGH_QUALITY_MODE) {
        this.greenLight.filters[0].brightness =
          this._targetGreenlightBrightness + Math.sin(counter) * 0.05;
      }
      this.cityForeground_green_less.alpha = this.greenLight.alpha;
    });
    this.skyBackground.addChild(this.greenLight);

    this.starsBackground = new GameObject();
    this.starsBackgroundComponent = new SpriteComponent("stars");
    this.starsBackground.addComponent(this.starsBackgroundComponent);
    this.starsBackgroundComponent.anchor.set(0.5);
    if (OsuCommon.HIGH_QUALITY_MODE) {
      this.starsBackground.filters = [
        new Filters.AdvancedBloomFilter({
          threshold: 1,
          brightness: this._targetStarBrightness,
          blur: 8,
          bloomScale: 4,
          pixelSize: {
            x: 1 / window.devicePixelRatio,
            y: 1 / window.devicePixelRatio,
          },
        }),
      ];
    } else {
      this.starsBackground.filters = [];
    }
    // 'inherit' | 'normal' | 'add' | 'multiply' | 'screen' | 'darken' | 'lighten' |
    // 'erase' | 'color-dodge' | 'color-burn' | 'linear-burn' | 'linear-dodge' | 'linear-light' |
    // 'hard-light' | 'soft-light' | 'pin-light' | 'difference' | 'exclusion' |
    // 'overlay' | 'saturation' | 'color' | 'luminosity' | 'normal-npm' | 'add-npm' |
    // 'screen-npm' | 'none' | 'subtract' | 'divide' | 'vivid-light' | 'hard-mix' | 'negation'
    this.starsBackgroundComponent.blendMode = "add";
    this.starsBackground.alpha = 0.0;
    this.backgroundContainer.addChild(this.starsBackground);

    const starsMask = new Graphics().rect(0, 0, 2560, 1440).fill(0xff0000);
    this.starsBackground.mask = starsMask;
    this.backgroundContainer.addChild(starsMask);

    // const starBlocker = new Graphics().rect(0, 0, 3000, 720).fill(0x070707);
    // starBlocker.position.set(0, 800);
    // this.backgroundContainer.addChild(starBlocker);

    this.cityForeground = new GameObject();
    this.cityForegroundComponent = new SpriteComponent("cityForeground");
    this.cityForeground.addComponent(this.cityForegroundComponent);
    this.cityForegroundComponent.anchor.set(0);
    if (OsuCommon.HIGH_QUALITY_MODE) {
      this.cityForeground.filters = [advBloomFilter];
    }
    this.backgroundContainer.addChild(this.cityForeground);

    this.cityForeground_green_less = new GameObject();
    this.cityForegroundComponent_green_less = new SpriteComponent(
      "foreground_g_less",
    );
    this.cityForeground_green_less.addComponent(
      this.cityForegroundComponent_green_less,
    );
    this.cityForeground_green_less.visible = true;
    this.cityForeground_green_less.alpha = 0;
    this.cityForegroundComponent_green_less.anchor.set(0);
    if (OsuCommon.HIGH_QUALITY_MODE) {
      this.cityForeground_green_less.filters = [advBloomFilter];
    }
    this.backgroundContainer.addChild(this.cityForeground_green_less);

    this.cityForeground_green = new GameObject();
    this.cityForegroundComponent_green = new SpriteComponent("foreground_g");
    this.cityForeground_green.addComponent(this.cityForegroundComponent_green);
    // this.cityForeground_green.alpha = 1;
    this.cityForeground_green.visible = false;
    this.cityForegroundComponent_green.anchor.set(0);
    if (OsuCommon.HIGH_QUALITY_MODE) {
      this.cityForeground_green.filters = [advBloomFilter];
    }
    this.backgroundContainer.addChild(this.cityForeground_green);

    this.meteorContainer = new Container();
    // if (!OsuCommon.LITE_MOE) {
    this.meteorContainer.filters = [
      new Filters.AdvancedBloomFilter({
        threshold: 0.4,
        bloomScale: 4,
        blur: 5,
        brightness: 1,
        pixelSize: {
          x: 1 / window.devicePixelRatio,
          y: 1 / window.devicePixelRatio,
        },
      }),
      // new Filters.MotionBlurFilter({
      //   kernelSize: 5,
      //   velocity: [0, 1],
      //   offset: 0,
      // }),
    ];
    // }
    this.backgroundContainer.addChild(this.meteorContainer);

    this.footer = new GameObject();
    this.footerComponent = new SpriteComponent("footer");
    this.footer.addComponent(this.footerComponent);
    this.footerComponent.anchor.set(0);
    this.foregroundContainer.addChild(this.footer);

    this.leftChar = new GameObject();
    this.leftCharComponent = new SpriteComponent("left");
    this.leftChar.addComponent(this.leftCharComponent);
    this.leftCharComponent.anchor.set(0);
    this.foregroundContainer.addChild(this.leftChar);

    this.leftCharGreen = new GameObject();
    this.leftCharGreen.blendMode = "add";
    this.leftCharGreen.alpha = 0.05;
    this.leftCharGreen.visible = false;
    this.leftCharGreenComponent = new SpriteComponent("left_green");
    this.leftCharGreen.addComponent(this.leftCharGreenComponent);
    this.leftCharGreenComponent.anchor.set(0);
    this.foregroundContainer.addChild(this.leftCharGreen);

    this.leftCharPink = new GameObject();
    this.leftCharPink.blendMode = "add";
    this.leftCharPink.alpha = 0; // 0.15;
    this.leftCharPinkComponent = new SpriteComponent("left_pink");
    this.leftCharPink.addComponent(this.leftCharPinkComponent);
    this.leftCharPinkComponent.anchor.set(0);
    this.foregroundContainer.addChild(this.leftCharPink);

    this.leftCharYellow = new GameObject();
    this.leftCharYellow.blendMode = "add";
    this.leftCharYellow.alpha = 0; // 0.15;
    this.leftCharYellowComponent = new SpriteComponent("left_pink");
    this.leftCharYellow.addComponent(this.leftCharYellowComponent);
    this.leftCharYellowComponent.anchor.set(0);
    this.foregroundContainer.addChild(this.leftCharYellow);

    this.rightChar = new GameObject();
    this.rightCharComponent = new SpriteComponent("right");
    this.rightChar.addComponent(this.rightCharComponent);
    this.rightCharComponent.anchor.set(0);
    this.foregroundContainer.addChild(this.rightChar);

    this.rightCharGreen = new GameObject();
    this.rightCharGreen.blendMode = "add";
    this.rightCharGreen.alpha = 0.05;
    this.rightCharGreen.visible = false;
    this.rightCharGreenComponent = new SpriteComponent("right_green");
    this.rightCharGreen.addComponent(this.rightCharGreenComponent);
    this.rightCharGreenComponent.anchor.set(0);
    this.foregroundContainer.addChild(this.rightCharGreen);

    this.rightCharPink = new GameObject();
    this.rightCharPink.blendMode = "add";
    this.rightCharPink.alpha = 0; // 0.15;
    this.rightCharPinkComponent = new SpriteComponent("right_pink");
    this.rightCharPink.addComponent(this.rightCharPinkComponent);
    this.rightCharPinkComponent.anchor.set(0);
    this.foregroundContainer.addChild(this.rightCharPink);

    this.rightCharYellow = new GameObject();
    this.rightCharYellow.blendMode = "add";
    this.rightCharYellow.alpha = 0; // 0.15;
    this.rightCharYellowComponent = new SpriteComponent("right_yellow");
    this.rightCharYellow.addComponent(this.rightCharYellowComponent);
    this.rightCharYellowComponent.anchor.set(0);
    this.foregroundContainer.addChild(this.rightCharYellow);

    this.vignette = new Sprite(ENGINE.getPIXIResource("vignette") as Texture);
    this.vignette.anchor.set(0.5, 1);
    this.vignette.alpha = 0.4;
    this.foregroundContainer.addChild(this.vignette);

    this.createProgressMeter();
    this._progressContainer.visible = false;
    this.foregroundContainer.addChild(this._progressContainer);

    this.onResize(_engine);

    // if (OsuCommon.HIGH_QUALITY_MODE) {
    // this.shockwaveFilter = new Filters.ShockwaveFilter({
    //   center: {
    //     x: window.innerWidth * 0.51,
    //     y: window.innerHeight - 658,
    //   },
    //   speed: 750,
    //   amplitude: 30,
    //   wavelength: 160,
    //   brightness: 1,
    //   radius: -1,
    //   time: 0,
    // });
    // @ts-ignore
    // this.starsBackgroundComponent.getSpriteObj().filters = [
    //   this.shockwaveFilter,
    // ];
    // }

    requestAnimationFrame(() => {
      OsuCommon.initializeAudioCTX(OsuCommon.audioBuffer);
      OsuCommon.setTimingPointData(OsuCommon.activeTrack.TimingPoints[0]);
      if (this._timingPointFunctions[0]) {
        this._timingPointFunctions[0]();
      }
      if (
        this._timingPointFunctions.length !==
        OsuCommon.activeTrack["TimingPoints"].length
      ) {
        console.warn(
          "Timing point functions length mismatch %i vs %i",
          this._timingPointFunctions.length,
          OsuCommon.activeTrack["TimingPoints"].length,
        );
      }
      OsuCommon.createScheduler();
      const startTime = 0;
      this.scheduleHitObjectSpawns(startTime).then(() => {
        console.log("Hitobjects scheduled");
        return this.scheduleTimingPoints(startTime).then(() => {
          console.log("Tpoints scheduled");
          return this.scheduleSampleEvents(startTime).then(() => {
            console.log("Samples scheduled");
            OsuCommon.playTrack(1, startTime);
          });
        });
      });
    });
  }

  private createProgressMeter(): void {
    this._progressContainer = new Container();
    this._progressContainer.scale.set(0.5);
    this._progressContainer.filters = [
      new Filters.AdvancedBloomFilter({
        threshold: 0.4,
        bloomScale: 3,
        blur: 3,
        brightness: 0.6,
        pixelSize: {
          x: 1 / window.devicePixelRatio,
          y: 1 / window.devicePixelRatio,
        },
      }),
    ];

    this._progressBg = new Sprite(
      ENGINE.getPIXIResource("whiskerweb_icon") as Texture,
    );
    this._progressBg.scale.set(2);
    this._progressBg.anchor.set(0.5);
    this._progressContainer.addChild(this._progressBg);

    this._progressMask = new Sprite(
      ENGINE.getPIXIResource("whiskerweb_mask") as Texture,
    );
    this._progressMask.scale.set(2);
    this._progressMask.anchor.set(0.5);
    this._progressContainer.addChild(this._progressMask);

    this._progressFill = new Graphics();
    this._progressFill.alpha = 0.7;
    this._progressFill.mask = this._progressMask;
    this._progressContainer.addChild(this._progressFill);
  }

  async scheduleTimingPoints(startTime?: number) {
    for (let i = 1; i < OsuCommon.activeTrack["TimingPoints"].length; i++) {
      let current = OsuCommon.activeTrack["TimingPoints"][i];
      const _i = i;
      let data = Object.assign({}, current);
      // data.context = context;

      OsuCommon._trackClock.insert(
        current.offset * 0.001 - (startTime || 0),
        (e) => {
          if (this._timingPointFunctions[_i]) {
            this._timingPointFunctions[_i]();
          }
          this._setTimingPointData(e);
        },
        data,
      );
    }
  }

  async scheduleSampleEvents(startTime) {
    // not used yet
  }

  _setTimingPointData(data) {
    OsuCommon.setTimingPointData(data.args);
  }

  async scheduleHitObjectSpawns(startTime?: number) {
    OsuCommon._fadein = OsuCommon.calculateFadein(
      OsuCommon.activeTrack["Difficulty"],
    );
    OsuCommon._preempt = OsuCommon.calculatePreempt(
      OsuCommon.activeTrack["Difficulty"],
    );
    for (let k = 0; k < OsuCommon.activeTrack.HitObjects.length; k++) {
      let current = OsuCommon.activeTrack.HitObjects[k];

      let timestamp = current.time * 0.001 - (startTime || 0);
      if (timestamp < 0) continue;
      OsuCommon._trackClock.insert(timestamp, () => {
        let diff = Math.abs(timestamp - OsuCommon.__AUDIOCTX.currentTime);
        if (diff >= 33) {
          console.warn("Out of timing by %ims", diff * 1000);
        }
        if (diff >= 333) {
          console.warn(
            "Not spawning object because timing exceeds hard threshold",
          );
          return;
        }

        // hack for big firework explosion
        // current["endTime"] -= startTime || 0;
        if (current.time == 154920) {
          current.time = Math.floor(timestamp * 1000);
          for (let i = 0; i < 20; i++) {
            this.spawnFirework(current, i, 20);
          }
        } else {
          current.time = Math.floor(timestamp * 1000);
          for (let i = 0; i < this._spawnCount; i++) {
            if (
              this._fireworksMode == "restricted" ||
              current.type.type == "circle" ||
              this._fireworkTimeThreshold === -1 ||
              current["endTime"] - current.time < this._fireworkTimeThreshold
            ) {
              this.spawnNote(current);
              if (this._fireworksMode == "more") {
                this.spawnFirework(current);
              }
            } else {
              this.spawnFirework(current);
            }
          }
        }
      });
    }
  }

  public showProgressMeter(): void {
    this._progressContainer.visible = true;
    this._progressContainer.alpha = 0;
    this._progressFill.clear();
    HelperFunctions.TWEENAsPromise(
      this._progressContainer,
      "alpha",
      1,
      Easing.Linear.None,
      1000,
    );
    this._progressContainer.position.set(
      this._progressContainer.position.x,
      1440,
    );
    HelperFunctions.TWEENVec2AsPromise(
      this._progressContainer.position,
      {
        x: this._progressContainer.position.x,
        y: 1440 - 156,
      },
      Easing.Circular.Out,
      1000,
    );
  }

  private createFireworkTrail(): Graphics {
    const firework = new Graphics()
      .circle(0, 0, 9)
      .fill({
        color: 0xfa2121,
        alpha: 0.2,
      })
      .rect(-2, -2, 4, 8)
      .fill({
        color: 0xfa2121,
      });
    firework.alpha = 1;
    firework.blendMode = "add";
    return firework;
  }

  private createFireworkEffect(): AnimatedSprite {
    const randId = Math.ceil(Math.random() * 3);
    const animatedSprite = new AnimatedSprite(
      (ENGINE.getPIXIResource("firework" + randId) as Spritesheet).animations[
        "vnbv"
      ],
    );
    animatedSprite["__HACK"] = randId;
    animatedSprite.anchor.set(0.5);
    animatedSprite.loop = false;
    animatedSprite.animationSpeed = 0.75;
    animatedSprite.onComplete = () => {
      animatedSprite.visible = false;
      animatedSprite.removeFromParent();
    };
    animatedSprite.alpha = 0;
    return animatedSprite;
  }

  public spawnFirework(
    data: OsuHitObject,
    isMega?: number,
    megaMax?: number,
  ): void {
    // spawn instantly
    // travel time is data["endTime"] - data.time
    const travelTime = (data["endTime"] || data.time + 333) - data.time;
    // console.log(travelTime);
    // console.log(data["endTime"]);
    if (isMega === undefined) {
      // @ts-ignore
      isMega = false;
    } else {
      isMega += 1;
    }

    const fireworkContainer = new Container();

    const randomValue = Math.random();

    let animatedSprite = this._fireworkEffectPool.find(
      (e) => e.visible == false,
    );
    if (!animatedSprite) {
      animatedSprite = this.createFireworkEffect();
      this._fireworkEffectPool.push(animatedSprite);
    }
    if (animatedSprite.parent) animatedSprite.removeFromParent();
    fireworkContainer.addChild(animatedSprite);
    animatedSprite.visible = true;
    animatedSprite.alpha = 0;

    let firework = this._fireworkTrailPool.find((e) => e.visible == false);
    if (!firework) {
      firework = this.createFireworkTrail();
      this._fireworkTrailPool.push(firework);
    }
    if (firework.parent) firework.removeFromParent();
    fireworkContainer.addChild(firework);
    firework.visible = true;
    this.backgroundContainer.addChild(fireworkContainer);

    const upperXBound = 2560 + this._currentXPosFromScale;
    const lowerXBound = (0 + this._currentXPosFromScale * -1) * 0.5;

    if (isMega) {
      fireworkContainer.position.set(
        (upperXBound / megaMax) * isMega +
          (Math.random() - 0.5) * 50 +
          lowerXBound,
        1440 * (0.8 + Math.random() * 0.2),
      );
    } else {
      fireworkContainer.position.set(
        upperXBound * 0.15 + Math.random() * (upperXBound * 0.7) + lowerXBound,
        1440 * (0.9 + Math.random() * 0.1),
      );
    }
    const startHeight = fireworkContainer.position.y;
    const dist = 255 + 1440 * 0.25 * randomValue;

    // hack to stop fireworks appearing behind the people
    if (
      fireworkContainer.position.x > 1178 &&
      fireworkContainer.position.x < 1178 + 420 &&
      fireworkContainer.position.y - dist < 1440 * 0.33
    ) {
      fireworkContainer.position.x =
        fireworkContainer.position.x + 420 * (Math.random() < 0.5 ? -1 : 1);
    }

    // let id = null;
    // AudioSingleton.playSound("firework_trail").then((_id) => (id = _id));
    HelperFunctions.TWEENVec2AsPromise(
      fireworkContainer.position,
      {
        x: fireworkContainer.position.x,
        y: fireworkContainer.position.y - dist,
      },
      Easing.Cubic.Out,
      travelTime,
    ).promise.then(() => {
      // if (id) AudioSingleton.stopAllSoundsOfId(id);

      // explosion!
      if (isMega) {
        animatedSprite.scale.set(5.5);
      } else {
        animatedSprite.scale.set(3 + Math.random() * 0.5);
      }
      animatedSprite.alpha = 0.8;
      animatedSprite.currentFrame = 0;
      animatedSprite.play();

      if (animatedSprite["__HACK"] == 1 || animatedSprite["__HACK"] == 3) {
        this.leftCharPink.alpha =
          0.15 * (this.leftChar.alpha * this.leftChar.alpha);
        this.rightCharPink.alpha = 0.15;
      } else if (animatedSprite["__HACK"] == 2) {
        this.leftCharYellow.alpha =
          0.15 * (this.leftChar.alpha * this.leftChar.alpha);
        this.rightCharYellow.alpha = 0.15;
      }
      // AudioSingleton.playSound("firework_expl", {
      //   volume: 0.1,
      // });
      HelperFunctions.waitForTruth(() => animatedSprite.visible == false).then(
        () => {
          fireworkContainer.removeFromParent();
          fireworkContainer.children.forEach((e) => e.removeFromParent());
        },
      );
      firework.visible = false;
      // firework.removeFromParent();
    });
  }

  private createNote(isGreen: boolean): Sprite {
    const graphics = new Sprite(
      ENGINE.getPIXIResource(
        isGreen ? "meteorite_green" : "meteorite_white",
        // data.type.type == "circle"
        //   ?
        // ["meteorite_green", "meteorite_white"][Math.floor(Math.random() * 2)],
        // : "meteorite_red",
      ) as Texture,
    );
    graphics.anchor.set(0.5, 1);
    return graphics;
  }

  public spawnNote(data: OsuHitObject) {
    // console.log("Spawning object %O", data);
    const scale = 2;

    // const graphics = new Graphics()
    //   .lineTo((data.x - 475 * 0.5) * 0.166 * scale, -30 * scale)
    //   .stroke({
    //     color: data.type.type == "circle" ? 0xfafafa : 0xfa2121,
    //     width: data.type.type == "circle" ? 6 : 9,
    //   });
    let isGreen = data.type.type !== "circle";
    const pool = isGreen ? this._notePoolGreen : this._notePoolWhite;
    let graphics = pool.find((e) => e.visible == false);
    if (!graphics) {
      graphics = this.createNote(isGreen);
      pool.push(graphics);
      this.meteorContainer.addChild(graphics);
    }
    graphics.visible = true;

    let duration = 333;
    if (data.type.type == "osu!mania" || data.type.type == "slider") {
      duration = Math.max(500, data["endTime"] - data.time);
    }

    graphics.position.set(2560 * 0.5 + (data.x - 475 * 0.5) * 5, 0);
    const dest = {
      x: 2560 * 0.5 + (data.x - 475 * 0.5),
      y: 1440 * 0.585,
    };
    graphics.rotation =
      Helpers.getAngleBetweenTwoPoints(graphics.position, dest) - Math.PI * 0.5;

    graphics.alpha = 1;
    graphics.scale.set(
      0.1 + Math.random() * 0.15 + (data.type.type == "circle" ? 0 : 0.15),
    );
    const scaleCopy = graphics.scale.clone();
    HelperFunctions.TWEENAsPromise(
      graphics,
      "alpha",
      0,
      Easing.Quartic.In,
      duration * (data.type.type == "circle" ? 1.2 : 1.6),
    ).promise.then(() => {
      graphics.visible = false;
    });
    HelperFunctions.TWEENVec2AsPromise(
      graphics.scale,
      { x: scaleCopy.x * 0.9, y: scaleCopy.y * 0.7 },
      Easing.Cubic.Out,
      duration * (data.type.type == "circle" ? 2 : 2.66),
    );
    HelperFunctions.TWEENVec2AsPromise(
      graphics.position,
      dest,
      Easing.Cubic.Out,
      duration * (data.type.type == "circle" ? 2 : 2.66),
    );
  }

  public onResize(_engine: Engine, _params?: unknown): void {
    if (!this.sceneContainer) return;
    const targetRes = {
      x: 2560,
      y: 1440,
    };
    const currentRes = {
      x: _engine.getRenderManager().width * (1 / window.devicePixelRatio),
      y: _engine.getRenderManager().height * (1 / window.devicePixelRatio),
    };

    // resize "this.scene.getStage()" to crop the scene so that it covers the entire screen
    // while maintaining aspect ratio
    let yScale = 1;
    yScale = currentRes.y / targetRes.y + 0.066;
    let xScale = 1;
    xScale = Math.min(currentRes.x / targetRes.x + 0.066, 1.33);
    const usingX = xScale > yScale;
    let scale = usingX ? xScale : yScale;
    this.sceneContainer.scale.set(scale);

    let xPos = 0;
    let yPos = 0;
    if (currentRes.x < targetRes.x * scale) {
      xPos = (currentRes.x - targetRes.x * this.sceneContainer.scale.x) * 0.5;
    }
    if (currentRes.y < targetRes.y * scale) {
      yPos = (currentRes.y - targetRes.y * this.sceneContainer.scale.y) * 1;
    }
    this._currentXPosFromScale = xPos * (1 / scale);
    this.sceneContainer.position.set(xPos, yPos);

    this.backgroundContainer.position.set(0, 0);
    this.foregroundContainer.position.copyFrom(
      this.backgroundContainer.position,
    );
    this._progressContainer.position.set(
      2560 - 156 + this._currentXPosFromScale,
      this._progressContainer.position.y,
    );
    this.starsBackground.position.set(targetRes.x * 0.5, targetRes.y * 0.5);
    this.greenLight.position.set(targetRes.x * 0.5, targetRes.y * 0.5 + 95);
    this.vignette.position.set(targetRes.x * 0.5, targetRes.y * 1);
  }

  onStep(_engine: Engine) {
    super.onStep(_engine);
    const now = Date.now() * 0.001;

    this._fireworkTrailPool.forEach((e) => {
      if (e.visible) {
        e.scale.set(
          HelperFunctions.lerp(e.scale.x, 1.1, 0.34 * _engine.deltaTime),
        );
        if (e.scale.x >= 1) {
          e.scale.set(0);
        }
        e.alpha = 1 - e.scale.x * 0.22;
      }
    });

    if (this.shockwaveFilter && this.shockwaveFilter.time !== 0) {
      this.shockwaveFilter.enabled = true;
      this.starsBackground.scale.set(
        HelperFunctions.lerp(
          this.starsBackground.scale.x,
          1.0,
          0.01 * _engine.deltaTime,
        ),
      );
      this.shockwaveFilter.time = Math.min(
        2,
        this.shockwaveFilter.time + this.shockwaveSpeed * _engine.deltaTime,
      );
      if (this.shockwaveFilter.time == 2) {
        if (this.loopShockwave) {
          this.shockwaveFilter.time = 0.00001;
          this.starsBackground.scale.set(1.045);
        } else {
          this.shockwaveFilter.time = 0;
        }
      }
    } else if (this.shockwaveFilter) {
      this.shockwaveFilter.enabled = false;
    }

    // if(this.activeTrack) {
    if (OsuCommon._trackClock?.currentTime) {
      // console.log(OsuCommon._trackClock.currentTime * 1000);
      this._progressFill.clear();

      const maxHeight = 512;
      const progress =
        (OsuCommon._trackClock.currentTime * 1000) /
        OsuCommon.activeTrack.HitObjects[
          OsuCommon.activeTrack.HitObjects.length - 1
        ].time;
      const height = maxHeight * progress;

      this._progressFill.rect(-256, -height + 256, 512, height).fill({
        color: "#8ea2ff",
      });
    }
    // }

    if (_engine.getInputManager().isKeyDown("e")) {
      // console.log(Math.floor(OsuCommon._trackClock.currentTime * 1000));
      if (this.shockwaveFilter) {
        // this.loopShockwave = true;
        // this.shockwaveSpeed = 0.025;
        this.shockwaveFilter.centerX = window.innerWidth * 0.51;
        this.shockwaveFilter.centerY =
          window.innerHeight - 590 * this.scene.getStage().scale.y;
        console.log(this.scene.getStage().scale.y);
        console.log(this.backgroundContainer.scale.y);
        console.log(this.cityForeground.scale.y);
        console.log(window.innerHeight);
        this.shockwaveFilter.time = 0.0001;
      }
      // this.showProgressMeter();
      // this.spawnFirework(
      //   OsuCommon.activeTrack.HitObjects.find((e) => e.time == 154920),
      // );
    }

    // if (_engine.getInputManager().isKeyDown("s")) {
    //   AudioSingleton.playSound("firework_expl", {
    //     volume: 0.0,
    //   });
    // }

    const skySwayValues: IVector2 = {
      x: Math.sin(now) * 2 * this._cameraSwayValue,
      y: Math.cos(now) * 1 * this._cameraSwayValue,
    };
    this.skyBackground?.position.set(3 + skySwayValues.x, 3 + skySwayValues.y);
    this.cityForeground?.position.copyFrom(this.skyBackground.position);
    this.cityForeground_green?.position.copyFrom(this.skyBackground.position);
    this.cityForeground_green_less?.position.copyFrom(
      this.skyBackground.position,
    );
    this.vignette?.position.copyFrom(this.skyBackground.position);

    this.footer?.position.set(
      Math.sin(now) * 2.66 * this._cameraSwayValue,
      Math.cos(now) * 1.16 * this._cameraSwayValue,
    );
    this.leftChar?.position.copyFrom(this.footer.position);
    this.rightChar?.position.copyFrom(this.footer.position);
    this.leftCharPink?.position.copyFrom(this.footer.position);
    this.rightCharPink?.position.copyFrom(this.footer.position);
    this.leftCharGreen?.position.copyFrom(this.footer.position);
    this.rightCharGreen?.position.copyFrom(this.footer.position);
    this.leftCharYellow?.position.copyFrom(this.footer.position);
    this.rightCharYellow?.position.copyFrom(this.footer.position);

    if (this.leftChar) {
      this.leftChar.alpha = OsuCommon.__AUDIOCTX
        ? 1 -
          Easing.Exponential.In(
            OsuCommon.__AUDIOCTX?.currentTime /
              (OsuCommon.activeTrack.HitObjects[
                OsuCommon.activeTrack.HitObjects.length - 1
              ].time *
                0.001),
          )
        : 1;
    }

    if (this.leftCharPink) {
      this.leftCharPink.alpha = HelperFunctions.lerp(
        this.leftCharPink.alpha,
        0,
        _engine.deltaTime * 0.1,
      );
    }

    if (this.rightCharPink) {
      this.rightCharPink.alpha = HelperFunctions.lerp(
        this.rightCharPink.alpha,
        0,
        _engine.deltaTime * 0.1,
      );
    }

    if (this.leftCharYellow) {
      this.leftCharYellow.alpha = HelperFunctions.lerp(
        this.leftCharYellow.alpha,
        0,
        _engine.deltaTime * 0.1,
      );
    }

    if (this.rightCharYellow) {
      this.rightCharYellow.alpha = HelperFunctions.lerp(
        this.rightCharYellow.alpha,
        0,
        _engine.deltaTime * 0.1,
      );
    }

    if (this.cityForeground && this.cityForeground.filters?.[0])
      this.cityForeground.filters[0].brightness = Math.max(
        0,
        this._backgroundTargetBrightness +
          Math.sin(now * this._brightnessSpeed) * this._brightnessVariance,
      );

    if (this.starsBackground && this.starsBackground.filters?.[0]) {
      this.starsBackground.rotation += 0.00003;
      this.starsBackground.filters[0].brightness = HelperFunctions.lerp(
        this.starsBackground.filters[0].brightness,
        this._targetStarBrightness +
          Math.sin(now * this._starBrightnessFlickerSpeed) *
            this._starBrightnessFlickerVariance,
        _engine.deltaTime * 0.1,
      );
      this.starsBackground.position.set(
        2560 * 0.5 + skySwayValues.x,
        1440 * 0.5 + skySwayValues.y,
      );
    }

    this.leftChar?.scale.set(1, 1 + Math.sin(now + 0.12) * 0.001);
    this.rightChar?.scale.set(1, 1 + Math.sin(now + 0.12) * 0.001);
    // this.backgroundContainer.filters[0].
  }

  public async preload(_engine: Engine): Promise<void> {}
}
