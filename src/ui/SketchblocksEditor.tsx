import { WebGLRenderer, PerspectiveCamera, Scene, Color, Vector3, Clock, Vector2, Euler, Material, CanvasTexture, ClampToEdgeWrapping, NearestFilter, MeshBasicMaterial, Mesh, Raycaster, BoxBufferGeometry, Object3D, PlaneBufferGeometry, CubeGeometry, GridHelper, AmbientLight, DirectionalLight } from 'three';
import { getElement, randomInt, rgb2num } from '../tools/utility';
import { BlockDesignTest } from '../data/BlockDesignTest';
import { MTexture } from '../tools/MTexture';
import { BlockShape } from '../data/Blocks';
import { makeRandomStage } from '../data/Stage';
import StageView from './StageView';

class PivotCamera
{
    public focus = new Vector3(0, 0);
    public angle = 0;
    public pitch = -Math.PI / 8;
    public distance = 12;
    
    public setCamera(camera: PerspectiveCamera): void
    {
        const position = new Vector3(0, 0, this.distance);
        const rotation = new Euler(this.pitch, this.angle, 0, "ZYX");
        
        position.applyEuler(rotation);

        camera.position.addVectors(position, this.focus);
        camera.lookAt(this.focus);
    }
}

const spriteCount = 4;

function spriteToCoords(offset: number): [number, number, number, number]
{
    const factor = 1 / spriteCount;

    return [(offset + 0) * factor, 0, 
            (offset + 1) * factor, 1]
}

function randomColor(): number
{
    return rgb2num(randomInt(0, 255),
                   randomInt(0, 255),
                   randomInt(0, 255));
}

export default class SketchblocksEditor
{
    public readonly clock: Clock;
    public readonly renderer: WebGLRenderer;
    public readonly camera: PerspectiveCamera;
    public readonly pivotCamera = new PivotCamera();
    public readonly scene: Scene;

    private readonly stageView: StageView;

    private readonly keys: {[key: string]: boolean} = {};

    public block = 0;

    public testMaterial: Material;
    public testBlockDesigns: BlockDesignTest[] = [];

    private readonly testCursorCube: Mesh;
    private readonly testPlaceCube: Mesh;
    private readonly testObjects: Object3D[] = [];

    private readonly gridCollider: Mesh;
    private readonly cubeCollider: Mesh;

    private cursorPosition = new Vector3(0, 0, 0);
    private placePosition = new Vector3(0, 0, 0);

