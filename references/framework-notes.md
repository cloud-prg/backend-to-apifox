# 非 Express 或非常规定位


| 情况              | 建议                                         |
| --------------- | ------------------------------------------ |
| NestJS          | 使用官方 `@nestjs/swagger` 生成 spec，再导入 Apifox。 |
| Fastify         | `fastify-swagger` 导出 JSON。                 |
| Spring / JAX-RS | 使用 `springdoc-openapi` 或扫描注解的既有工具。         |
| Go chi/gin      | 使用 `swag` 或 swaggo，或写适配本脚本的正则（可 fork 脚本）。  |
| 仅 RPC（gRPC）     | 不适用本 skill；Apifox 走 protobuf 导入流程。         |


本 skill 自带脚本以 **字符串级** 解析 `router.(method)("path"` 为主；复杂 AST 需求建议改用 `swagger-jsdoc` 或框架内置 OpenAPI。