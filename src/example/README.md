<p align="center">
  <a href="https://github.com/deadlinecode/BunORM"><img src="../../Logo.svg" alt="Logo" height=70></a>
  <br />
</p>
<hr />
<br />

## Example usage

In this folder you can find [the example file](https://github.com/deadlinecode/BunORM/tree/master/src/example/example.ts) which shows you all features of BunORM.

You can look at it or keep reading below this text to find out what awesome things BunORM can do for you.
<br />
<br />

## How to use BunORM

(If you don't understand or struggle with the following explanation you can just look into the example since it's the same code used here)

### Initialize

Import BunORM

```ts
import { BunORM } from "bunorm";
```

Make a new DB instance

```ts
const db = new BunORM("db.sqlite", {
  tables: {},
});
```

The first parameter is the db file name
<br />
This will be passed directly to the constructor of bun:sqlites Database
<br />
<br />
The second parameter is the config object
<br />
This will hold your database configuration
<br />
<br />
<br />
Tables are defined under `config.tables[tableName]`
<br />
<br />
Columns are defined under `config.tables[tableName].columns[columnName]`
<br />
<br />
The value of `config.tables[tableName].columns[columnName]` is a object containing the configuration for the column.
<br />
These are the variations of the config for the columns that are possible:

```ts
{
  type: "NULL" | "INTEGER" | "REAL" | "TEXT" | "BLOB",
  default: string, // --> Is always a string since it gets inserted right into the sql statement
  nullable: boolean,
  unique: boolean
}
```

Or

```ts
{
  type: "JSON",
  customDataType: any, // --> Value won't be used | only the type will be used (see example.ts)
  default: string, // --> Is always a string since it gets inserted right into the sql statement
  nullable: boolean,
  unique: boolean
}
```

Or

```ts
{
  type: "REL",
  table: string, // --> String represents table name
  nullable: boolean
}
```

<br />

Another thing you can configure are middleware functions on each table (get/set)
<br />
They can be defined under `table.mw["get" or "set"]`
<br />
<br />
The values of the get and set keys are array of functions which take a item as first parameter (which is a row item) and return the new altered item.
<br />
This could look something like this

```ts
{
  mw: {
    get: [
      (item: any) =>
        Object.assign(item, { lastOnline: new Date(item.lastOnline) }),
    ];
  }
}
```

This is useful for example when you have a Date object in a JSON type column.
<br />
Because the Date type would get converted into a string by JSON.stringify you can use the middleware function above to covert it on a get back into a Date object
<br />
<br />
Another cool thing is that you can add functions to your row items by defining `table.fw[functionName]`
<br />
Just as bevore the first attribute is the current row item
<br />
After that you can add your own arguments which will have to be filled in when the function is called on the row item
<br />
This could look something like this

```ts
{
  fx: {
    checkPassword: (item: any, pw: string) => "123" + pw === item.password,
  }
}
```

This is usefull for example when having a user table and you want to check if some password matches with the one inside your db.
<br />
<br />

### Use

To use the database we can just access everything by using the constant `db` we created earlier
<br />
<br />
BunORM exposes not only your tables so you can use them but also the bun:sqlite db instance (via `db.db`) and your config (via `db.config`)
<br />
<br />
To use your tables and the data in them you can just do the following

```ts
db.tables[TableName];
```

You can use following functions on your tables

```ts
// Gives back an array of rows that match the search query
// All parameters are optional
//
// "where" defines the query on which to search the database
// "select" only returns what you select
// "resolve" resolves relations between tables
db.tables[TableName].find({
  where: {
    username: "admin",
  },
  select: ["username"],
  resolve: ["role"],
});

// Same as the above function but the parameters is the "where" object
db.tables[TableName].findBy({
  username: "admin",
});

// Creates a new row with all the helper functions from "fx" (without saving it in the database)
db.tables[TableName].create({
  username: "admin",
  password: "nimda",
  lastOnline: new Date(),
  roles: 1,
});

// Save a row in the database
// Parameter can be a object containing the data or the result of the create function
db.tables[TableName].save({
  username: "admin",
});

// Call save with id parameter to update
// It also makes all properties partial/optional
db.tables[TableName].save({
  id: 1,
  username: "newAdmin",
});

// Delete a row from the database based on the parameters
db.tables.users.delete({
  username: "newAdmin",
});
```

That should be it
If you have any more issues please contact me [based on the footer in the main README](https://github.com/deadlinecode/BunORM#you-need-help-or-want-to-exchange-about-things)