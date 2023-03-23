import { Database } from "bun:sqlite";

const arr = (length: number, map: (i: number) => any) =>
  new Array(length).fill(0).map((_, i) => map(i + 1));

type _Narrow<T, U> = [U] extends [T] ? U : Extract<T, U>;
type Narrow<T = unknown> =
  | _Narrow<T, (...args: any[]) => any>
  | _Narrow<T, 0 | (number & {})>
  | _Narrow<T, 0n | (bigint & {})>
  | _Narrow<T, "" | (string & {})>
  | _Narrow<T, boolean>
  | _Narrow<T, symbol>
  | _Narrow<T, []>
  | _Narrow<T, { [_: PropertyKey]: Narrow }>
  | (T extends object ? { [K in keyof T]: Narrow<T[K]> } : never)
  | Extract<{} | null | undefined, T>;

type SQLiteDataType = "NULL" | "INTEGER" | "REAL" | "TEXT" | "BLOB";
type CustomDataType = "JSON";
export type DataType = SQLiteDataType | CustomDataType;
export type NormalizeDataType<
  T extends DataType,
  C extends JSON | Column | Relation
> = T extends "NULL"
  ? null
  : T extends "INTEGER"
  ? number
  : T extends "REAL"
  ? number
  : T extends "TEXT"
  ? string
  : T extends "BLOB"
  ? Uint8Array
  : T extends "JSON"
  ? C extends JSON
    ? undefined extends C["customDataType"]
      ? any
      : C["customDataType"]
    : any
  : unknown;

type RemoveFirstParam<T> = T extends (first: any, ...rest: infer P) => infer R
  ? (...args: P) => R
  : never;

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

type AddColumnDefaults<T> = { id: number } & T & {
    updatedAt: string;
    createdAt: string;
  };

type AddTableFx<T extends Tables[string], X> = X &
  (T extends undefined
    ? {}
    : {
        [name in keyof T["fx"]]: RemoveFirstParam<T["fx"][name]>;
      });

type ExcludeProps<T, U> = Pick<T, Exclude<keyof T, keyof U>>;

type _ColumnSortOut<
  T extends Tables[string]["columns"],
  K extends keyof T
> = T[K] extends Column
  ? T[K]["nullable"] extends true
    ? K
    : undefined extends T[K]["default"]
    ? never
    : K
  : T[K]["nullable"] extends true
  ? K
  : never;

type And<A, TA, B, TB> = A extends TA ? (B extends TB ? true : false) : false;

type _Columns<
  TT extends Tables,
  T extends Tables[string],
  WORelations extends boolean = false
> = {
  [colName in keyof T["columns"] as _ColumnSortOut<
    T["columns"],
    colName
  >]?: And<WORelations, true, T["columns"][colName]["type"], "REL"> extends true
    ? number
    : T["columns"][colName] extends Column
    ? NormalizeDataType<T["columns"][colName]["type"], T["columns"][colName]>
    : T["columns"][colName] extends Relation
    ? _Columns<TT, TT[T["columns"][colName]["table"]]>[]
    : never;
} & ExcludeProps<
  {
    [colName in keyof T["columns"]]: And<
      WORelations,
      true,
      T["columns"][colName]["type"],
      "REL"
    > extends true
      ? number
      : T["columns"][colName] extends Column
      ? NormalizeDataType<T["columns"][colName]["type"], T["columns"][colName]>
      : T["columns"][colName] extends Relation
      ? _Columns<TT, TT[T["columns"][colName]["table"]]>[]
      : never;
  },
  {
    [colName in keyof T["columns"] as _ColumnSortOut<
      T["columns"],
      colName
    >]: And<
      WORelations,
      true,
      T["columns"][colName]["type"],
      "REL"
    > extends true
      ? number
      : T["columns"][colName] extends Column
      ? NormalizeDataType<T["columns"][colName]["type"], T["columns"][colName]>
      : T["columns"][colName] extends Relation
      ? _Columns<TT, TT[T["columns"][colName]["table"]]>[]
      : never;
  }
>;

export interface Table {
  columns: Columns;
  fx?: { [name: string]: Narrow<(item: any, ...args: any[]) => any> };
  mw?: {
    get?: Narrow<(item: any) => any>[];
    set?: Narrow<(item: any) => any>[];
  };
}

export interface Tables {
  [name: string]: Table;
}

type SortOut<I, E> = Pick<
  I,
  { [K in keyof I]: I[K] extends E ? K : never }[keyof I]
>;

type Or<A, TA, B, TB> = A extends TA ? true : B extends TB ? true : false;

