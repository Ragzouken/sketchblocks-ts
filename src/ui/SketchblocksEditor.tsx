import { WebGLRenderer, PerspectiveCamera, Scene, Color } from 'three';
import { getElement } from '../utility';

export default class SketchblocksEditor
{
    public readonly renderer: WebGLRenderer;
    public readonly camera: PerspectiveCamera;
    public readonly scene: Scene;

    public constructor()
    {
        // renderer
        this.renderer = new WebGLRenderer({ antialias: false });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        // TODO: check this
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        getElement("root").appendChild(this.renderer.domElement);

        // camera
        // TODO: check aspect ratio
        this.camera = new PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);
        this.camera.position.set(5, 8, 13);
        this.camera.lookAt(0, 0, 0);

        this.scene = new Scene();
        this.scene.background = new Color(.1, .1, .1);
    }

    public render(): void
    {
        this.renderer.render(this.scene, this.camera);
    }
}
