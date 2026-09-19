export const topics: [string,string][]
export function createDemoRenderer(): {
  render(topic:string, filters?:Record<string,string>):string;
  resize(id:string,width:number,height:number):string|null;
}
