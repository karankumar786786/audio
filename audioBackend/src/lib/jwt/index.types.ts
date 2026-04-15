export interface JWT<T>{
    sign(payload:T):Promise<string>;
    verify(token:string):Promise<T>;
}