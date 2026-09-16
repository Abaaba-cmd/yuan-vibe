# 代号鸢公开演示版

这是一个可独立运行的 React + Vite 项目，已从 Aime 工作区整理为适合 GitHub、Vercel 与 Codex 使用的标准代码仓库。

## 当前功能

- 招募记录、卡池统计与示例数据
- 编年录时间轴与详情
- 游客浏览与受保护操作提示
- 邮箱验证码登录界面预览
- 浏览器本地存储；公开演示数据与原个人记录使用不同的存储空间

> 当前邮箱登录仅为界面与状态演示，尚未连接真实邮件服务或 Supabase。

## 本地运行

要求：Node.js 20 或更新版本，推荐使用 pnpm。

```bash
corepack enable
pnpm install
pnpm dev
```

根据终端提示，在浏览器打开本地地址。

## 构建检查

```bash
pnpm build
pnpm preview
```

生产文件会生成在 `dist/`。

## 用 Codex 继续开发

在终端进入项目目录后启动 Codex：

```bash
cd yuan-vibe-codex-ready
codex
```

建议第一次给 Codex 的指令：

```text
先阅读 README.md 和 AGENTS.md，再检查当前 React/Vite 项目。
不要重新设计页面，不要擅自修改文案和业务数据。
完成修改后运行 pnpm build，并说明改动文件。
```

## 上传 GitHub

先在 GitHub 创建一个空仓库，然后在本目录执行：

```bash
git remote add origin https://github.com/<你的用户名>/<仓库名>.git
git branch -M main
git push -u origin main
```

如果使用 SSH，把远程地址换成 GitHub 提供的 SSH 地址。

## 部署 Vercel

1. 登录 Vercel。
2. 选择 **Add New → Project**。
3. 导入刚才的 GitHub 仓库。
4. Framework Preset 选择 `Vite`。
5. Build Command 使用 `pnpm build`。
6. Output Directory 使用 `dist`。
7. 点击 Deploy。

部署完成后会获得可从公司外部访问的 `*.vercel.app` 地址。

## 数据说明

公开演示版只内置示例记录。访问者在页面中产生的演示数据只保存在其自己的浏览器 `localStorage` 中，不会上传或分享给其他访问者。清除浏览器站点数据后，本地修改会消失并恢复为示例数据。

如果未来接入 Supabase，应为用户数据表启用 Row Level Security，并确保任何服务端密钥都不进入前端代码或 GitHub。
