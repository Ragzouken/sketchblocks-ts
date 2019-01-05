import { Vector3, Vector2 } from "three";

function faceNormal(v0: Vector3, v1: Vector3, v2: Vector3): Vector3
{
    return v1.sub(v0).cross(v2.sub(v1));
}

export class BlockShape
{
    public indices: number[] = [];
    public vertices: number[] = [];
    public normals: number[] = [];
    public texcoords: number[] = [];

    // mapping of face id to list of distinct indices used
    public faces = new Map<string, number[]>();

    // mapping of triangle number to face id
    public tri2face: string[] = [];

    public AddTriangleFace(id: string,
                           v0: Vector3, t0: Vector2,
                           v1: Vector3, t1: Vector2,
                           v2: Vector3, t2: Vector2): void
    {
        const count = this.vertices.length / 3;

        // one triangle
        const face = [count + 0, count + 1, count + 2];

        this.faces.set(id, face);
        this.indices.push(...face);
        this.tri2face.push(id);

        // three given vertices
        this.vertices.push(v0.x, v0.y, v0.z,
                           v1.x, v1.y, v1.z,
                           v2.x, v2.y, v2.z);

        // three given texcoords
        this.texcoords.push(t0.x, t0.y,
                            t1.x, t1.y,
                            t2.x, t2.y);

        // three identical normals
        const normal = faceNormal(v0, v1, v2);

        this.normals.push(normal.x, normal.y, normal.z);
        this.normals.push(normal.x, normal.y, normal.z);
        this.normals.push(normal.x, normal.y, normal.z);
    }

    public AddQuadFace(id: string,
                       v0: Vector3, t0: Vector2,
                       v1: Vector3, t1: Vector2,
                       v2: Vector3, t2: Vector2,
                       v3: Vector3, t3: Vector2): void
    {
        const count = this.vertices.length / 3;
        
        // two triangles for the quad face
        this.faces.set(id, [count + 0, count + 1, count + 2, count + 3]);
        this.indices.push(count + 0, count + 1, count + 2,
                          count + 0, count + 2, count + 3);
        this.tri2face.push(id, id);

        // four given vertices
        this.vertices.push(v0.x, v0.y, v0.z,
                           v1.x, v1.y, v1.z,
                           v2.x, v2.y, v2.z,
                           v3.x, v3.y, v3.z);

        // four given texcoords
        this.texcoords.push(t0.x, t0.y,
                            t1.x, t1.y,
                            t2.x, t2.y,
                            t3.x, t3.y);

        // four identical normals
        const normal = faceNormal(v0, v1, v2);

        this.normals.push(normal.x, normal.y, normal.z,
                          normal.x, normal.y, normal.z,
                          normal.x, normal.y, normal.z,
                          normal.x, normal.y, normal.z);
    }
}
