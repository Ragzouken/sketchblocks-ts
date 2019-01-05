import { Vector3 } from "three";
import { randomInt } from "../tools/utility";

export interface Block
{
    designID: number;
    position: Vector3;
    orientation: number;
};

export default class Stage
{
    public uuid = "invalid";
    public name = "unnamed stage";

    public readonly blocks = new Map<string, Block>();
}

export function makeRandomStage(): Stage
{
    const stage = new Stage();

    for (let z = -4; z < 4; ++z)
    {
        for (let x = -4; x < 4; ++x)
        {
            const block = {
                designID: randomInt(0, 16),
                position: new Vector3(x, randomInt(0, 1), z),
                orientation: 0,
            }

            stage.blocks.set(block.position.x+","+block.position.y+","+block.position.z, block);
        }
    }

    return stage;
}
