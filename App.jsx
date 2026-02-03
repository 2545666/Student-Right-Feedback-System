import React, { useState, useEffect, useCallback } from 'react';

// API Configuration
// 开发环境使用完整地址，生产环境使用相对路径（通过 Nginx 代理）
const API_BASE = import.meta.env.DEV ? 'http://localhost:3001/api' : '/api';

// Custom Hooks
const useAuth = () => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  const login = async (studentId, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, password })
    });
    const data = await res.json();
    if (data.success) {
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
    }
    return data;
  };

  const register = async (userData) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return res.json();
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    if (token) {
      fetch(`${API_BASE}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) setUser(data.user);
          else logout();
        })
        .catch(() => logout());
    }
  }, [token]);

  return { user, token, login, register, logout };
};

// Components
const GlowOrb = ({ className }) => (
  <div className={`absolute rounded-full blur-3xl opacity-30 animate-pulse ${className}`} />
);

const FloatingShape = ({ delay, className }) => (
  <div 
    className={`absolute opacity-10 ${className}`}
    style={{ animationDelay: `${delay}s` }}
  />
);

const Background = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none">
    <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-purple-950/50 to-slate-950" />
    <GlowOrb className="w-96 h-96 bg-purple-600 -top-48 -left-48" />
    <GlowOrb className="w-80 h-80 bg-blue-600 top-1/3 -right-40" />
    <GlowOrb className="w-64 h-64 bg-violet-500 bottom-20 left-1/4" />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
    <div className="absolute inset-0" style={{
      backgroundImage: `radial-gradient(circle at 2px 2px, rgba(139,92,246,0.15) 1px, transparent 0)`,
      backgroundSize: '40px 40px'
    }} />
    {[...Array(6)].map((_, i) => (
      <FloatingShape 
        key={i} 
        delay={i * 0.5}
        className={`w-${20 + i * 10} h-${20 + i * 10} rounded-full border border-purple-500/20`}
        style={{
          top: `${Math.random() * 100}%`,
          left: `${Math.random() * 100}%`,
          animation: `float ${8 + i * 2}s ease-in-out infinite`
        }}
      />
    ))}
  </div>
);

const Card = ({ children, className = '', hover = true }) => (
  <div className={`
    relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl
    ${hover ? 'hover:bg-white/10 hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300' : ''}
    ${className}
  `}>
    {children}
  </div>
);

const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const variants = {
    primary: 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg shadow-purple-500/25',
    secondary: 'bg-white/10 hover:bg-white/20 text-white border border-white/20',
    ghost: 'bg-transparent hover:bg-white/10 text-purple-300'
  };
  
  return (
    <button
      className={`
        px-6 py-3 rounded-xl font-medium transition-all duration-300
        transform hover:scale-[1.02] active:scale-[0.98]
        ${variants[variant]} ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
};

const Input = ({ label, icon, ...props }) => (
  <div className="space-y-2">
    {label && <label className="text-sm text-purple-200/80 font-medium">{label}</label>}
    <div className="relative">
      {icon && (
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400">
          {icon}
        </span>
      )}
      <input
        className={`
          w-full px-4 py-3 ${icon ? 'pl-12' : ''} rounded-xl
          bg-white/5 border border-white/10 text-white placeholder-white/30
          focus:outline-none focus:border-purple-500/50 focus:bg-white/10
          transition-all duration-300
        `}
        {...props}
      />
    </div>
  </div>
);

const Select = ({ label, options, ...props }) => (
  <div className="space-y-2">
    {label && <label className="text-sm text-purple-200/80 font-medium">{label}</label>}
    <select
      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white
        focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all duration-300"
      {...props}
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value} className="bg-slate-900">{opt.label}</option>
      ))}
    </select>
  </div>
);

const StatusBadge = ({ status }) => {
  const config = {
    pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: '待处理' },
    processing: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: '处理中' },
    resolved: { bg: 'bg-green-500/20', text: 'text-green-400', label: '已解决' },
    rejected: { bg: 'bg-red-500/20', text: 'text-red-400', label: '已拒绝' }
  };
  const { bg, text, label } = config[status] || config.pending;
  
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>
      {label}
    </span>
  );
};

const CategoryIcon = ({ category }) => {
  const icons = {
    academic: '📚',
    accommodation: '🏠',
    catering: '🍽️',
    financial: '💰',
    safety: '🛡️',
    other: '📋'
  };
  return <span className="text-2xl">{icons[category] || '📋'}</span>;
};

