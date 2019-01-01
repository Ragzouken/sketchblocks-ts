import './index.css';
import * as THREE from 'three';
import { Scene, WebGLRenderer, Mesh, PerspectiveCamera, Raycaster, Material, Object3D, CanvasTexture, NearestFilter, BufferGeometry, Float32BufferAttribute, ClampToEdgeWrapping, Vector2, Vector3, FaceColors, BufferAttribute, Geometry, GridHelper, OneMinusDstAlphaFactor } from 'three';
import { MTexture } from './MTexture';
import { rgb2num, randomInt, rgb2hex, num2rgb, lerp, getElement } from './utility';
import { BlockShape } from './Blocks';
import SketchblocksEditor from './ui/SketchblocksEditor';

const editor = new SketchblocksEditor();

let plane: Mesh;
let gridHelper: GridHelper;
let mouse = new THREE.Vector2();
let raycaster: Raycaster;

let rollOverMesh: Mesh;
let rollOverMaterial: Material;
let cubeMaterial: Material;

var objects: Object3D[] = [];

const blocks: BlockDesignTest[] = [];
let cubeCollider: Mesh;

// TODO: buffer attribute is view not model data...
class BlockDesignTest
{
    private shape: BlockShape;
    public uvBufferAttribute: BufferAttribute; 
    public geometry: BufferGeometry;

    public constructor(shape: BlockShape)
    {
        this.shape = shape;
        this.uvBufferAttribute = new Float32BufferAttribute(shape.texcoords, 2);
        
        this.geometry = new BufferGeometry();
        // TODO: only make one buffer for a shape's vertices
        this.geometry.addAttribute("position", new Float32BufferAttribute(this.shape.vertices, 3));
        this.geometry.addAttribute("normal", new Float32BufferAttribute(this.shape.normals, 3));
        this.geometry.addAttribute("uv", this.uvBufferAttribute);
        this.geometry.setIndex(this.shape.indices);
    }

    public setFaceTile(faceID: string, 
                       xmin: number, ymin: number, 
                       xmax: number, ymax: number): void
    {
        const face = this.shape.faces.get(faceID)!;
        const base = this.shape.texcoords;
        const dest = this.uvBufferAttribute;

        for (let i = 0; i < face.length; ++i)
        {
            const index = face[i];

            dest.setX(index, lerp(xmin, xmax, base[index * 2 + 0]));
            dest.setY(index, lerp(ymin, ymax, base[index * 2 + 1]));
        }
    }
}

const spriteCount = 4;

function spriteToCoords(offset: number): [number, number, number, number]
{
    const factor = 1 / spriteCount;

    return [(offset + 0) * factor, 0, 
            (offset + 1) * factor, 1]
}

function init() 
{
    

    // texture
    const mtexture = new MTexture(spriteCount * 16, 16);
    const colors = [rgb2num(255,   0,   0), 
                    rgb2num(  0, 255,   0), 
                    rgb2num(  0,   0, 255), 
                    rgb2num(128,   0, 128), 
                    rgb2num(  0, 128, 128),
                    rgb2num(128, 128,   0)];

    mtexture.plot((x, y) =>
    {
        const i = Math.floor(x / 16);

        return colors[(i + randomInt(0, 1)) % colors.length];
    });

    for (let i = 0; i < spriteCount; ++i)
    {
        //mtexture.context.strokeStyle = "#FFFFFF";
        //mtexture.context.strokeRect(i * 16 + .5, .5, 15, 15);
        //mtexture.context.fillStyle = rgb2hex(num2rgb(colors[i]));
        //mtexture.context.fillRect(i * 16 + 1, 1, 14, 14);
    }

    const texture = new CanvasTexture(mtexture.canvas, 
                                      undefined, 
                                      ClampToEdgeWrapping,
                                      ClampToEdgeWrapping, 
                                      NearestFilter, 
                                      NearestFilter);

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

    blocks.push(testDesign2, testDesign);

    // roll-over helpers
    var rollOverGeo = new THREE.BoxBufferGeometry(1, 1, 1);
    rollOverMaterial = new THREE.MeshBasicMaterial( { color: 0xffFFFF, opacity: 0.75, transparent: true } );
    rollOverMesh = new THREE.Mesh( rollOverGeo, rollOverMaterial );
    editor.scene.add( rollOverMesh );

    // cubes
    cubeMaterial = new THREE.MeshBasicMaterial( { color: 0xffffff, map: texture } );

    // grid
    gridHelper = new THREE.GridHelper(32, 32);
    editor.scene.add( gridHelper );

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    var geometry = new THREE.PlaneBufferGeometry(32, 32);
    geometry.rotateX(-Math.PI/2);

    plane = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial( { visible: false } ) );
    editor.scene.add( plane );

    objects.push( plane );

    cubeCollider = new THREE.Mesh(new THREE.CubeGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ visible: false }));
    editor.scene.add(cubeCollider);

    // lights

    var ambientLight = new THREE.AmbientLight( 0x606060 );
    editor.scene.add( ambientLight );

    var directionalLight = new THREE.DirectionalLight( 0xffffff );
    directionalLight.position.set( 1, 0.75, 0.5 ).normalize();
    editor.scene.add( directionalLight );

    document.addEventListener( 'mousemove', onDocumentMouseMove, false );
    document.addEventListener( 'mousedown', onDocumentMouseDown, false );
    document.addEventListener('keydown', onDocumentKeyDown, false);
    //document.addEventListener('keyup', onDocumentKeyUp, false);

    //

    window.addEventListener( 'resize', onWindowResize, false );

}

