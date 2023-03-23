<p align="center">
  <a href="https://github.com/deadlinecode/BunORM"><img src="Logo.svg" alt="Logo" height=70></a>
  <br />
</p>
<hr />
<br />

## What is BunORM 🤔

BunORM is a ORM implementation for bun:sqlite that makes it easy to manage your bun:sqlite database by not only providing a simple to use interface, but also really good typescript support
<br />
(This package is still in an very early state so dont expect to much lol)
<br />
<br />

## Features 😯

1. ⚡ BLAZINGLY FAST
2. 😮 Tiny no-dependencies package
2. 🔤 Bestest autocompletion due to really good typescript types
3. 💻 Easy to use interface inspired by <a href="https://typeorm.io">TypeORM</a>
4. Supports following cool features out of the box:
    - Custom data types like "JSON" with full type support (so you dont have to cast 😉)
    - Middleware support (get/set)
    - Custom functions that will be added to the row objects
    - Relations between tables (also with type support)
    - Automatic Id, createdAt and updatedAt properties
<br />
<br />

## Installation

Stable release
```bash
bun install bunorm
```

Dev release
```bash
bun install https://github.com/deadlinecode/BunORM
```
<br />

## Usage

Just import the package
```ts
import { BunORM } from "bunorm";
```

and define your table like this
```ts
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
                userData: {
                    type: "JSON",
                },
            },
        },
    },
});
```
Then use it ^~^
```ts
const users = db.tables.users.find();
```
Wait thats not all!!!
<br />
BunORM can do so much more for you 😎
<br />
Just take a look at the <a href="https://github.com/deadlinecode/BunORM/tree/master/src/example">example folder</a>
<br />
<br />

## I wanna tweak it for my own use case ÒvÓ

Sure thing! You can tinker with the package like this:
1. Clone the repo
   ```bash
   git clone https://github.com/deadlinecode/BunORM .
   ```
2. Change stuff you wanna change
3. Build the package
   ```bash
   npm build
   ```
4. Install it in another nodejs project from wherever you saved it on your disk
   ```bash
   # inside your other project
   npm install /path/to/the/repo/named/BunORM
   ```
   or alternatively run the example
   ```bash
   # inside the package folder
   bun run src/example/example.ts
   ``` 
<br/>
<br/>

## Found a bug or want to contribute because you're a cool person?

If you found an issue or would like to submit an improvement, please [open an issue here](https://github.com/deadlinecode/BunORM/issues/new/choose).

If you actually have some spare time and want to contribute, feel free to open a PR and please don't forget to (create and) link the corresponding issue. <br/>
It's important so we can keep track of all the issues and feature requests that got resolved by PRs.
<br/>
<br/>
Please!
<br/>
Please! Please! Please! Please! Please use the dev branch when making changes and PRs. I won't accept any changes to the master branch.
<br/>
<br/>

## Known issues/feature requests (WIP)
- [ ] Cleaning up the messy shit i call "code"
- [ ] Adding support for multiple relation types (one-to-many, one-to-one, etc.)
- [ ] Support relations both ways if one is set
- [ ] Bulk actions for everything
- [x] `db.tables.[table].save` should return the saved or updated entity
<br/>
<br/>

## You need help or want to exchange about things

Well bad for you.<br/>
Jk. <br/>
I currently don't have a discord but you can find me on the [bun discord server](https://discord.gg/SPjMSDfQ) or just [dm me on discord](https://discord.com/users/330361029366382594)

See ya over there and thanks for using my package ^^ <3