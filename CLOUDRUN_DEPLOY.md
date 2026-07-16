# 云托管正式环境部署说明

## 架构

- 小程序前端仍通过微信开发者工具上传、审核、发布。
- 云托管只部署正式后端接口，替代正式版里的云函数调用。
- 开发构建继续走云函数和 `test_results_dev`。
- 生产构建走云托管和 `test_results`。

## 云托管控制台配置

基础配置：

- Git 仓库：`liuxiaoan8998/sbti-miniapp`
- 分支：建议先用 `main`，稳定后可单独建 `prod` 分支
- 自动部署：发布前建议关闭，避免每次 push 自动影响正式后端
- 服务名称：和 `.env.production` 的 `TARO_APP_CLOUD_RUN_SERVICE` 保持一致
- 访问端口：`80`
- 服务端口：`80`

构建设置：

- 构建方式：Dockerfile
- 构建目录：`cloudrun`
- Dockerfile 路径：`Dockerfile`

环境变量：

```text
NODE_ENV=production
COLLECTION_NAME=test_results
TCB_ENV_ID=<你的云托管正式环境ID>
```

如果控制台已经自动注入了环境 ID，`TCB_ENV_ID` 也可以不填；但显式配置更清楚。

## 小程序生产环境变量

在 `.env.production` 里确认：

```text
TARO_APP_BACKEND_MODE=cloudrun
TARO_APP_CLOUD_RUN_ENV_ID=<你的云托管正式环境ID>
TARO_APP_CLOUD_RUN_SERVICE=<你的云托管服务名>
TARO_APP_TEST_RESULTS_COLLECTION=test_results
```

当前配置已按截图使用 `stbi-prod`。如果你还没创建服务并想改成 `sbti-prod`，需要同时修改控制台服务名和 `.env.production` 的 `TARO_APP_CLOUD_RUN_SERVICE`。

## 数据库集合

云托管部署不会自动创建数据库集合。

请在云托管正式环境关联的云数据库里手动创建集合：

```text
test_results
```

开发环境里保留：

```text
test_results_dev
```

## 发布前检查

1. 云托管服务部署成功，访问 `/healthz` 返回 `ok: true`。
2. `.env.production` 已填云托管环境 ID 和服务名。
3. 执行 `npm run build:weapp`。
4. 用微信开发者工具上传体验版。
5. 真机完成一次测试，确认数据进入正式环境的 `test_results`。
6. 确认无误后再提交审核。
