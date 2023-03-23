import { BunORM } from "../index";

const db = new BunORM("db.sqlite", {
  tables: {
    roles: {
      columns: {
        name: {
          type: "TEXT",
        },
      },
    },
    users: {
      columns: {
        username: {
          type: "TEXT",
        },
        password: {
          type: "TEXT",
        },
        lastOnline: {
          type: "JSON",
          // Value doesn't matter since we only need
          // it to infer the type
          customDataType: {} as Date,
        },
        roles: {
          type: "REL",
          table: "roles",
        },
      },
      mw: {
        get: [
          (item: any) =>
            Object.assign(item, { lastOnline: new Date(item.lastOnline) }),
        ],
      },
      fx: {
        checkPassword: (item: any, pw: string) => "123" + pw === item.password,
        hashPassword: (item: any) => {
          // Please use bcrypt or something similar instead of this
          // This code is made just for this example and should not be used
          // since it's super unsafe
          item.password = "123" + item.password;
          return item;
        },
      },
    },
  },
});

// Try to type something by yourself
// Your IDE should autocomplete based on your db schema
// (On VSCode you might have to press STRG + Space after typing "db." to toggle autocomplete)

db.tables.roles.save({
  name: "admin",
});

db.tables.users.save(
  db.tables.users
    .create({
      username: "admin",
      password: "nimda",
      lastOnline: new Date(),
      roles: 1,
    })
    .hashPassword()
);

const admin = db.tables.users.find({
  where: {
    username: "admin",
  },
})[0];

admin.roles; // -> will be of type number since the relation is not resolved

const resolvedAdmin = db.tables.users.find({
  where: {
    username: "admin",
  },
  resolve: ["roles"],
})[0];

resolvedAdmin.roles[0].name;

const onlyUsernameAdmins = db.tables.users.find({
  select: ["username"],
});

// everything except username and the default attributes (id, createdAt, updatedAt and functions) will be undefined
onlyUsernameAdmins[0].username;

db.tables.users.save({
  id: 1,
  username: "newAdmin",
});

db.tables.users.delete({
  username: "newAdmin",
});