// Pages
const LoginPage = ({ onLogin, onRegister }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    studentId: '',
    password: '',
    name: '',
    email: '',
    phone: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (isLogin) {
        const result = await onLogin(formData.studentId, formData.password);
        if (!result.success) setError(result.message || '登录失败');
      } else {
        const result = await onRegister(formData);
        if (result.success) {
          setIsLogin(true);
          setError('');
          alert('注册成功，请登录');
        } else {
          setError(result.message || '注册失败');
        }
      }
    } catch (err) {
      setError('网络错误，请重试');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Background />
      
      <Card className="w-full max-w-md p-8 relative z-10" hover={false}>
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 
            flex items-center justify-center shadow-lg shadow-purple-500/30">
            <span className="text-3xl">🎓</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            北京化工大学国际教育学院
          </h1>
          <p className="text-purple-200/60 text-sm">
            学生权益反馈系统
          </p>
        </div>

        <div className="flex mb-6 p-1 bg-white/5 rounded-xl">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 rounded-lg transition-all ${
              isLogin ? 'bg-purple-600 text-white' : 'text-purple-200/60 hover:text-white'
            }`}
          >
            登录
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 rounded-lg transition-all ${
              !isLogin ? 'bg-purple-600 text-white' : 'text-purple-200/60 hover:text-white'
            }`}
          >
            注册
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="学号"
            placeholder="请输入学号"
            value={formData.studentId}
            onChange={e => setFormData({...formData, studentId: e.target.value})}
            icon="👤"
            required
          />
          
          {!isLogin && (
            <>
              <Input
                label="姓名"
                placeholder="请输入真实姓名"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                required
              />
              <Input
                label="邮箱"
                type="email"
                placeholder="请输入邮箱地址"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                required
              />
              <Input
                label="手机号"
                placeholder="请输入手机号码"
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
              />
            </>
          )}
          
          <Input
            label="密码"
            type="password"
            placeholder="请输入密码"
            value={formData.password}
            onChange={e => setFormData({...formData, password: e.target.value})}
            icon="🔒"
            required
          />
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '处理中...' : (isLogin ? '登录系统' : '注册账户')}
          </Button>
        </form>
        
        <p className="mt-6 text-center text-xs text-purple-200/40">
          © 2024 北京化工大学国际教育学院 · 保护您的隐私是我们的责任
        </p>
      </Card>
    </div>
  );
};

