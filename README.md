# Scalable Nuxt 3 Monorepos with PNPM Workspaces

Read more:

- [Nuxt Website](https://nuxt.com/)
- [Nuxt Layers](https://nuxt.com/docs/getting-started/layers)
- [Vue School Article](https://vueschool.io/articles/vuejs-tutorials/scalable-nuxt-3-monorepos-with-pnpm-workspaces/) (**Outdated!**)

Install packages:

```shell
pnpm i
```

Start dev mode:

```shell
pnpm run -r dev
```

Build applications:

```shell
pnpm run -r build
```

Start specific application

```shell
pnpm --filter website1 run dev
pnpm --filter website2 run dev
```


