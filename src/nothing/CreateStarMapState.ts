import { Container, Graphics, Engine, State } from "whiskerweb";

/**
 * This creates a big ol' star texture, and not much else.
 */
export class CreateStarMapState extends State {
  onAwake(_engine: Engine, _params?: unknown): void {
    const container = new Container();
    const bg = new Graphics().rect(0, 0, 3000, 3000).fill(0x000000);
    container.addChild(bg);

    const numOfStars = 25000;
    const starGraphics = new Graphics();
    for (let i = 0; i < numOfStars; i++) {
      starGraphics
        .circle(
          Math.floor(Math.random() * 3000),
          Math.floor(Math.random() * 3000),
          Math.random() * 2,
        )
        .fill(0xffffff);
    }
    container.addChild(starGraphics);

    this.scene.getStage().addChild(container);

    _engine
      .getRenderManager()
      .getRenderer()
      .extract.base64(container)
      .then((value) => {
        console.log(value);
      });

    _engine.getTicker().start();
  }

  onResize(_engine: Engine, _params?: unknown): void {}

  preload(_engine: Engine): Promise<void> {
    return Promise.resolve(undefined);
  }
}