interface _TableFunctions<TT extends Tables, T extends Tables[string]> {
  create: (cols: _Columns<TT, T, true>) => AddTableFx<T, _Columns<TT, T, true>>;
  save: (
    cols:
      | _Columns<TT, T, true>
      | ({ id: number } & Partial<_Columns<TT, T, true>>)
  ) => AddTableFx<T, AddColumnDefaults<_Columns<TT, T, true>>>[];
  delete: (opts: Partial<_Columns<TT, T, true>>) => void;
  find: <
    S extends (keyof T["columns"])[] | undefined,
    R extends Narrow<
      (keyof SortOut<T["columns"], { type: "REL" }>)[] | undefined
    >
  >(opts?: {
    where?: Partial<_Columns<TT, T, true>>;
    select?: S;
    resolve?: R;
  }) => AddTableFx<
    T,
    AddColumnDefaults<
      Or<
        S,
        (keyof T["columns"])[],
        R,
        (keyof SortOut<T["columns"], { type: "REL" }>)[]
      > extends true
        ? {
            [colName in S extends (keyof T["columns"])[]
              ? keyof Pick<T["columns"], S[number]>
              : keyof T["columns"]]: T["columns"][colName] extends Column
              ? NormalizeDataType<
                  T["columns"][colName]["type"],
                  T["columns"][colName]
                >
              : T["columns"][colName] extends Relation
              ? R extends (keyof SortOut<T["columns"], { type: "REL" }>)[]
                ? R[number] extends never
                  ? number
                  : colName extends R[number]
                  ? _Columns<TT, TT[T["columns"][colName]["table"]]>[]
                  : number
                : number
              : never;
          }
        : _Columns<TT, T, true>
    >
  >[];
  findBy: (
    opts: Partial<_Columns<TT, T>>
  ) => AddTableFx<T, AddColumnDefaults<_Columns<TT, T, true>>>[];
}

type _Tables<T extends Tables> = {
  [tableName in keyof T]: _TableFunctions<T, T[tableName]>;
};

export interface Config<T extends Tables> {
  tables: T;
}

export class BunORM<T extends Narrow<Tables>> {
  tables: _Tables<T>;
  db: Database;

  private createTable = (table: string, opts: Table) =>
    (typeof this.db.run(
      `CREATE TABLE IF NOT EXISTS ${table} ('id' INTEGER PRIMARY KEY AUTOINCREMENT,${Object.entries(
        opts.columns as Record<keyof Columns, Column>
      )
        .filter(([_, opts]) => (opts.type as any) !== "REL")
        .map(([col, opts]) =>
          [
            `'${col}'`,
            opts.type === "JSON" ? "TEXT" : opts.type,
            opts.default && `DEFAULT ${opts.default}`,
            opts.unique && "UNIQUE",
            !opts.nullable && "NOT NULL",
          ]
            .filter((x) => !!x)
            .join(" ")
        )
        .join()}${
        Object.entries(opts.columns as Record<keyof Columns, Relation>).filter(
          ([_, opts]) => opts.type === "REL"
        ).length
          ? "," +
            Object.entries(opts.columns as Record<keyof Columns, Relation>)
              .filter(([_, opts]) => opts.type === "REL")
              .map(([col, opts]) =>
                [`'${col}' INTEGER`, !opts.nullable && "NOT NULL"]
                  .filter((x) => !!x)
                  .join(" ")
              )
              .join()
          : ""
      },'updatedAt' DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,'createdAt' DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL${
        Object.entries(opts.columns as Record<keyof Columns, Relation>).filter(
          ([_, opts]) => opts.type === "REL"
        ).length
          ? "," +
            Object.entries(opts.columns as Record<keyof Columns, Relation>)
              .filter(([_, opts]) => opts.type === "REL")
              .map(
                ([col, opts]) =>
                  `FOREIGN KEY ('${col}') REFERENCES ${opts.table} (id)`
              )
              .join()
          : ""
      });`
    ) !== "number") as true;

