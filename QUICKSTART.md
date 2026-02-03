# 🎯 手把手部署指南：从零开始上线系统

本指南假设你是初次部署，会详细解释每一步操作。

---

## 📌 首先理解：这些文件是什么？

| 文件 | 作用 | 你需要做什么 |
|------|------|-------------|
| `frontend/src/App.jsx` | 前端主界面代码 | 需要构建后才能运行 |
| `backend/server.js` | 后端API服务器 | 直接用 Node.js 运行 |
| `*.html` 预览文件 | 仅用于看效果演示 | **不用于生产部署** |
| `package.json` | 依赖清单 | npm 会根据它安装依赖 |
| `.md` 文件 | 说明文档 | 阅读参考 |

---

## 🖥️ 第一部分：本地开发测试（在你的电脑上）

### 步骤 1：准备开发环境

**1.1 安装 Node.js**
- 访问 https://nodejs.org
- 下载 LTS 版本（推荐 20.x）
- 安装后打开终端验证：
```bash
node --version   # 应显示 v20.x.x
npm --version    # 应显示 10.x.x
```

**1.2 安装 MongoDB**
- 访问 https://www.mongodb.com/try/download/community
- 下载安装 MongoDB Community Server
- 或者使用 Docker（更简单）：
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

**1.3 安装代码编辑器**
- 推荐 VS Code: https://code.visualstudio.com

---

### 步骤 2：获取项目代码

**方式A：直接使用我提供的文件**
将 `student-feedback-system` 文件夹下载到你的电脑，比如放在 `D:\projects\` 下

**方式B：从 GitHub 克隆（如果你已上传）**
```bash
git clone https://github.com/你的用户名/buct-feedback-system.git
cd buct-feedback-system
```

---

### 步骤 3：启动后端服务

打开终端（命令提示符/PowerShell/Terminal），执行：

```bash
# 1. 进入后端目录
cd student-feedback-system/backend

# 2. 安装依赖（首次需要，约1-2分钟）
npm install

# 3. 创建环境配置文件
# Windows PowerShell:
Copy-Item .env.example .env
# Mac/Linux:
cp .env.example .env

# 4. 启动后端服务
npm run dev
```

如果看到以下输出，说明后端启动成功：
```
✅ MongoDB 连接成功
✅ 默认管理员账户已创建
🚀 服务器运行在 http://localhost:3001
```

**常见问题：**
- 报错 `MongoDB connection failed` → 检查 MongoDB 是否启动
- 报错 `EADDRINUSE` → 端口被占用，关闭其他程序或改 .env 中的 PORT

---

### 步骤 4：启动前端服务

**新开一个终端窗口**（保持后端运行），执行：

```bash
# 1. 进入前端目录
cd student-feedback-system/frontend

# 2. 安装依赖（首次需要，约2-3分钟）
npm install

# 3. 启动开发服务器
npm run dev
```

如果看到以下输出，说明前端启动成功：
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: http://192.168.x.x:3000/
```

---

### 步骤 5：访问系统

打开浏览器，访问 http://localhost:3000

**测试账号：**
- 学生注册：自己注册一个新账号
- 管理员登录：学号 `admin001`，密码 `Admin@123456`

---

## ☁️ 第二部分：部署到云服务器（让所有人访问）

### 步骤 1：购买云服务器

**推荐选择（学生优惠）：**
- 阿里云：https://www.aliyun.com/minisite/goods?userCode=0phtycgr
- 腾讯云：https://cloud.tencent.com/act/campus

**配置选择：**
- 系统：Ubuntu 22.04 LTS
- 规格：2核2G内存（入门够用）
- 带宽：3-5Mbps

购买后你会得到：
- 服务器公网 IP（如 `123.45.67.89`）
- 登录密码或 SSH 密钥

---

### 步骤 2：连接服务器

**Windows 用户：**
1. 下载 MobaXterm: https://mobaxterm.mobatek.net
2. 新建 SSH 会话，输入服务器 IP 和密码

**Mac/Linux 用户：**
```bash
ssh root@你的服务器IP
```

