import fs from "node:fs";
import { createServer } from "vite";
const server = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
});
let cloud;
try {
  const backend = await server.ssrLoadModule("/src/backend.ts");
  cloud = backend.cloud;
  const auth = await cloud.auth.signInWithPassword(
    JSON.parse(fs.readFileSync(".env.audit-test", "utf8")),
  );
  if (auth.error) throw Error("Synthetic sign-in failed");
  const table = await cloud
    .from("calnutrifit_progress_photos")
    .select("id")
    .limit(1);
  console.log(
    JSON.stringify({
      photoTableAvailable: !table.error,
      errorCode: table.error?.code || null,
    }),
  );
  const bucket = await cloud.storage
    .from("calnutrifit-progress")
    .list(auth.data.user.id, { limit: 1 });
  console.log(
    JSON.stringify({
      storageListAvailable: !bucket.error,
      errorCode: bucket.error?.statusCode || null,
    }),
  );
} finally {
  if (cloud) await cloud.auth.signOut({ scope: "local" });
  await server.close();
}
