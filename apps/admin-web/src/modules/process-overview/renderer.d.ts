export function createOverviewRenderer(): { render(fullscreen?:boolean):string;select(kind:string,value:string):void;metrics():unknown[][];series(name:string):{limit:number;values:(number|null)[]}}
export function observeOverview(root:HTMLElement):()=>void
