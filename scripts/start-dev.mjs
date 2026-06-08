import { spawn } from "node:child_process";

const host = "127.0.0.1";
const port = "5173";
const url = `http://${host}:${port}/`;

async function isServerAlreadyRunning() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 800);

  try {
    const response = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
    });

    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

function keepTaskAlive() {
  console.log(`Dev server already running at ${url}`);
  console.log("Use Ctrl+C to close this watcher task.");

  setInterval(() => {
    // Keep VS Code background tasks alive when another terminal owns Vite.
  }, 60_000);
}

function startVite() {
  const vite = spawn(
    "npx",
    ["vite", "--host", host, "--port", port, "--strictPort"],
    {
      stdio: "inherit",
      shell: true,
    },
  );

  vite.on("exit", (code) => {
    process.exit(code ?? 0);
  });
}

if (await isServerAlreadyRunning()) {
  keepTaskAlive();
} else {
  startVite();
}
