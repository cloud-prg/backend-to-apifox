# backend-to-apifox

[![skills.sh](https://skills.sh/b/cloud-prg/backend-to-apifox)](https://skills.sh/cloud-prg/backend-to-apifox)

把 Express 风格后端里的路由定义（`router.get/post/...`）和常见 SQL 参数模式（如 `conn.query(..., [parms.x])`）做静态扫描，输出 Apifox 可直接导入的 **OpenAPI 3.0 JSON**。

适用于这类场景：

- 只有后端路由代码，没有手写 Swagger/OpenAPI 文档
- 需要把历史接口快速导入 Apifox 做管理和联调
- 想先生成“可用骨架”，再在 Apifox 里补齐 schema 与示例

## 项目能力（详细描述）

- 扫描 `express.Router` 常见写法，提取 HTTP Method + Path
- 支持 `--auto-mount`：按 `queryApi.js/insertApi.js` 自动映射 `/api/query` 等前缀
- 尝试从 `conn.query(sql, [parms.xxx])` 推断请求参数名，写入 `requestBody`
- 生成标准 OpenAPI 3.0 文件，可直接导入 Apifox
- 提供最小假设策略：无法可靠推断时保留空 object，避免错误“瞎猜类型”

## 安装（skills 生态）

```bash
npx skills add https://github.com/cloud-prg/backend-to-apifox
```

或只装到 Cursor / Claude Code 等（见 [vercel-labs/skills](https://github.com/vercel-labs/skills) 文档）：

```bash
npx skills add https://github.com/cloud-prg/backend-to-apifox -g -a cursor -y
```

## 快速开始

在你的业务后端项目根目录执行（脚本路径指向本仓库）：

```bash
node /path/to/backend-to-apifox/scripts/scan-express-openapi.js \
  --dir ./sqlserver/api \
  --auto-mount \
  --server-url http://localhost:3000 \
  --out ./docs/openapi-from-routes.json
```

导入到 Apifox：

1. 打开 Apifox 项目
2. 选择「导入」->「OpenAPI」
3. 选择 `openapi-from-routes.json`

## 安装与运行说明（完整）

- **方式 A：直接克隆仓库使用脚本**

  ```bash
  git clone https://github.com/cloud-prg/backend-to-apifox.git
  node ./backend-to-apifox/scripts/scan-express-openapi.js --help
  ```

- **方式 B：通过 skills 安装**

  ```bash
  npx skills add https://github.com/cloud-prg/backend-to-apifox
  ```

  安装后按你的本机 skill 安装路径调用 `scripts/scan-express-openapi.js`。

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

### 常用参数

- `--dir <path>`：递归扫描目录下 `.js/.ts`
- `--files a.js,b.js`：只扫描指定文件（与 `--dir` 二选一）
- `--out <file>`：输出 OpenAPI JSON 文件路径
- `--server-url <url>`：写入 OpenAPI `servers[0].url`
- `--path-prefix <prefix>`：统一加前缀（如 `/api/query`）
- `--auto-mount`：按文件名自动推断挂载前缀（推荐）

## 限制与边界

- 这是“快速骨架生成器”，不替代完整手写 schema
- 动态拼接路径可能无法被静态扫描完整识别
- 中间件注入/全局前缀需通过参数显式补充

## 在 skills.sh 上被发现

`skills.sh` 当前是基于仓库 + 安装统计的目录模式，不是网页表单上传。建议：

1. 保持 `SKILL.md` 与 `README.md` 清晰可读
2. 在团队或社区中使用并传播安装命令
3. 当用户通过 `npx skills add cloud-prg/backend-to-apifox` 安装后，会逐步出现在目录/榜单

## 仓库结构

```text
.
├── SKILL.md
├── README.md
├── scripts/
│   └── scan-express-openapi.js
└── references/
    └── framework-notes.md
```

## 文档

技能说明见根目录 [`SKILL.md`](./SKILL.md)（供 Agent 阅读）；扩展说明见 [`references/framework-notes.md`](./references/framework-notes.md)。

## License

MIT
