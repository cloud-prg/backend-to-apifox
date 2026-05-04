#!/usr/bin/env node
/**
 * 静态扫描 express.Router 的 HTTP 方法 + 路径，并尽力从 conn.query(..., [parms.a, ...]) 提取 parms 字段名。
 * 输出 OpenAPI 3.0 JSON（Apifox 可导入）。
 */
"use strict";

const fs = require("fs");
const path = require("path");

/** 与常见 sqlserver/index.js 挂载一致：文件名 → Express app.use 前缀 */
function autoPrefixForFile(filePath) {
  const base = path.basename(filePath).replace(/\.(js|ts)$/, "");
  const map = {
    queryApi: "/api/query",
    insertApi: "/api/insert",
    deleteApi: "/api/delete",
    updateApi: "/api/update",
  };
  return map[base] || "";
}

function parseArgs(argv) {
  const out = {
    dir: null,
    files: null,
    outFile: null,
    serverUrl: "http://localhost:3000",
    pathPrefix: "",
    autoMount: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dir") out.dir = argv[++i];
    else if (a === "--files") out.files = argv[++i].split(",").map((s) => s.trim());
    else if (a === "--out") out.outFile = argv[++i];
    else if (a === "--server-url") out.serverUrl = argv[++i];
    else if (a === "--path-prefix") out.pathPrefix = argv[++i].replace(/\/$/, "");
    else if (a === "--auto-mount") out.autoMount = true;
    else if (a === "--help" || a === "-h") {
      console.log(
        `Usage: node scan-express-openapi.js [--dir DIR | --files a.js,b.js] [--out openapi.json] [--server-url URL] [--path-prefix /api/query] [--auto-mount]`
      );
      process.exit(0);
    }
  }
  return out;
}

function walkJsFiles(dir, acc = []) {
  const st = fs.statSync(dir);
  if (!st.isDirectory()) return acc;
  for (const name of fs.readdirSync(dir)) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const full = path.join(dir, name);
    const s = fs.statSync(full);
    if (s.isDirectory()) walkJsFiles(full, acc);
    else if (/\.(js|ts)$/.test(name)) acc.push(full);
  }
  return acc;
}

const ROUTE_RE = /router\.(get|post|put|delete|patch)\s*\(\s*["']([^"']+)["']/gi;

/** 在 router.METHOD("path" ... 的回调里找 conn.query( sql, [ ... parms.xxx ] */
function extractParmsFromBlock(block) {
  const qm = block.indexOf("conn.query");
  if (qm === -1) return [];
  const slice = block.slice(qm);
  const bracket = slice.indexOf("[");
  if (bracket === -1) return [];
  const rest = slice.slice(bracket + 1);
  let depth = 1;
  let i = 0;
  for (; i < rest.length && depth > 0; i++) {
    const c = rest[i];
    if (c === "[") depth++;
    else if (c === "]") depth--;
  }
  const inner = rest.slice(0, i - 1);
  const props = new Set();
  const propRe = /parms\.([a-zA-Z0-9_]+)/g;
  let m;
  while ((m = propRe.exec(inner))) props.add(m[1]);
  return [...props];
}

function slug(s) {
  return s.replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 80) || "route";
}

function buildSpec({ routes, serverUrl }) {
  const paths = {};
  const usedIds = new Set();
  for (const { method, routePath, parmNames, pathPrefix = "" } of routes) {
    const fullPath = (pathPrefix || "") + (routePath.startsWith("/") ? routePath : "/" + routePath);
    if (!paths[fullPath]) paths[fullPath] = {};
    let opId = `${method}_${slug(routePath)}`;
    while (usedIds.has(opId)) opId += "_";
    usedIds.add(opId);
    const op = {
      operationId: opId,
      summary: `${method.toUpperCase()} ${fullPath}`,
      responses: {
        "200": { description: "OK（需按业务在 Apifox 中补充 schema）" },
      },
    };
    const mLower = method.toLowerCase();
    if (mLower === "post" || mLower === "put" || mLower === "patch") {
      const props = {};
      for (const p of parmNames) props[p] = { type: "string", description: "从路由参数列表推断，类型待确认" };
      op.requestBody = {
        required: parmNames.length > 0,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: Object.keys(props).length ? props : undefined,
            },
          },
        },
      };
      if (!Object.keys(props).length) {
        op.requestBody.content["application/json"].schema = { type: "object", additionalProperties: true };
      }
    } else if (parmNames.length) {
      op.parameters = parmNames.map((name) => ({
        name,
        in: "query",
        schema: { type: "string" },
        description: "推断为 query 参数（若为 path 段请手工改）",
      }));
    }
    paths[fullPath][mLower] = op;
  }
  return {
    openapi: "3.0.3",
    info: {
      title: "Generated from Express routes",
      version: "0.0.1",
      description: "由 backend-to-apifox skill 脚本静态扫描生成；导入 Apifox 后请补全响应与精确类型。",
    },
    servers: [{ url: serverUrl }],
    paths,
  };
}

function scanFile(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  const routes = [];
  ROUTE_RE.lastIndex = 0;
  let m;
  while ((m = ROUTE_RE.exec(text))) {
    const method = m[1].toLowerCase();
    const routePath = m[2];
    const start = m.index;
    const tail = text.slice(start);
    const cbStart = tail.indexOf("(req, res)");
    const block = cbStart === -1 ? tail.slice(0, 800) : tail.slice(cbStart, cbStart + 2500);
    const parmNames = extractParmsFromBlock(block);
    routes.push({ method, routePath, parmNames, file: filePath });
  }
  return routes;
}

function main() {
  const args = parseArgs(process.argv);
  let files = [];
  if (args.files && args.files.length) files = args.files.map((f) => path.resolve(f));
  else if (args.dir) files = walkJsFiles(path.resolve(args.dir));
  else {
    console.error("Provide --dir or --files");
    process.exit(1);
  }
  const all = [];
  for (const f of files) {
    if (!fs.existsSync(f)) continue;
    const routes = scanFile(f);
    let prefix = "";
    if (args.autoMount) {
      prefix = autoPrefixForFile(f);
      if (!prefix) {
        console.warn("skip (no auto prefix for):", f);
        continue;
      }
    } else {
      prefix = args.pathPrefix || "";
    }
    for (const r of routes) {
      all.push({ ...r, pathPrefix: prefix });
    }
  }
  const spec = buildSpec({ routes: all, serverUrl: args.serverUrl });
  const json = JSON.stringify(spec, null, 2);
  if (args.outFile) {
    fs.mkdirSync(path.dirname(path.resolve(args.outFile)), { recursive: true });
    fs.writeFileSync(path.resolve(args.outFile), json, "utf8");
    console.error("Wrote", path.resolve(args.outFile), "routes:", all.length);
  } else {
    process.stdout.write(json);
  }
}

main();
