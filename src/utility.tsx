export function buttonClick(id: string, action: () => void)
{
    document.getElementById(id)!.addEventListener("click", action);
}

export function delay(time: number)
{
    return new Promise(resolve => setTimeout(() => resolve(), time));
}

export function clamp(min: number, max: number, value: number): number
{
    return Math.max(min, Math.min(max, value));
}

export function lerp(v0: number, v1: number, t: number): number
{
    return (1 - t) * v0 + t * v1;
}

export function invLerp(v0: number, v1: number, v: number): number
{
    return (v - v0) / (v1 - v0);
}

export function randomInt(min: number, max: number)
{
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function num2hex(value: number): string
{
    return rgb2hex(num2rgb(value));
}

export function rgb2num(r: number, g: number, b: number, a: number = 255)
{
  return ((a << 24) | (b << 16) | (g << 8) | (r)) >>> 0;
}

export function num2rgb(value: number): [number, number, number]
{
    const r = (value >>  0) & 0xFF;
    const g = (value >>  8) & 0xFF;
    const b = (value >> 16) & 0xFF;
    
    return [r, g, b];
}

export function rgb2hex(color: [number, number, number]): string
{
    const [r, g, b] = color;
    let rs = r.toString(16);
    let gs = g.toString(16);
    let bs = b.toString(16);

    if (rs.length < 2) { rs = "0" + rs; }
    if (gs.length < 2) { gs = "0" + gs; }
    if (bs.length < 2) { bs = "0" + bs; }

    return `#${rs}${gs}${bs}`;
}

export function hex2rgb(color: string): [number, number, number]
{
    const matches = color.match(/^#([0-9a-f]{6})$/i);

    if (matches) 
    {
        const match = matches[1];

        return [
            parseInt(match.substr(0,2),16),
            parseInt(match.substr(2,2),16),
            parseInt(match.substr(4,2),16)
        ];
    }
    
    return [0, 0, 0];
}

export function swapArrayElements<TElement>(array: TElement[], 
                                            prev: number,
                                            next: number): void
{
    if (prev < 0 || prev >= array.length) { return };
    if (next < 0) { next = 0; }
    if (next >= array.length) { next = array.length - 1; }

    [array[prev], array[next]] = [array[next], array[prev]];
}

export function minimum<T>(array: T[], select: (element: T) => number): number
{
    let min = select(array[0]);

    for (const element of array)
    {
        const value = select(element);
        
        min = min <= value ? min : value;
    }

    return min;
}

export function maximum<T>(array: T[], select: (element: T) => number): number
{
    let max = select(array[0]);

    for (const element of array)
    {
        const value = select(element);
        
        max = max >= value ? max : value;
    }

    return max;
}



interface Option
{
    label: string,
    value: string,
}

export function repopulateSelect(select: HTMLSelectElement,
                                 options: Option[],
                                 dummy?: string)
{
    const index = select.selectedIndex;

    while (select.lastChild)
    {
        select.removeChild(select.lastChild);
    }

    if (dummy)
    {
        const child = document.createElement("option");
        child.text = dummy;
        child.disabled = true;
        child.selected = true;

        select.appendChild(child);
    }

    options.forEach(option => 
    {
        const child = document.createElement("option");
        child.text = option.label;
        child.value = option.value;

        select.appendChild(child);
    });

    select.selectedIndex = index;
}

export function getElement<TElement extends HTMLElement>(id: string): TElement    
{
    return document.getElementById(id)! as TElement;
}
