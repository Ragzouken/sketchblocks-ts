import Stage, { Block } from "../data/Stage";
import SketchblocksEditor from "./SketchblocksEditor";
import ModelViewMapping, { View } from "../tools/ModelViewMapping";
import { Mesh, Vector3, Material, Group } from "three";

class BlockView implements View<Block>
{
    public model: Block;

    private mesh: Mesh;

    public constructor(readonly stageView: StageView)
    {
        this.model = {
            designID: 0,
            position: new Vector3(0, 0, 0),
            orientation: 0,
        }

        this.mesh = new Mesh(undefined, this.stageView.editor.testMaterial);
        this.stageView.group.add(this.mesh);
    }

    public refresh(): void
    {
        this.mesh.position.copy(this.model.position).addScalar(.5);
        this.mesh.setRotationFromAxisAngle(new Vector3(0, 1, 0), this.model.orientation * Math.PI / 2);
        this.mesh.geometry = this.stageView.editor.testBlockDesigns[this.model.designID % 2].geometry;
    }

    public setActive(active: boolean)
    {
        this.mesh.visible = active;
    }
}

export default class StageView
{
    public stage = new Stage();
    public readonly blocks: ModelViewMapping<Block, BlockView>;

    public readonly group = new Group();

    public constructor(readonly editor: SketchblocksEditor)
    {
        this.blocks = new ModelViewMapping<Block, BlockView>(() => new BlockView(this),
                                                             (view, active) => view.setActive(active));

        this.editor.scene.add(this.group);
    }

    public setStage(stage: Stage): void
    {
        this.stage = stage;
        this.refresh();
    }

    public refreshBlock(block: Block)
    {
        this.blocks.get(block)!.refresh();
    }

    public refresh(): void
    {
        const blocks: Block[] = [];
        this.stage.blocks.forEach(b => blocks.push(b));
        this.blocks.setModels(blocks);
    }
}
