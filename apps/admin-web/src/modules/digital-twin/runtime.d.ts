export type TwinOptions = {storageKey:string;context:{siteId:string;userId:string}}
export type TwinInstance = {dispose:()=>void;snapshot:()=>unknown}
export function mountTwin(host:HTMLElement,options:TwinOptions):TwinInstance