    public constructor()
    {
        //
        this.clock = new Clock();

        // keys
        const keydown = (event: any) =>
        {
            this.keys[event.key] = true;

            if (event.key === "[")
            {
                const id = this.cursorPosition.toArray().join(",");
                const block = this.stageView.stage.blocks.get(id);

                if (block)
                {
                    block.orientation += 1;
                    this.stageView.refreshBlock(block);
                }
            }
        }

        const keyup = (event: any) =>
        {
            this.keys[event.key] = false;
        }

        document.addEventListener('keydown', keydown, false);
        document.addEventListener('keyup', keyup, false);

        // canvas
        window.addEventListener('resize', () => this.resizeThreeCanvas(), false);

        // renderer
        this.renderer = new WebGLRenderer({ antialias: false });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        getElement("root").appendChild(this.renderer.domElement);

        // camera
        // TODO: check aspect ratio
        this.camera = new PerspectiveCamera(45, 320 / 240, 1, 10000);
        this.camera.position.set(0, 8, 13);
        this.camera.lookAt(0, 0, 0);
        
        this.resizeThreeCanvas();

        this.scene = new Scene();
        this.scene.background = new Color(.1, .1, .1);

        this.animate();

        // extra...
        const grid = getElement("blockgrid");
        for (let i = 0; i < 16; ++i)
        {
            let index = i;

            const button = document.createElement("button");
            button.addEventListener("click", () => this.block = index);
            grid.appendChild(button);
        }

        const texsize = 16;

        // texture
        const mtexture = new MTexture(spriteCount * texsize, texsize);
        const colors = [randomColor(), 
                        randomColor(),
                        randomColor(),
                        randomColor(),
                        randomColor(),
                        randomColor()];

        mtexture.plot((x, y) =>
        {
            const i = Math.floor(x / texsize);

            return colors[(i + randomInt(0, 1)) % colors.length];
        });

        const texture = new CanvasTexture(mtexture.canvas, 
                                          undefined, 
                                          ClampToEdgeWrapping,
                                          ClampToEdgeWrapping, 
                                          NearestFilter, 
                                          NearestFilter);

        this.testMaterial = new MeshBasicMaterial({ color: 0xffffff, map: texture });

        // designs
        const cube = new BlockShape();
        cube.AddQuadFace("back",
                        new Vector3(1, 0, 0), new Vector2(0, 1),
                        new Vector3(0, 0, 0), new Vector2(1, 1),
                        new Vector3(0, 1, 0), new Vector2(1, 0),
                        new Vector3(1, 1, 0), new Vector2(0, 0));
        cube.AddQuadFace("front",
                        new Vector3(0, 1, 1), new Vector2(1, 0),
                        new Vector3(0, 0, 1), new Vector2(1, 1),
                        new Vector3(1, 0, 1), new Vector2(0, 1),
                        new Vector3(1, 1, 1), new Vector2(0, 0));
        cube.AddQuadFace("left",
                        new Vector3(1, 1, 1), new Vector2(1, 0),
                        new Vector3(1, 0, 1), new Vector2(1, 1),
                        new Vector3(1, 0, 0), new Vector2(0, 1),
                        new Vector3(1, 1, 0), new Vector2(0, 0));
        cube.AddQuadFace("right",
                        new Vector3(0, 1, 0), new Vector2(1, 0),
                        new Vector3(0, 0, 0), new Vector2(1, 1),
                        new Vector3(0, 0, 1), new Vector2(0, 1),
                        new Vector3(0, 1, 1), new Vector2(0, 0));
        cube.AddQuadFace("top",
                        new Vector3(0, 1, 1), new Vector2(1, 0),
                        new Vector3(1, 1, 1), new Vector2(1, 1),
                        new Vector3(1, 1, 0), new Vector2(0, 1),
                        new Vector3(0, 1, 0), new Vector2(0, 0));
    
        const test = new BlockShape();
        test.AddQuadFace("slope",
                        new Vector3(0, 1, 0), new Vector2(1, 1),
                        new Vector3(0, 0, 1), new Vector2(1, 0),
                        new Vector3(1, 0, 1), new Vector2(0, 0),
                        new Vector3(1, 1, 0), new Vector2(0, 1));
    
        test.AddQuadFace("back",
                        new Vector3(1, 0, 0), new Vector2(0, 1),
                        new Vector3(0, 0, 0), new Vector2(1, 1),
                        new Vector3(0, 1, 0), new Vector2(1, 0),
                        new Vector3(1, 1, 0), new Vector2(0, 0));
    
        test.AddTriangleFace("left", 
                            new Vector3(1, 1, 0), new Vector2(1, 1),
                            new Vector3(1, 0, 1), new Vector2(0, 0),
                            new Vector3(1, 0, 0), new Vector2(1, 0));
    
        test.AddTriangleFace("right", 
                            new Vector3(0, 0, 1), new Vector2(1, 0),
                            new Vector3(0, 1, 0), new Vector2(0, 1),
                            new Vector3(0, 0, 0), new Vector2(0, 0));
    
        const testDesign2 = new BlockDesignTest(cube);
        testDesign2.setFaceTile("front", ...spriteToCoords(0));
        testDesign2.setFaceTile("back", ...spriteToCoords(0));
        testDesign2.setFaceTile("left", ...spriteToCoords(1));
        testDesign2.setFaceTile("right", ...spriteToCoords(1));
        testDesign2.setFaceTile("top", ...spriteToCoords(2));
        //testDesign2.setFaceTile("bottom", ...spriteToCoords(0));
        testDesign2.geometry.translate(-.5, -.5, -.5);
    
        const testDesign = new BlockDesignTest(test);
        testDesign.setFaceTile("slope", ...spriteToCoords(0));
        testDesign.setFaceTile("left", ...spriteToCoords(1));
        testDesign.setFaceTile("right", ...spriteToCoords(2));
        testDesign.setFaceTile("back", ...spriteToCoords(3));
        testDesign.geometry.translate(-.5, -.5, -.5);
    
        this.testBlockDesigns.push(testDesign2, testDesign);

        // test stage
        this.stageView = new StageView(this);
        this.stageView.setStage(makeRandomStage());

        // cursor
        const cursorGeometry = new BoxBufferGeometry(1.1, 1.1, 1.1);
        const cursorMaterial = new MeshBasicMaterial({ color: 0xffFFFF, opacity: 0.5, transparent: true })
        this.testCursorCube = new Mesh(cursorGeometry, cursorMaterial);
        this.scene.add(this.testCursorCube);

        const placeGeometry = new BoxBufferGeometry(.3, .3, .3);
        const placeMaterial = new MeshBasicMaterial({ color: 0xffFFFF, opacity: 0.9, transparent: true })
        this.testPlaceCube = new Mesh(placeGeometry, placeMaterial);
        this.scene.add(this.testPlaceCube);

        // floor
        const gridColliderGeometry = new PlaneBufferGeometry(16, 16);
        gridColliderGeometry.rotateX(-Math.PI/2);
        this.gridCollider = new Mesh(gridColliderGeometry, new MeshBasicMaterial({ visible: false }));
        this.scene.add(this.gridCollider);
        this.testObjects.push(this.gridCollider);

        // cube
        this.cubeCollider = new Mesh(new CubeGeometry(1, 1, 1), 
                            new MeshBasicMaterial({ visible: false }));
        this.scene.add(this.cubeCollider);

        // mouse
        document.addEventListener('mousemove', event => this.updateCursor(event), false);
        document.addEventListener('mousedown', event => this.onDocumentMouseDown(event), false);

        // grid renderer
        const gridRenderer = new GridHelper(16, 16);
        this.scene.add(gridRenderer);

        // lights
        /*
        const ambientLight = new AmbientLight(0x606060);
        this.scene.add(ambientLight);

        const directionalLight = new DirectionalLight(0xffffff);
        directionalLight.position.set(1, 0.75, 0.5).normalize();
        this.scene.add(directionalLight);
        */
    }

