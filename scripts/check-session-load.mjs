import fs from "node:fs";
import { createServer } from "vite";
const server = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
});
let backend;
try {
  backend = await server.ssrLoadModule("/src/backend.ts");
  const start = performance.now();
  const login = await backend.cloud.auth.signInWithPassword(
    JSON.parse(fs.readFileSync(".env.audit-test", "utf8")),
  );
  if (login.error) throw Error("Synthetic sign-in failed");
  const signedIn = performance.now();
  const a = backend.loadJournal(login.data.user.id),
    b = backend.loadJournal(login.data.user.id);
  if (a !== b) throw Error("Concurrent loads were not shared");
  const journal = await a;
  console.log(
    JSON.stringify({
      signInMs: Math.round(signedIn - start),
      journalLoadMs: Math.round(performance.now() - signedIn),
      sharedConcurrentRequest: true,
      loaded: !!journal.preferences,
    }),
  );
} finally {
  await backend?.cloud.auth.signOut({ scope: "local" });
  await server.close();
}
