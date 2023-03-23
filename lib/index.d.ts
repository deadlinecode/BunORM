/// <reference types="bun-types" />
import { Database } from "bun:sqlite";
type _Narrow<T, U> = [U] extends [T] ? U : Extract<T, U>;
type Narrow<T = unknown> = _Narrow<T, (...args: any[]) => any> | _Narrow<T, 0 | (number & {})> | _Narrow<T, 0n | (bigint & {})> | _Narrow<T, "" | (string & {})> | _Narrow<T, boolean> | _Narrow<T, symbol> | _Narrow<T, []> | _Narrow<T, {
    [_: PropertyKey]: Narrow;
}> | (T extends object ? {
    [K in keyof T]: Narrow<T[K]>;
} : never) | Extract<{} | null | undefined, T>;
type SQLiteDataType = "NULL" | "INTEGER" | "REAL" | "TEXT" | "BLOB";
type CustomDataType = "JSON";
export type DataType = SQLiteDataType | CustomDataType;
export type NormalizeDataType<T extends DataType, C extends JSON | Column | Relation> = T extends "NULL" ? null : T extends "INTEGER" ? number : T extends "REAL" ? number : T extends "TEXT" ? string : T extends "BLOB" ? Uint8Array : T extends "JSON" ? C extends JSON ? undefined extends C["customDataType"] ? any : C["customDataType"] : any : unknown;
type RemoveFirstParam<T> = T extends (first: any, ...rest: infer P) => infer R ? (...args: P) => R : never;
export interface Relation {
    type: "REL";
    table: keyof Tables;
    nullable?: boolean;
}
export interface Column {
    type: DataType;
    default?: string;
    nullable?: boolean;
    unique?: boolean;
}
export interface JSON extends Column {
    type: "JSON";
    customDataType?: any;
}
export interface Columns {
    [name: string]: Column | JSON | Relation;
}
type AddColumnDefaults<T> = {
    id: number;
} & T & {
    updatedAt: string;
    createdAt: string;
};
type AddTableFx<T extends Tables[string], X> = X & (T extends undefined ? {} : {
    [name in keyof T["fx"]]: RemoveFirstParam<T["fx"][name]>;
});
type ExcludeProps<T, U> = Pick<T, Exclude<keyof T, keyof U>>;
type _ColumnSortOut<T extends Tables[string]["columns"], K extends keyof T> = T[K] extends Column ? T[K]["nullable"] extends true ? K : undefined extends T[K]["default"] ? never : K : T[K]["nullable"] extends true ? K : never;
type And<A, TA, B, TB> = A extends TA ? (B extends TB ? true : false) : false;
type _Columns<TT extends Tables, T extends Tables[string], WORelations extends boolean = false> = {
    [colName in keyof T["columns"] as _ColumnSortOut<T["columns"], colName>]?: And<WORelations, true, T["columns"][colName]["type"], "REL"> extends true ? number : T["columns"][colName] extends Column ? NormalizeDataType<T["columns"][colName]["type"], T["columns"][colName]> : T["columns"][colName] extends Relation ? _Columns<TT, TT[T["columns"][colName]["table"]]>[] : never;
} & ExcludeProps<{
    [colName in keyof T["columns"]]: And<WORelations, true, T["columns"][colName]["type"], "REL"> extends true ? number : T["columns"][colName] extends Column ? NormalizeDataType<T["columns"][colName]["type"], T["columns"][colName]> : T["columns"][colName] extends Relation ? _Columns<TT, TT[T["columns"][colName]["table"]]>[] : never;
}, {
    [colName in keyof T["columns"] as _ColumnSortOut<T["columns"], colName>]: And<WORelations, true, T["columns"][colName]["type"], "REL"> extends true ? number : T["columns"][colName] extends Column ? NormalizeDataType<T["columns"][colName]["type"], T["columns"][colName]> : T["columns"][colName] extends Relation ? _Columns<TT, TT[T["columns"][colName]["table"]]>[] : never;
}>;
export interface Table {
    columns: Columns;
    fx?: {
        [name: string]: Narrow<(item: any, ...args: any[]) => any>;
    };
    mw?: {
        get?: Narrow<(item: any) => any>[];
        set?: Narrow<(item: any) => any>[];
    };
}
export interface Tables {
    [name: string]: Table;
}
type SortOut<I, E> = Pick<I, {
    [K in keyof I]: I[K] extends E ? K : never;
}[keyof I]>;
type Or<A, TA, B, TB> = A extends TA ? true : B extends TB ? true : false;
interface _TableFunctions<TT extends Tables, T extends Tables[string]> {
    create: (cols: _Columns<TT, T, true>) => AddTableFx<T, _Columns<TT, T, true>>;
    save: (cols: _Columns<TT, T, true> | ({
        id: number;
    } & Partial<_Columns<TT, T, true>>)) => AddTableFx<T, AddColumnDefaults<_Columns<TT, T, true>>>[];
    delete: (opts: Partial<_Columns<TT, T, true>>) => void;
    find: <S extends (keyof T["columns"])[] | undefined, R extends Narrow<(keyof SortOut<T["columns"], {
        type: "REL";
    }>)[] | undefined>>(opts?: {
        where?: Partial<_Columns<TT, T, true>>;
        select?: S;
        resolve?: R;
    }) => AddTableFx<T, AddColumnDefaults<Or<S, (keyof T["columns"])[], R, (keyof SortOut<T["columns"], {
        type: "REL";
    }>)[]> extends true ? {
        [colName in S extends (keyof T["columns"])[] ? keyof Pick<T["columns"], S[number]> : keyof T["columns"]]: T["columns"][colName] extends Column ? NormalizeDataType<T["columns"][colName]["type"], T["columns"][colName]> : T["columns"][colName] extends Relation ? R extends (keyof SortOut<T["columns"], {
            type: "REL";
        }>)[] ? R[number] extends never ? number : colName extends R[number] ? _Columns<TT, TT[T["columns"][colName]["table"]]>[] : number : number : never;
    } : _Columns<TT, T, true>>>[];
    findBy: (opts: Partial<_Columns<TT, T>>) => AddTableFx<T, AddColumnDefaults<_Columns<TT, T, true>>>[];
}
type _Tables<T extends Tables> = {
    [tableName in keyof T]: _TableFunctions<T, T[tableName]>;
};
export interface Config<T extends Tables> {
    tables: T;
}
export declare class BunORM<T extends Narrow<Tables>> {
    readonly config: Config<T>;
    tables: _Tables<T>;
    db: Database;
    private createTable;
    private Col;
    constructor(file: string, config: Config<T>);
}
export default BunORM;