---

### 步骤 3：一键部署脚本

连接服务器后，复制粘贴以下命令：

```bash
# ===== 一键部署脚本 =====
# 请逐段复制执行，不要一次性全部粘贴

# 1. 更新系统
apt update && apt upgrade -y

# 2. 安装 Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs git nginx

# 3. 安装 PM2（进程管理）
npm install -g pm2

# 4. 安装 MongoDB
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
  gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
  tee /etc/apt/sources.list.d/mongodb-org-7.0.list
apt update
apt install -y mongodb-org
systemctl start mongod
systemctl enable mongod

# 5. 创建项目目录
mkdir -p /var/www
cd /var/www

# 6. 克隆代码（替换成你的 GitHub 仓库地址）
git clone https://github.com/你的用户名/buct-feedback-system.git
cd buct-feedback-system

# 7. 部署后端
cd backend
npm install

# 创建生产环境配置（重要：修改下面的密码和密钥！）
cat > .env << 'EOF'
PORT=3001
NODE_ENV=production
MONGODB_URI=mongodb://localhost:27017/buct_feedback
JWT_SECRET=在这里输入一个64位以上的随机字符串作为密钥
JWT_EXPIRE=7d
CORS_ORIGIN=http://你的服务器IP
EOF

# 用 PM2 启动后端
pm2 start server.js --name feedback-backend
pm2 save
pm2 startup

# 8. 构建前端
cd ../frontend
npm install
npm run build

# 9. 部署前端到 Nginx
cp -r dist/* /var/www/html/

# 10. 配置 Nginx
cat > /etc/nginx/sites-available/feedback << 'EOF'
server {
    listen 80;
    server_name _;
    
    root /var/www/html;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF

ln -sf /etc/nginx/sites-available/feedback /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

# 11. 配置防火墙
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

echo "✅ 部署完成！请访问 http://你的服务器IP"
```

---

### 步骤 4：修改前端 API 地址

在构建前端之前，需要修改 API 地址：

```bash
cd /var/www/buct-feedback-system/frontend/src

# 编辑 App.jsx
nano App.jsx
```

找到这一行（大约第4行）：
```javascript
const API_BASE = 'http://localhost:3001/api';
```

改成：
```javascript
const API_BASE = '/api';  // 使用相对路径，通过 Nginx 代理
```

按 `Ctrl+X`，然后 `Y`，然后 `Enter` 保存。

然后重新构建：
```bash
cd /var/www/buct-feedback-system/frontend
npm run build
cp -r dist/* /var/www/html/
```

---

### 步骤 5：访问你的系统

打开浏览器，访问：`http://你的服务器IP`

🎉 恭喜！你的系统已经上线了！

---

## 🔧 日常运维命令

```bash
# 查看后端运行状态
pm2 status

# 查看后端日志
pm2 logs feedback-backend

# 重启后端
pm2 restart feedback-backend

# 更新代码后重新部署
cd /var/www/buct-feedback-system
git pull
cd backend && npm install && pm2 restart feedback-backend
cd ../frontend && npm install && npm run build && cp -r dist/* /var/www/html/
```

---

## ❓ 常见问题解答

**Q: 访问显示 "无法访问此网站"**
A: 检查服务器安全组是否开放了 80 端口

**Q: 页面空白**
A: 前端没有正确构建，执行 `npm run build` 并复制到 `/var/www/html/`

**Q: API 请求失败（网络错误）**
A: 检查后端是否运行 `pm2 status`，以及 Nginx 配置是否正确

**Q: 登录后跳回登录页**
A: JWT_SECRET 配置问题，检查 `.env` 文件

**Q: MongoDB 连接失败**
A: 执行 `systemctl status mongod` 检查数据库状态

---

## 📋 部署检查清单

完成部署后，确认以下事项：

- [ ] 能访问 http://服务器IP
- [ ] 能注册新用户
- [ ] 能登录系统
- [ ] 能提交反馈
- [ ] 管理员能看到反馈列表
- [ ] 修改了默认管理员密码
- [ ] 修改了 JWT_SECRET
