import { BufferGeometry, Float32BufferAttribute, BufferAttribute } from 'three';
import { lerp } from './tools/utility';
import { BlockShape } from './data/Blocks';

// TODO: buffer attribute is view not model data...
export class BlockDesignTest 
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
