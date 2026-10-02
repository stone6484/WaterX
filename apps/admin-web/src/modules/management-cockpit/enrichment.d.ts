export interface Detail {title:string;period:string;insight:string;note:string;heads:string[];rows:(string|number)[][]}
export const exBoards:Record<string,unknown[]>;
export function enrichBoard(content:HTMLElement,topic:string):void;
export function getDetail(key:string):Detail|null;
