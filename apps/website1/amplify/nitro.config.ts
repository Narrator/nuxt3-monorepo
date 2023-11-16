import { fileURLToPath } from "node:url";
import type { Nitro, NitroPreset } from "nitropack";
import { resolve } from "node:path";
import { writeFile } from "node:fs/promises";
import { joinURL } from 'ufo'
import { AmplifyDeployManifest, AmplifyRoute, AmplifyRouteTarget } from "./types";

export default <NitroPreset>{
  extends: "node-server",
  entry: fileURLToPath(new URL("entry.ts", import.meta.url)),
  output: {
    dir: "{{ rootDir }}/.amplify-hosting",
    serverDir: "{{ output.dir }}/compute/default",
    publicDir: "{{ output.dir }}/static{{ baseURL }}",
  },
  commands: {
    preview: "node ./compute/default/server.js",
  },
  hooks: {
    async compiled(nitro) {
      await writeAmplifyFiles(nitro);
    },
  },
};

async function writeAmplifyFiles(nitro: Nitro) {
  const outDir = nitro.options.output.dir

  // Generate routes
  const routes: AmplifyRoute[] = [];

  let hasWildcardPublicAsset = false;

  // @ts-expect-error
  if (nitro.options.awsAmplify?.imageOptimization) {
      // @ts-expect-error
    const { path, cacheControl } = nitro.options.awsAmplify?.imageOptimization;
    routes.push({
      path,
      target: {
        kind: "ImageOptimization",
        cacheControl,
      },
    });
  }

  const computeTarget = {
    kind: "Compute",
    src: "default",
  } as AmplifyRouteTarget;

  for (const publicAsset of nitro.options.publicAssets) {
    if (!publicAsset.baseURL || publicAsset.baseURL === "/") {
      hasWildcardPublicAsset = true;
      continue;
    }
    routes.push({
      path: `${publicAsset.baseURL!.replace(/\/$/, "")}/*`,
      target: {
        cacheControl:
          publicAsset.maxAge > 0
            ? `public, max-age=${publicAsset.maxAge}, immutable`
            : undefined,
        kind: "Static",
      },
      fallback: publicAsset.fallthrough ? computeTarget : undefined,
    });
  }
  if (hasWildcardPublicAsset) {
    routes.push({
      path: "/*.*",
      target: {
        kind: "Static",
      },
      fallback: computeTarget,
    });
  }
  routes.push({
    path: "/*",
    target: computeTarget,
    fallback:
      // @ts-expect-error
      hasWildcardPublicAsset && nitro.options.awsAmplify?.computeStaticFallback
        ? {
            kind: "Static",
          }
        : undefined,
  });

  // Prefix with baseURL
  for (const route of routes) {
    if (route.path !== "/*") {
      route.path = joinURL(nitro.options.baseURL, route.path);
    }
  }

  // Generate deploy-manifest.json
  const deployManifest: AmplifyDeployManifest = {
    version: 1,
    routes,
    // @ts-expect-error
    imageSettings: nitro.options.awsAmplify?.imageSettings || undefined,
    computeResources: [
      {
        name: "default",
        entrypoint: "server.js",
        runtime: "nodejs18.x",
      },
    ],
    framework: {
      name: "nitro",
      version: "0.0.0",
    },
  };
  await writeFile(
    resolve(outDir, "deploy-manifest.json"),
    JSON.stringify(deployManifest, null, 2)
  );

  // Write server.js (CJS)
  await writeFile(
    resolve(outDir, "compute/default/server.js"),
    `import("./index.mjs")`
  );
}
