const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            code: 401,
            message: '访问被拒绝，请先登录'
        });
    }

    try {
        // 验证 token
        const decoded = jwt.verify(token, import.meta.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                code: 401,
                message: '登录已过期，请重新登录'
            });
        }
        return res.status(403).json({
            code: 403,
            message: '无效的令牌'
        });
    }
};

// 角色验证中间件
const authorizeRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                code: 401,
                message: '用户未认证'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                code: 403,
                message: '权限不足'
            });
        }

        next();
    };
};

// 统一响应格式中间件
const responseMiddleware = (req, res, next) => {
    // 保存原始的 res.json 方法
    const originalJson = res.json;

    // 重写 res.json 方法
    res.json = function (data) {
        // 如果已经是包装过的响应，直接返回
        if (data && data.code !== undefined) {
            return originalJson.call(this, data);
        }

        // 包装响应数据
        const wrappedData = {
            code: 200,
            data: data,
            message: 'success',
            timestamp: new Date().toISOString()
        };

        return originalJson.call(this, wrappedData);
    };

    next();
};

// 错误处理中间件
const errorHandler = (err, req, res, next) => {
    console.error('服务器错误:', err.stack);

    res.status(500).json({
        code: 500,
        message: '服务器内部错误',
        error: import.meta.env.NODE_ENV === 'development' ? err.message : undefined
    });
};

// 404 处理中间件
const notFoundHandler = (req, res) => {
    res.status(404).json({
        code: 404,
        message: `接口 ${req.method} ${req.url} 不存在`
    });
};

module.exports = {
    authenticateToken,
    authorizeRole,
    responseMiddleware,
    errorHandler,
    notFoundHandler
};