  private Col = (table: string): _Tables<T>[keyof T] => {
    const Table = this.config.tables[table as keyof Narrow<Tables>] as Table,
      injectFx = (rows: any[], table: Table = Table) =>
        rows.map((x) =>
          Object.assign(
            x,
            Object.fromEntries(
              Object.entries(table.fx || {}).map(([k, v]) => [
                k,
                (...args: any[]) => (v as any)(x, ...args),
              ])
            )
          )
        ),
      parseJSON = (rows: any[], table: Table = Table) =>
        Object.values(table.columns).every((x) => x.type !== "JSON")
          ? rows
          : rows.map((row) =>
              Object.fromEntries(
                Object.entries(row).map(([k, v]) => [
                  k,
                  table.columns[k] && table.columns[k].type === "JSON"
                    ? JSON.parse(v as string)
                    : v,
                ])
              )
            ),
      executeGetMiddleware = (rows: any[], table: Table = Table) =>
        !Array.isArray(table.mw?.get) ||
        (table.mw as any).get.some((mw: any) => typeof mw !== "function")
          ? rows
          : rows.map((row) => {
              (table.mw as { get: ((item: any) => any)[] }).get.forEach(
                (mw) => (row = mw(row))
              );
              return row;
            }),
      resolveRelations = (rows: any[], keys: string[]) =>
        !keys.length ||
        Object.values(Table.columns).every((x) => x.type !== "REL")
          ? rows
          : rows.map((row) =>
              Object.fromEntries(
                Object.entries(row).map(([k, v]) => [
                  k,
                  Table.columns[k] && Table.columns[k].type === "REL"
                    ? executeGetMiddleware(
                        injectFx(
                          parseJSON(
                            this.db
                              .query(
                                `SELECT * FROM ${
                                  (Table.columns[k] as Relation).table
                                } WHERE id = $id`
                              )
                              .all({ $id: v as number }),
                            this.config.tables[
                              (Table.columns[k] as Relation)
                                .table as keyof Narrow<Tables>
                            ]
                          ),
                          this.config.tables[
                            (Table.columns[k] as Relation)
                              .table as keyof Narrow<Tables>
                          ]
                        ),
                        this.config.tables[
                          (Table.columns[k] as Relation)
                            .table as keyof Narrow<Tables>
                        ]
                      )
                    : v,
                ])
              )
            );
    return {
      create: (cols) => injectFx([cols])[0],
      save: (_cols) => {
        const cols = Object.fromEntries(
          Object.entries(_cols)
            .filter(([_, v]) => typeof v !== "function")
            .map(([col, val]) => [
              col,
              !["id", "createdAt", "updatedAt"].includes(col) &&
              Table.columns[col].type === "JSON"
                ? JSON.stringify(val)
                : val,
            ])
        );
        return executeGetMiddleware(
          injectFx(
            parseJSON(
              (cols.id &&
              (
                this.db
                  .query(
                    `SELECT COUNT(*) AS count FROM ${table} WHERE id = $id;`
                  )
                  .get({ $id: cols.id }) as any
              ).count !== 0
                ? this.db
                    .query(
                      `UPDATE ${table} SET ${Object.keys(cols)
                        .filter((x) => x !== "id")
                        .map((x, i) => `${x} = $S_${x}`)
                        .join()} WHERE id = $id RETURNING *;`
                    )
                    .all(
                      Object.fromEntries([
                        ...Object.entries(cols)
                          .filter(([k]) => k !== "id")
                          .map(([k, v]) => [`$S_${k}`, v]),
                        ["$id", cols.id],
                      ])
                    )
                : this.db
                    .query(
                      `INSERT INTO ${table} ` +
                        (Object.keys(cols).length === 0
                          ? "DEFAULT VALUES;"
                          : `('${Object.keys(cols).join("','")}') VALUES (${arr(
                              Object.keys(cols).length,
                              (i) => `?${i}`
                            ).join()}) RETURNING *;`)
                    )
                    .all(...(Object.values(cols) as any))) as any
            )
          )
        );
      },
      delete: (opts) =>
        this.db
          .query(
            `DELETE FROM ${table} WHERE ${Object.keys(opts)
              .map((x, i) => `${x} = ?${i + 1}`)
              .join(" AND ")};`
          )
          .run(...(Object.values(opts) as any)),
      find: (opts) =>
        resolveRelations(
          executeGetMiddleware(
            injectFx(
              parseJSON(
                this.db
                  .query(
                    !opts
                      ? `SELECT * FROM ${table};`
                      : `SELECT ${
                          opts.select
                            ? opts.select.length === 0
                              ? ""
                              : opts.select.join()
                            : "*"
                        } FROM ${table}${
                          opts.where
                            ? ` WHERE ${Object.keys(opts.where)
                                .map((x, i) => `${x} = ?${i + 1}`)
                                .join(" AND ")}`
                            : ""
                        };`
                  )
                  .all(
                    ...((opts?.where ? Object.values(opts.where) : []) as any[])
                  ) as any[]
              )
            )
          ),
          opts?.resolve || ([] as any)
        ),
      findBy: (opts) =>
        injectFx(
          parseJSON(
            this.db
              .query(
                !opts
                  ? `SELECT * FROM ${table};`
                  : `SELECT * FROM ${table}${
                      opts
                        ? ` WHERE ${Object.keys(opts)
                            .map((x, i) => `${x} = ?${i + 1}`)
                            .join(" AND ")}`
                        : ""
                    };`
              )
              .all(...((opts ? Object.values(opts) : []) as any[])) as any[]
          )
        ),
    };
  };

  constructor(file: string, public readonly config: Config<T>) {
    this.db = new Database(file);
    Object.values(config.tables).some((x) =>
      Object.values(x.columns).some((y) => y.type === "REL")
    ) &&
      !(this.db.query("PRAGMA foreign_keys;").get() as any).foreign_keys &&
      this.db.query("PRAGMA foreign_keys = ON;").run();
    this.tables = Object.fromEntries(
      Object.entries(config.tables).map(
        ([table, opts]) =>
          this.createTable(table, opts as any) && [table, this.Col(table)]
      )
    ) as any;
  }
}

export default BunORM;
