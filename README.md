# AI QA Assistant

一个基于 Qwen-Max 大模型的智能问答应用，提供流畅的对话体验和准确的答案。

![](https://img.alicdn.com/imgextra/i1/O1CN01aq4kNV1GAbVwCqhm3_!!6000000000582-0-tps-1980-970.jpg)

## 🚀 在线体验

访问 [rag.kouka.tech](https://rag.kouka.tech) 即可开始对话。

## ✨ 功能特点

- 💬 流式回答：实时返回 AI 响应，提供打字机般的流畅体验
- 🎯 准确性高：基于阿里云百炼平台的 RAG (检索增强生成) 技术
- 🎨 优雅界面：采用 Chakra UI v3 构建的现代化界面
- ⚡ 快速响应：通过 Cloudflare Pages + Workers 实现全球边缘部署

## 🛠️ 技术栈

- **前端框架:** React + TypeScript
- **UI 组件:** Chakra UI v3
- **AI 模型:** 阿里云百炼平台 Qwen-Max
- **部署平台:** Cloudflare Pages + Workers
- **开发工具:** Vite

## 🎯 本地开发

1. 克隆项目
```bash
git clone https://github.com/Suixinlei/qwen-rag-pipeline.git
cd qwen-rag-pipeline
```

2. 安装依赖

```bash
npm install
```

3. 启动开发服务器 （前端）

```bash
npm run dev
```

4. 启动边缘计算本地开发（需要本地设置 .dev.vars）

```bash
npm run worker:dev
```

## 📦 部署

本项目使用 Cloudflare Pages 进行部署：

1. Fork 本仓库
2. 在 Cloudflare Pages 中创建新项目
3. 连接你的 GitHub 仓库
4. 配置构建命令：
   ```
   构建命令：npm run build
   构建输出目录：dist
   ```
5. 配置环境变量
6. 部署完成

## 🔑 环境变量

```env
DASHSCOPE_API_KEY=your_api_key
```

## 🤝 贡献指南

欢迎提交 Pull Request 或创建 Issue！

## 📄 许可证

MIT License

## 👤 作者

- GitHub: [@Suixinlei](https://github.com/Suixinlei)

## 🙏 致谢

- [Qwen-Max](https://dashscope.aliyun.com) - 提供强大的 AI 模型支持
- [Chakra UI](https://chakra-ui.com) - 优秀的 UI 组件库
- [Cloudflare](https://cloudflare.com) - 可靠的部署平台