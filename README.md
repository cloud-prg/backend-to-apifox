# backend-to-apifox

从 Express 风格后端**静态扫描** `router.get/post/...` 与 `conn.query(..., [parms.x])`，生成 **OpenAPI 3.0 JSON**，供 [Apifox](https://apifox.com) 等工具 **导入 → OpenAPI**。

## 安装（skills 生态）

```bash
npx skills add https://github.com/cloud-prg/backend-to-apifox
```

或只装到 Cursor / Claude Code 等（见 [vercel-labs/skills](https://github.com/vercel-labs/skills) 文档）：

```bash
npx skills add https://github.com/cloud-prg/backend-to-apifox -g -a cursor -y
```

## 生成 OpenAPI

在**你的业务项目根目录**执行（注意脚本路径在本仓库克隆后的位置）：

```bash
git clone https://github.com/cloud-prg/backend-to-apifox.git /tmp/backend-to-apifox
node /tmp/backend-to-apifox/scripts/scan-express-openapi.js \
  --dir ./sqlserver/api \
  --auto-mount \
  --server-url http://localhost:3000 \
  --out ./docs/openapi-from-routes.json
```

若已用 `npx skills add` 安装到本机 skills 目录，可把 `node` 后的路径换成你机器上的 `.../backend-to-apifox/scripts/scan-express-openapi.js`。

## 文档

技能说明见根目录 [`SKILL.md`](./SKILL.md)（供 Agent 阅读）；扩展说明见 [`references/framework-notes.md`](./references/framework-notes.md)。

## License

MIT
