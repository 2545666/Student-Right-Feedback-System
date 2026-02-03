# 🚀 部署指南：从 GitHub 到服务器上线

本指南将帮助你将学生权益反馈系统部署到云服务器，让所有人都能访问。

---

## 📋 准备工作

### 你需要准备：
1. **GitHub 账号** - 免费注册 https://github.com
2. **云服务器** - 推荐选择：
   - 阿里云 ECS（学生优惠约 ¥9.9/月）
   - 腾讯云轻量服务器（学生优惠约 ¥10/月）
   - 华为云（学生认证有免费额度）
3. **域名**（可选）- 阿里云/腾讯云购买，约 ¥30-50/年

### 服务器配置要求：
- 系统：Ubuntu 22.04 LTS（推荐）
- 内存：≥ 2GB
- 硬盘：≥ 40GB
- 带宽：≥ 3Mbps

---

## 第一步：上传代码到 GitHub

### 1.1 创建 GitHub 仓库

```bash
# 1. 在 GitHub 网站创建新仓库，命名如：buct-feedback-system
# 2. 不要勾选 "Add README"（我们已经有了）
```

### 1.2 初始化本地 Git 仓库

```bash
# 进入项目目录
cd student-feedback-system

# 初始化 Git
git init

# 创建 .gitignore 文件（非常重要！）
cat > .gitignore << 'EOF'
# 依赖目录
node_modules/

# 环境变量（绝对不能上传！）
.env
.env.local
.env.production

# 日志
logs/
*.log

# 系统文件
.DS_Store
Thumbs.db

# 编辑器配置
.vscode/
.idea/

# 构建产物
dist/
build/

# 上传文件目录
uploads/
EOF

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit: BUCT Student Feedback System"

# 连接远程仓库（替换成你的仓库地址）
git remote add origin https://github.com/你的用户名/buct-feedback-system.git

# 推送到 GitHub
git branch -M main
git push -u origin main
```

---

## 第二步：配置云服务器

### 2.1 购买并连接服务器

```bash
# 使用 SSH 连接服务器（在本地终端执行）
ssh root@你的服务器IP

# 首次连接会提示确认，输入 yes
```

### 2.2 安装必要软件

```bash
# 更新系统
apt update && apt upgrade -y

# 安装 Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt install -y nodejs

# 验证安装
node --version  # 应显示 v20.x.x
npm --version

# 安装 Git
apt install -y git

# 安装 Nginx（Web服务器/反向代理）
apt install -y nginx

# 安装 PM2（Node.js 进程管理器）
npm install -g pm2

# 安装 MongoDB
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
   sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
apt update
apt install -y mongodb-org

# 启动 MongoDB
systemctl start mongod
systemctl enable mongod

# 验证 MongoDB 运行状态
systemctl status mongod
```

### 2.3 配置 MongoDB 安全性

```bash
# 进入 MongoDB Shell
mongosh

# 创建管理员用户
use admin
db.createUser({
  user: "admin",
  pwd: "你的强密码",  # 请修改！
  roles: ["root"]
})

# 创建应用数据库用户
use buct_feedback
db.createUser({
  user: "buct_app",
  pwd: "应用数据库密码",  # 请修改！
  roles: ["readWrite"]
})

# 退出
exit

# 启用认证
nano /etc/mongod.conf
```

在配置文件中添加：
```yaml
security:
  authorization: enabled
```

```bash
# 重启 MongoDB
systemctl restart mongod
```

---

## 第三步：部署应用

### 3.1 从 GitHub 克隆代码

```bash
# 创建应用目录
mkdir -p /var/www
cd /var/www

# 克隆你的仓库
git clone https://github.com/你的用户名/buct-feedback-system.git
cd buct-feedback-system
```

### 3.2 配置后端

```bash
cd backend

# 安装依赖
npm install

# 创建生产环境配置
cat > .env << 'EOF'
PORT=3001
NODE_ENV=production

# MongoDB 连接（使用刚才创建的用户）
MONGODB_URI=mongodb://buct_app:应用数据库密码@localhost:27017/buct_feedback

# JWT 密钥（必须修改为随机字符串！）
JWT_SECRET=这里填入64位以上的随机字符串
JWT_EXPIRE=7d

# CORS 配置（填入你的域名）
CORS_ORIGIN=https://你的域名.com,https://www.你的域名.com

# 如果没有域名，填服务器IP
# CORS_ORIGIN=http://你的服务器IP
EOF

# 使用 PM2 启动后端
pm2 start server.js --name "feedback-backend"

# 保存 PM2 配置（开机自启）
pm2 save
pm2 startup
```

