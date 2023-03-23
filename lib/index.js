import { Database } from "bun:sqlite";
const arr = (length, map) => new Array(length).fill(0).map((_, i) => map(i + 1));
export class BunORM {
    config;
    tables;
    db;
    createTable = (table, opts) => (typeof this.db.run(`CREATE TABLE IF NOT EXISTS ${table} ('id' INTEGER PRIMARY KEY AUTOINCREMENT,${Object.entries(opts.columns)
        .filter(([_, opts]) => opts.type !== "REL")
        .map(([col, opts]) => [
        `'${col}'`,
        opts.type === "JSON" ? "TEXT" : opts.type,
        opts.default && `DEFAULT ${opts.default}`,
        opts.unique && "UNIQUE",
        !opts.nullable && "NOT NULL",
    ]
        .filter((x) => !!x)
        .join(" "))
        .join()}${Object.entries(opts.columns).filter(([_, opts]) => opts.type === "REL").length
        ? "," +
            Object.entries(opts.columns)
                .filter(([_, opts]) => opts.type === "REL")
                .map(([col, opts]) => [`'${col}' INTEGER`, !opts.nullable && "NOT NULL"]
                .filter((x) => !!x)
                .join(" "))
                .join()
        : ""},'updatedAt' DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,'createdAt' DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL${Object.entries(opts.columns).filter(([_, opts]) => opts.type === "REL").length
        ? "," +
            Object.entries(opts.columns)
                .filter(([_, opts]) => opts.type === "REL")
                .map(([col, opts]) => `FOREIGN KEY ('${col}') REFERENCES ${opts.table} (id)`)
                .join()
        : ""});`) !== "number");
    Col = (table) => {
        const Table = this.config.tables[table], injectFx = (rows, table = Table) => rows.map((x) => Object.assign(x, Object.fromEntries(Object.entries(table.fx || {}).map(([k, v]) => [
            k,
            (...args) => v(x, ...args),
        ])))), parseJSON = (rows, table = Table) => Object.values(table.columns).every((x) => x.type !== "JSON")
            ? rows
            : rows.map((row) => Object.fromEntries(Object.entries(row).map(([k, v]) => [
                k,
                table.columns[k] && table.columns[k].type === "JSON"
                    ? JSON.parse(v)
                    : v,
            ]))), executeGetMiddleware = (rows, table = Table) => !Array.isArray(table.mw?.get) ||
            table.mw.get.some((mw) => typeof mw !== "function")
            ? rows
            : rows.map((row) => {
                table.mw.get.forEach((mw) => (row = mw(row)));
                return row;
            }), resolveRelations = (rows, keys) => !keys.length ||
            Object.values(Table.columns).every((x) => x.type !== "REL")
            ? rows
            : rows.map((row) => Object.fromEntries(Object.entries(row).map(([k, v]) => [
                k,
                Table.columns[k] && Table.columns[k].type === "REL"
                    ? executeGetMiddleware(injectFx(parseJSON(this.db
                        .query(`SELECT * FROM ${Table.columns[k].table} WHERE id = $id`)
                        .all({ $id: v }), this.config.tables[Table.columns[k]
                        .table]), this.config.tables[Table.columns[k]
                        .table]), this.config.tables[Table.columns[k]
                        .table])
                    : v,
            ])));
        return {
            create: (cols) => injectFx([cols])[0],
            save: (_cols) => {
                const cols = Object.fromEntries(Object.entries(_cols)
                    .filter(([_, v]) => typeof v !== "function")
                    .map(([col, val]) => [
                    col,
                    !["id", "createdAt", "updatedAt"].includes(col) &&
                        Table.columns[col].type === "JSON"
                        ? JSON.stringify(val)
                        : val,
                ]));
                return executeGetMiddleware(injectFx(parseJSON((cols.id &&
                    this.db
                        .query(`SELECT COUNT(*) AS count FROM ${table} WHERE id = $id;`)
                        .get({ $id: cols.id }).count !== 0
                    ? this.db
                        .query(`UPDATE ${table} SET ${Object.keys(cols)
                        .filter((x) => x !== "id")
                        .map((x, i) => `${x} = $S_${x}`)
                        .join()} WHERE id = $id RETURNING *;`)
                        .all(Object.fromEntries([
                        ...Object.entries(cols)
                            .filter(([k]) => k !== "id")
                            .map(([k, v]) => [`$S_${k}`, v]),
                        ["$id", cols.id],
                    ]))
                    : this.db
                        .query(`INSERT INTO ${table} ` +
                        (Object.keys(cols).length === 0
                            ? "DEFAULT VALUES;"
                            : `('${Object.keys(cols).join("','")}') VALUES (${arr(Object.keys(cols).length, (i) => `?${i}`).join()}) RETURNING *;`))
                        .all(...Object.values(cols))))));
            },
            delete: (opts) => this.db
                .query(`DELETE FROM ${table} WHERE ${Object.keys(opts)
                .map((x, i) => `${x} = ?${i + 1}`)
                .join(" AND ")};`)
                .run(...Object.values(opts)),
            find: (opts) => resolveRelations(executeGetMiddleware(injectFx(parseJSON(this.db
                .query(!opts
                ? `SELECT * FROM ${table};`
                : `SELECT ${opts.select
                    ? opts.select.length === 0
                        ? ""
                        : opts.select.join()
                    : "*"} FROM ${table}${opts.where
                    ? ` WHERE ${Object.keys(opts.where)
                        .map((x, i) => `${x} = ?${i + 1}`)
                        .join(" AND ")}`
                    : ""};`)
                .all(...(opts?.where ? Object.values(opts.where) : []))))), opts?.resolve || []),
            findBy: (opts) => injectFx(parseJSON(this.db
                .query(!opts
                ? `SELECT * FROM ${table};`
                : `SELECT * FROM ${table}${opts
                    ? ` WHERE ${Object.keys(opts)
                        .map((x, i) => `${x} = ?${i + 1}`)
                        .join(" AND ")}`
                    : ""};`)
                .all(...(opts ? Object.values(opts) : [])))),
        };
    };
    constructor(file, config) {
        this.config = config;
        this.db = new Database(file);
        Object.values(config.tables).some((x) => Object.values(x.columns).some((y) => y.type === "REL")) &&
            !this.db.query("PRAGMA foreign_keys;").get().foreign_keys &&
            this.db.query("PRAGMA foreign_keys = ON;").run();
        this.tables = Object.fromEntries(Object.entries(config.tables).map(([table, opts]) => this.createTable(table, opts) && [table, this.Col(table)]));
    }
}
export default BunORM;