const DashboardPage = ({ user, token, onLogout }) => {
  const [activeTab, setActiveTab] = useState('submit');
  const [feedbacks, setFeedbacks] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, processing: 0, resolved: 0 });
  const [loading, setLoading] = useState(false);

  const categories = [
    { value: 'academic', label: '教学教务', icon: '📚', desc: '课程安排、考试成绩、教学质量等' },
    { value: 'accommodation', label: '宿舍住宿', icon: '🏠', desc: '宿舍设施、卫生环境、维修服务等' },
    { value: 'catering', label: '餐饮服务', icon: '🍽️', desc: '食堂饭菜、价格、卫生等问题' },
    { value: 'financial', label: '财务收费', icon: '💰', desc: '学费、奖学金、退费等问题' },
    { value: 'safety', label: '安全保卫', icon: '🛡️', desc: '校园安全、财产保护等' },
    { value: 'other', label: '其他问题', icon: '📋', desc: '其他未分类的问题' }
  ];

  const fetchFeedbacks = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/feedback/my`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setFeedbacks(data.feedbacks);
        const s = { total: data.feedbacks.length, pending: 0, processing: 0, resolved: 0 };
        data.feedbacks.forEach(f => s[f.status]++);
        setStats(s);
      }
    } catch (err) {
      console.error('获取反馈失败:', err);
    }
  }, [token]);

  useEffect(() => {
    fetchFeedbacks();
    const interval = setInterval(fetchFeedbacks, 10000); // 实时更新
    return () => clearInterval(interval);
  }, [fetchFeedbacks]);

  const handleSubmit = async (formData) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        alert('反馈提交成功！');
        fetchFeedbacks();
        setActiveTab('history');
      } else {
        alert(data.message || '提交失败');
      }
    } catch (err) {
      alert('网络错误，请重试');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen">
      <Background />
      
      {/* Header */}
      <header className="relative z-10 border-b border-white/10 backdrop-blur-xl bg-slate-950/50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 
              flex items-center justify-center shadow-lg shadow-purple-500/20">
              <span className="text-xl">🎓</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">学生权益反馈系统</h1>
              <p className="text-xs text-purple-200/60">北京化工大学国际教育学院</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-white">{user?.name || '用户'}</p>
              <p className="text-xs text-purple-200/60">{user?.studentId}</p>
            </div>
            <Button variant="ghost" onClick={onLogout} className="px-4 py-2">
              退出
            </Button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: '总反馈', value: stats.total, color: 'purple', icon: '📊' },
            { label: '待处理', value: stats.pending, color: 'yellow', icon: '⏳' },
            { label: '处理中', value: stats.processing, color: 'blue', icon: '⚙️' },
            { label: '已解决', value: stats.resolved, color: 'green', icon: '✅' }
          ].map((stat, i) => (
            <Card key={i} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-200/60">{stat.label}</p>
                  <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
                </div>
                <span className="text-3xl opacity-50">{stat.icon}</span>
              </div>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 p-1 bg-white/5 rounded-xl w-fit">
          {[
            { id: 'submit', label: '提交反馈', icon: '✏️' },
            { id: 'history', label: '我的反馈', icon: '📜' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-2 rounded-lg flex items-center gap-2 transition-all ${
                activeTab === tab.id 
                  ? 'bg-purple-600 text-white' 
                  : 'text-purple-200/60 hover:text-white'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'submit' ? (
          <SubmitForm categories={categories} onSubmit={handleSubmit} loading={loading} />
        ) : (
          <FeedbackList feedbacks={feedbacks} categories={categories} />
        )}
      </main>
    </div>
  );
};

const SubmitForm = ({ categories, onSubmit, loading }) => {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    isAnonymous: false,
    priority: 'normal'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedCategory) {
      alert('请选择问题类别');
      return;
    }
    onSubmit({ ...formData, category: selectedCategory });
    setFormData({ title: '', content: '', isAnonymous: false, priority: 'normal' });
    setSelectedCategory('');
  };

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {/* Category Selection */}
      <div className="md:col-span-1">
        <h3 className="text-lg font-medium text-white mb-4">选择问题类别</h3>
        <div className="space-y-3">
          {categories.map(cat => (
            <Card
              key={cat.value}
              className={`p-4 cursor-pointer ${
                selectedCategory === cat.value 
                  ? 'border-purple-500 bg-purple-500/20' 
                  : ''
              }`}
              onClick={() => setSelectedCategory(cat.value)}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{cat.icon}</span>
                <div>
                  <p className="text-white font-medium">{cat.label}</p>
                  <p className="text-xs text-purple-200/60">{cat.desc}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Form */}
      <Card className="md:col-span-2 p-6" hover={false}>
        <h3 className="text-lg font-medium text-white mb-6">填写反馈内容</h3>
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="问题标题"
            placeholder="简要描述您遇到的问题"
            value={formData.title}
            onChange={e => setFormData({...formData, title: e.target.value})}
            required
          />
          
          <div className="space-y-2">
            <label className="text-sm text-purple-200/80 font-medium">详细描述</label>
            <textarea
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white 
                placeholder-white/30 focus:outline-none focus:border-purple-500/50 focus:bg-white/10
                transition-all duration-300 min-h-[150px] resize-none"
              placeholder="请详细描述问题情况，包括时间、地点、涉及人员等信息..."
              value={formData.content}
              onChange={e => setFormData({...formData, content: e.target.value})}
              required
            />
          </div>

          <Select
            label="优先级"
            value={formData.priority}
            onChange={e => setFormData({...formData, priority: e.target.value})}
            options={[
              { value: 'low', label: '低 - 一般性建议' },
              { value: 'normal', label: '普通 - 需要解决的问题' },
              { value: 'high', label: '高 - 紧急问题' },
              { value: 'urgent', label: '紧急 - 需立即处理' }
            ]}
          />

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isAnonymous}
              onChange={e => setFormData({...formData, isAnonymous: e.target.checked})}
              className="w-5 h-5 rounded bg-white/10 border-white/20 text-purple-600 
                focus:ring-purple-500 focus:ring-offset-0"
            />
            <span className="text-purple-200/80">匿名提交（您的个人信息将被保护）</span>
          </label>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '提交中...' : '提交反馈'}
          </Button>
        </form>
      </Card>
    </div>
  );
};

const FeedbackList = ({ feedbacks, categories }) => {
  const [expandedId, setExpandedId] = useState(null);

  const getCategoryInfo = (cat) => categories.find(c => c.value === cat) || { label: cat, icon: '📋' };

  if (feedbacks.length === 0) {
    return (
      <Card className="p-12 text-center" hover={false}>
        <span className="text-6xl mb-4 block">📭</span>
        <p className="text-white text-lg">暂无反馈记录</p>
        <p className="text-purple-200/60 mt-2">提交您的第一条反馈吧！</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {feedbacks.map(feedback => {
        const catInfo = getCategoryInfo(feedback.category);
        const isExpanded = expandedId === feedback._id;
        
        return (
          <Card 
            key={feedback._id} 
            className="overflow-hidden"
            onClick={() => setExpandedId(isExpanded ? null : feedback._id)}
          >
            <div className="p-4 cursor-pointer">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <span className="text-xl">{catInfo.icon}</span>
                  </div>
                  <div>
                    <h4 className="text-white font-medium">{feedback.title}</h4>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-purple-200/60">{catInfo.label}</span>
                      <span className="text-xs text-purple-200/40">
                        {new Date(feedback.createdAt).toLocaleDateString('zh-CN')}
                      </span>
                    </div>
                  </div>
                </div>
                <StatusBadge status={feedback.status} />
              </div>
              
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-purple-200/80 text-sm whitespace-pre-wrap">{feedback.content}</p>
                  
                  {feedback.responses && feedback.responses.length > 0 && (
                    <div className="mt-4 space-y-3">
                      <h5 className="text-sm font-medium text-white">处理进度</h5>
                      {feedback.responses.map((resp, i) => (
                        <div key={i} className="pl-4 border-l-2 border-purple-500/50">
                          <p className="text-sm text-purple-200/80">{resp.content}</p>
                          <p className="text-xs text-purple-200/40 mt-1">
                            {resp.adminName} · {new Date(resp.createdAt).toLocaleString('zh-CN')}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
};

// Main App
export default function App() {
  const { user, token, login, register, logout } = useAuth();

  if (!user) {
    return <LoginPage onLogin={login} onRegister={register} />;
  }

  return <DashboardPage user={user} token={token} onLogout={logout} />;
}