### 3.3 构建前端

```bash
cd ../frontend

# 安装依赖
npm install

# 修改 API 地址（如果需要）
# 编辑 src/App.jsx，将 API_BASE 改为你的域名
# const API_BASE = 'https://你的域名.com/api';

# 构建生产版本
npm run build

# 将构建产物复制到 Nginx 目录
cp -r dist/* /var/www/html/
```

---

## 第四步：配置 Nginx

### 4.1 创建 Nginx 配置

```bash
# 编辑 Nginx 配置
nano /etc/nginx/sites-available/feedback
```

填入以下内容：

```nginx
server {
    listen 80;
    server_name 你的域名.com www.你的域名.com;  # 或者填 服务器IP
    
    # 前端静态文件
    root /var/www/html;
    index index.html;
    
    # 前端路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API 反向代理
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
    
    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

```bash
# 启用配置
ln -s /etc/nginx/sites-available/feedback /etc/nginx/sites-enabled/

# 删除默认配置
rm /etc/nginx/sites-enabled/default

# 测试配置
nginx -t

# 重启 Nginx
systemctl restart nginx
```

### 4.2 配置 HTTPS（推荐）

```bash
# 安装 Certbot
apt install -y certbot python3-certbot-nginx

# 获取 SSL 证书（需要先将域名解析到服务器IP）
certbot --nginx -d 你的域名.com -d www.你的域名.com

# 证书会自动续期，可以测试：
certbot renew --dry-run
```

---

## 第五步：配置防火墙

```bash
# 启用 UFW 防火墙
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable

# 查看状态
ufw status
```

---

## 第六步：自动化部署（可选）

### 6.1 创建部署脚本

```bash
# 在服务器上创建部署脚本
cat > /var/www/deploy.sh << 'EOF'
#!/bin/bash
cd /var/www/buct-feedback-system

echo "📥 拉取最新代码..."
git pull origin main

echo "📦 安装后端依赖..."
cd backend
npm install

echo "🔄 重启后端服务..."
pm2 restart feedback-backend

echo "📦 构建前端..."
cd ../frontend
npm install
npm run build
cp -r dist/* /var/www/html/

echo "✅ 部署完成！"
EOF

chmod +x /var/www/deploy.sh
```

### 6.2 使用 GitHub Actions 自动部署

在项目根目录创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to Server

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          script: /var/www/deploy.sh
```

在 GitHub 仓库 Settings → Secrets 中添加：
- `SERVER_HOST`: 服务器 IP
- `SERVER_USER`: 用户名（如 root）
- `SERVER_SSH_KEY`: SSH 私钥

---

## 🔍 常用运维命令

```bash
# 查看后端日志
pm2 logs feedback-backend

# 查看后端状态
pm2 status

# 重启后端
pm2 restart feedback-backend

# 查看 Nginx 日志
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# 查看 MongoDB 状态
systemctl status mongod

# 服务器资源监控
htop
```

---

## ⚠️ 安全检查清单

部署完成后，请确认以下事项：

- [ ] `.env` 文件已创建且包含强密码
- [ ] `.env` 文件不在 Git 仓库中
- [ ] MongoDB 已启用认证
- [ ] HTTPS 已配置
- [ ] 防火墙已启用
- [ ] 已修改默认管理员密码
- [ ] 定期备份数据库

---

## 🆘 常见问题

**Q: 访问网站显示 502 Bad Gateway**
A: 后端服务未启动，执行 `pm2 restart feedback-backend`

**Q: 无法连接数据库**
A: 检查 MongoDB 是否运行：`systemctl status mongod`

**Q: 前端页面空白**
A: 检查是否正确构建并复制到 `/var/www/html/`

**Q: API 请求失败**
A: 检查 CORS 配置和 Nginx 反向代理配置

---

## 📞 技术支持

如有问题，可以：
1. 查看项目 Issues
2. 提交新 Issue 描述问题
3. 联系学院技术部门