function onDocumentKeyDown(event: KeyboardEvent)
{
    console.log(event.key);

    if (event.key == "w")
    {
        gridHelper.translateY(1);
        plane.translateY(1);
    }

    if (event.key == "s")
    {
        gridHelper.translateY(-1);
        plane.translateY(-1);
    }

    if (event.key == "d")
    {
        editor.scene.rotateOnAxis(new Vector3(0, 1, 0), -Math.PI / 8);
    }

    if (event.key == "a")
    {
        editor.scene.rotateOnAxis(new Vector3(0, 1, 0), Math.PI / 8);
    }

    if (event.key == "p")
    {
        blocks[0].setFaceTile("top", ...spriteToCoords(randomInt(0, 3)));
        blocks[0].uvBufferAttribute.needsUpdate = true;
    }

    editor.render();
}

function onWindowResize() {

    editor.camera.aspect = window.innerWidth / window.innerHeight;
    editor.camera.updateProjectionMatrix();

    editor.renderer.setSize( window.innerWidth, window.innerHeight );
}

function onDocumentMouseMove(event: any) 
{
    event.preventDefault();
    const [mx, my] = getMousePosition(event);
    //event.target.width
    mouse.set( ( mx ) * 2 - 1, - ( my ) * 2 + 1 );

    raycaster.setFromCamera( mouse, editor.camera );

    var intersects = raycaster.intersectObjects( objects );

    if (intersects.length > 0)
    {
        var intersect = intersects[ 0 ];

        if (intersect.object === plane)
        {
            const p = editor.scene.worldToLocal(intersect.point);
            rollOverMesh.position.copy(p).floor().addScalar(.5).setY(.5);
            rollOverMesh.visible = true;
        }
        else
        {
            cubeCollider.position.copy(intersect.object.position);
            const intersects2 = raycaster.intersectObjects([cubeCollider]);
            const intersect2 = intersects2[0];

            if (intersect2)
            {
                rollOverMesh.position.copy(intersect2.object.position).add(intersect2.face!.normal);
                rollOverMesh.visible = true;
            }
        }
    }
    else
    {
        rollOverMesh.visible = false;
    }

    editor.render();

}

function makeBlock(): Mesh
{
    return new THREE.Mesh(blocks[randomInt(0, blocks.length - 1)].geometry, cubeMaterial);
}

function getMousePosition(event: any): [number, number]
{
    // e = Mouse click event.
    var rect = event.target.getBoundingClientRect();
    var x = event.clientX - rect.left; //x position within the element.
    var y = event.clientY - rect.top;  //y position within the element.

    return [x / rect.width, y / rect.height];
}

function onDocumentMouseDown(event: any) 
{
    event.preventDefault();

    {
        var voxel = makeBlock();
        
        voxel.position.copy(rollOverMesh.position);

        editor.scene.add(voxel);
        voxel.rotateOnAxis(new Vector3(0, 1, 0), randomInt(0, 3) * Math.PI / 2);
        objects.push(voxel);
    }

    editor.render();
}

init();
editor.render();