    public animate(): void
    {
        requestAnimationFrame(() => this.animate());
        
        this.update(this.clock.getDelta());
        this.render();
    }

    public update(dt: number): void
    {
        if (this.keys["a"])
        {
            this.pivotCamera.angle -= Math.PI / 4 * dt;
        }

        if (this.keys["d"])
        {
            this.pivotCamera.angle += Math.PI / 4 * dt;
        }

        if (this.keys["w"])
        {
            this.pivotCamera.pitch -= Math.PI / 16 * dt;
        }

        if (this.keys["s"])
        {
            this.pivotCamera.pitch += Math.PI / 16 * dt;
        }

        if (this.keys["e"])
        {
            this.pivotCamera.distance += 8 * dt;
        }

        if (this.keys["q"])
        {
            this.pivotCamera.distance -= 8 * dt;
        }

        this.pivotCamera.setCamera(this.camera);
    }

    public render(): void
    {
        this.renderer.render(this.scene, this.camera);
    }

    public testMakeBlock(): Mesh
    {
        return new Mesh(this.testBlockDesigns[this.block % 2].geometry, this.testMaterial);
    }

    private resizeThreeCanvas(): void
    {
        // TODO: need to center viewport correctly
        const w = 320;
        const h = 200;

        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
    
        this.renderer.setSize(w, h, false);
        //this.renderer.setViewport(10, 10, 320, 240);
    }

    private updateCursor(event: MouseEvent): void
    {
        if (event.target !== this.renderer.domElement) return;

        event.preventDefault();
        const [mx, my] = this.getMousePosition(event);
        const mouse = new Vector2();
        //event.target.width
        mouse.set(mx * 2 - 1, -my * 2 + 1);

        const raycaster = new Raycaster();
        raycaster.setFromCamera(mouse, this.camera);

        var intersects = raycaster.intersectObjects([this.gridCollider, this.stageView.group], true);

        if (intersects.length > 0)
        {
            var intersect = intersects[ 0 ];

            if (intersect.object === this.gridCollider)
            {
                const p = this.scene.worldToLocal(intersect.point);

                this.cursorPosition.copy(p).floor().setY(-1);
                this.placePosition.copy(this.cursorPosition).setY(0);
                this.testCursorCube.visible = true;
            }
            else
            {
                this.cubeCollider.position.copy(intersect.object.position);
                const intersects2 = raycaster.intersectObject(this.cubeCollider);
                const intersect2 = intersects2[0];

                if (intersect2)
                {
                    this.cursorPosition.copy(intersect2.object.position).floor();
                    this.placePosition.copy(this.cursorPosition).add(intersect2.face!.normal);
                    this.testCursorCube.visible = true;
                    this.testPlaceCube.visible = true;
                }
                else
                {
                    this.testPlaceCube.visible = false;
                }
            }
        }
        else
        {
            this.testCursorCube.visible = false;
        }

        const id = this.placePosition.toArray().join(",");
        if (this.stageView.stage.blocks.get(id))
        {
            this.testPlaceCube.visible = false;
        }

        this.testCursorCube.position.copy(this.cursorPosition).addScalar(.5);
        this.testPlaceCube.position.copy(this.placePosition).addScalar(.5);
    }

    private getMousePosition(event: any): [number, number]
    {
        // e = Mouse click event.
        var rect = event.target.getBoundingClientRect();
        var x = event.clientX - rect.left; //x position within the element.
        var y = event.clientY - rect.top;  //y position within the element.

        return [x / rect.width, y / rect.height];
    }

    private onDocumentMouseDown(event: any) 
    {
        if (event.target !== this.renderer.domElement) return;
        if (!this.testPlaceCube.visible) return;

        event.preventDefault();

        const id = this.placePosition.toArray().join(",");
        const block =  {
            designID: this.block,
            orientation: 0,
            position: this.placePosition.clone(),
        };
        this.stageView.stage.blocks.set(id, block);
        this.stageView.refresh();
    }
}
