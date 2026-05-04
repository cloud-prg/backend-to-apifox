---

## name: backend-to-apifox
description: |
  从后端仓库扫描 Express（或类似）路由定义，生成 Apifox 可导入的 OpenAPI 3.0 JSON/YAML。
  当用户提到「接口文档导入 Apifox」「从路由生成 OpenAPI」「扫 router.post 导出 API」「Postman/OpenAPI 同步」「swagger 没有手写路由怎么出文档」时使用本 skill。
  也适用于「把 sqlserver/api 里接口列成 openapi」这类具体路径场景。若项目不是 Express 手写 router，先读 references/framework-notes.md 再决定扩展方式。

# 后端路由 → Apifox 可导入格式（OpenAPI 3）

## 目标

把代码里已经写好的 **HTTP 方法、URL 路径、（尽力推断的）请求参数名**，整理成 **OpenAPI 3.0** 文件。Apifox 支持：**导入 → OpenAPI**（JSON 或 YAML）。

这不是调用 Apifox 云端 API，而是生成 **标准文件**，由你在 Apifox 里一键导入。

## 何时读取扩展

- 框架不是 Express / 不是 `router.get/post` 写法 → 读 `references/framework-notes.md`。
- 需要自定义挂载前缀、过滤文件 → 用下面 CLI 参数。

## 推荐流程（按顺序执行）

1. **确认技术栈**：本仓库默认可扫 `express.Router` + `router.post('/path'` 形式（与 `sqlserver/api/*.js` 一致）。
2. **运行脚本**（在目标项目根目录）。**推荐**对 `queryApi.js` / `insertApi.js` 这类与 `app.use('/api/query', …)` 一一对应的目录使用 `**--auto-mount`**（按文件名自动加 `/api/query` 等前缀）：

```bash
node ~/.agents/skills/backend-to-apifox/scripts/scan-express-openapi.js \
  --dir ./sqlserver/api \
  --auto-mount \
  --server-url http://localhost:3000 \
  --out ./docs/openapi-from-routes.json
```

若脚本放在其他路径，把 `node` 后的路径换成该 skill 目录下的 `scripts/scan-express-openapi.js`。

**仅扫单个路由文件且自定义前缀**时，不用 `--auto-mount`，改用 `--files ./sqlserver/api/queryApi.js --path-prefix /api/query`。

1. **打开 Apifox**：项目 → **导入** → 选择 **OpenAPI** → 选中生成的 `openapi-from-routes.json`。
2. **在 Apifox 里补全**：示例值、响应 schema、鉴权头（如 `Authorization`）、环境变量（base URL）。脚本生成的是**骨架**，避免误猜业务字段类型。

## CLI 参数说明


| 参数                       | 含义                                                                                                                                           |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `--dir <path>`           | 扫描目录（递归 `.js` / `.ts`，跳过 `node_modules`）。                                                                                                    |
| `--files a.js,b.js`      | 只扫指定文件（逗号分隔），与 `--dir` 二选一。                                                                                                                  |
| `--out <file>`           | 输出 OpenAPI 3 JSON 路径（默认 stdout）。                                                                                                             |
| `--server-url <url>`     | `servers[0].url`，如 `http://localhost:3000`。                                                                                                  |
| `--path-prefix <prefix>` | 拼在每个路径前，如 `/api/query`（**不要**末尾斜杠）。与 `--dir` 联用时作用于**目录内所有文件**；多类路由请优先用 `--auto-mount`。                                                      |
| `--auto-mount`           | 按文件名推断前缀：`queryApi`→`/api/query`，`insertApi`→`/api/insert`，`deleteApi`→`/api/delete`，`updateApi`→`/api/update`（与常见 `sqlserver/index.js` 一致）。 |


## 脚本产出内容说明

- 每个匹配到的路由 → `paths` 下一项，`operationId` 由方法+路径 slug 生成。
- 请求体：若回调里能解析到 `conn.query(sql, [ parms.x, parms.y ])` 中的 `parms.`* 名字，则写入 `requestBody` 里 `application/json` 的 `properties`（**一律 string**，占位用）。
- 解析不到的：仍生成路径与 method，请求体为 **空 object** 或通用 `object`，避免瞎编类型。

## 限制（务必告知使用者）

- **不能替代**手写 Swagger 的完整类型与响应；适合「从已有路由快速出目录」。
- **动态路径**（``/user/${id}``）若代码里用变量拼路径，静态扫描会漏，需手工补。
- **中间件、全局前缀**若不在同一文件，依赖你传入正确的 `--path-prefix` / `--server-url`。

## 与 Apifox 的衔接话术（给用户复制）

> 已生成 OpenAPI 3 JSON。请在 Apifox：**导入 → OpenAPI 3.0** 选择该文件；导入后在「环境」里把服务地址设为实际后端地址。

