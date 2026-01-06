require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const { pool, testConnection, initDatabase } = require('../src/config/database');

const app = express();

// ===================== JSON 处理辅助函数 =====================
const jsonHelper = {
    parseJSONField: (value) => {
        if (value === null || value === undefined) return value;
        if (typeof value === 'string') {
            try {
                return JSON.parse(value);
            } catch {
                return value;
            }
        }
        if (typeof value === 'object') {
            return value;
        }
        return value;
    },

    stringifyIfObject: (value) => {
        if (value === null || value === undefined) return null;
        if (typeof value === 'object') {
            try {
                return JSON.stringify(value);
            } catch {
                return JSON.stringify({ error: 'Invalid object' });
            }
        }
        if (typeof value === 'string') {
            try {
                JSON.parse(value);
                return value;
            } catch {
                return JSON.stringify(value);
            }
        }
        return JSON.stringify(value);
    },

    isValidJSON: (value) => {
        if (value === null || value === undefined) return true;
        try {
            if (typeof value === 'string') {
                JSON.parse(value);
            } else {
                JSON.stringify(value);
            }
            return true;
        } catch {
            return false;
        }
    }
};

// ===================== 错误处理中间件 =====================
const errorHandler = (err, req, res, next) => {
    console.error('服务器错误:', err);

    let statusCode = err.status || 500;
    let message = '服务器内部错误';

    if (err.code === 'ER_DUP_ENTRY') {
        statusCode = 409;
        message = '数据已存在';
    } else if (err.code === 'ER_NO_REFERENCED_ROW') {
        statusCode = 400;
        message = '关联数据不存在';
    } else if (err.code === 'ER_BAD_NULL_ERROR') {
        statusCode = 400;
        message = '缺少必要字段';
    } else if (err.code === 'ER_DATA_TOO_LONG') {
        statusCode = 400;
        message = '数据过长';
    }

    res.status(statusCode).json({
        code: statusCode,
        message: process.env.NODE_ENV === 'development' ? err.message : message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
        timestamp: new Date().toISOString()
    });
};

// ===================== 中间件配置 =====================
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with']
}));

// 请求日志中间件
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// 解析请求体
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ===================== 基础接口 =====================

// 根接口
app.get('/', (req, res) => {
    res.json({
        code: 200,
        data: {
            service: '宠物救助平台后端API',
            version: '1.0.0',
            status: 'running',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            endpoints: {
                root: '/',
                health: '/api/health',
                dbTest: '/api/db-test',
                login: 'POST /api/auth/login',
                cats: 'GET /api/cats',
                dogs: 'GET /api/dogs',
                staff: 'GET/POST/PUT/DELETE /api/staff',
                notice: 'GET/POST/PUT/DELETE /api/notice',
                financial: 'GET /api/financial/income /expense /line-data',
                'volunteer-applications': 'GET/POST/PUT /api/volunteer-applications',
                adopter: 'GET/POST/PUT/DELETE /api/adopter'
            }
        },
        message: '欢迎使用宠物救助平台API'
    });
});

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({
        code: 200,
        data: {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development'
        },
        message: '服务运行正常'
    });
});

// 数据库测试
app.get('/api/db-test', async (req, res, next) => {
    try {
        if (!pool) throw new Error('数据库连接池未创建');

        const [result] = await pool.query('SELECT 1 + 1 AS solution, NOW() as time, VERSION() as version');
        res.json({
            code: 200,
            data: result[0],
            message: '数据库连接正常'
        });
    } catch (error) {
        next(error);
    }
});

// ===================== 登录接口 =====================

const loginValidation = [
    body('username').trim().notEmpty().withMessage('用户名不能为空'),
    body('password').notEmpty().withMessage('密码不能为空')
];

app.post('/api/auth/login', loginValidation, async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                code: 400,
                message: '输入验证失败',
                errors: errors.array()
            });
        }

        const { username, password } = req.body;
        console.log('\n🔐 === 登录调试开始 ===');
        console.log('输入的用户名:', username);

        if (!pool) throw new Error('数据库未连接');

        const [users] = await pool.query(
            'SELECT * FROM users WHERE username = ? OR email = ?',
            [username, username]
        );

        console.log('查询到的用户数量:', users.length);

        if (users.length === 0) {
            console.log('❌ 用户不存在');
            return res.status(401).json({
                code: 401,
                message: '用户名或密码错误'
            });
        }

        const user = users[0];
        console.log('数据库用户信息:');
        console.log('  - ID:', user.id);
        console.log('  - 用户名:', user.username);
        console.log('  - 数据库密码哈希长度:', user.password?.length || 0);

        const validPassword = await bcrypt.compare(password, user.password);
        console.log('bcrypt.compare 结果:', validPassword);

        if (!validPassword) {
            console.log('❌ 密码验证失败');
            console.log('=== 登录调试结束 ===\n');
            return res.status(401).json({
                code: 401,
                message: '用户名或密码错误'
            });
        }

        console.log('✅ 密码验证成功');
        console.log('=== 登录调试结束 ===\n');

        const token = `mock-token-${Date.now()}`;

        res.json({
            code: 200,
            data: {
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    name: user.name
                },
                token,
                expiresAt: Date.now() + 24 * 60 * 60 * 1000
            },
            message: '登录成功'
        });

    } catch (error) {
        next(error);
    }
});

// ===================== 猫咪相关接口 =====================

// 获取所有猫咪
app.get('/api/cats', async (req, res, next) => {
    try {
        if (!pool) throw new Error('数据库未连接');

        const [rows] = await pool.query('SELECT * FROM cats ORDER BY id ASC');

        const catList = rows.map(item => ({
            ...item,
            rescue_track: jsonHelper.parseJSONField(item.rescue_track)
        }));

        res.json({
            code: 200,
            data: {
                list: catList,
                total: catList.length,
                page: 1,
                pageSize: 10
            },
            message: '获取成功'
        });

    } catch (error) {
        next(error);
    }
});

// 获取单个猫咪
app.get('/api/cats/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({
                code: 400,
                message: '猫咪ID格式不正确'
            });
        }

        if (!pool) throw new Error('数据库未连接');

        const [rows] = await pool.query('SELECT * FROM cats WHERE id = ?', [id]);

        if (rows.length === 0) {
            return res.status(404).json({
                code: 404,
                message: `未找到ID为${id}的猫咪`
            });
        }

        const cat = {
            ...rows[0],
            rescue_track: jsonHelper.parseJSONField(rows[0].rescue_track)
        };

        res.json({
            code: 200,
            data: cat,
            message: '获取猫咪信息成功'
        });

    } catch (error) {
        next(error);
    }
});

// 更新猫咪
app.put('/api/cats/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({
                code: 400,
                message: '猫咪ID格式不正确'
            });
        }

        const { name, gender, health, adopted, rescue_track } = req.body;

        if (!pool) throw new Error('数据库未连接');

        const [existing] = await pool.query('SELECT * FROM cats WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({
                code: 404,
                message: `未找到ID为${id}的猫咪`
            });
        }

        const rescueTrackStr = jsonHelper.stringifyIfObject(rescue_track);

        await pool.query(
            'UPDATE cats SET name = ?, gender = ?, health = ?, adopted = ?, rescue_track = ? WHERE id = ?',
            [name, gender, health, adopted, rescueTrackStr, id]
        );

        res.json({
            code: 200,
            data: {
                id,
                name,
                gender,
                health,
                adopted,
                rescue_track: jsonHelper.parseJSONField(rescueTrackStr)
            },
            message: '猫咪信息更新成功'
        });

    } catch (error) {
        next(error);
    }
});
// 新增小猫
app.post('/api/cats', async (req, res, next) => {
    try {
        const { name, gender, health, adopted, rescue_track } = req.body;

        if (!name || !gender || !health || !adopted) {
            return res.status(400).json({
                code: 400,
                message: '缺少必要参数'
            });
        }

        if (!pool) throw new Error('数据库未连接');

        const rescueTrackStr = jsonHelper.stringifyIfObject(rescue_track || []);
        const created_at = new Date().toISOString().slice(0, 19).replace('T', ' ');

        const [result] = await pool.query(
            'INSERT INTO cats (name, gender, health, adopted, rescue_track, created_at) VALUES (?, ?, ?, ?, ?, ?)',
            [name, gender, health, adopted, rescueTrackStr, created_at]
        );

        const newCatId = result.insertId;

        // 获取新创建的猫咪信息
        const [rows] = await pool.query('SELECT * FROM cats WHERE id = ?', [newCatId]);

        if (rows.length === 0) {
            return res.status(500).json({
                code: 500,
                message: '创建猫咪信息失败'
            });
        }

        const cat = {
            ...rows[0],
            rescue_track: jsonHelper.parseJSONField(rows[0].rescue_track)
        };

        res.json({
            code: 200,
            data: cat,
            message: '猫咪创建成功'
        });

    } catch (error) {
        next(error);
    }
});

// 新增小狗（类似小猫接口）
app.post('/api/dogs', async (req, res, next) => {
    try {
        const { name, gender, health, adopted, rescue_track } = req.body;

        if (!name || !gender || !health || !adopted) {
            return res.status(400).json({
                code: 400,
                message: '缺少必要参数'
            });
        }

        if (!pool) throw new Error('数据库未连接');

        const rescueTrackStr = jsonHelper.stringifyIfObject(rescue_track || []);
        const created_at = new Date().toISOString().slice(0, 19).replace('T', ' ');

        const [result] = await pool.query(
            'INSERT INTO dogs (name, gender, health, adopted, rescue_track, created_at) VALUES (?, ?, ?, ?, ?, ?)',
            [name, gender, health, adopted, rescueTrackStr, created_at]
        );

        const newDogId = result.insertId;

        // 获取新创建的小狗信息
        const [rows] = await pool.query('SELECT * FROM dogs WHERE id = ?', [newDogId]);

        if (rows.length === 0) {
            return res.status(500).json({
                code: 500,
                message: '创建小狗信息失败'
            });
        }

        const dog = {
            ...rows[0],
            rescue_track: jsonHelper.parseJSONField(rows[0].rescue_track)
        };

        res.json({
            code: 200,
            data: dog,
            message: '小狗创建成功'
        });

    } catch (error) {
        next(error);
    }
});
// ===================== 狗狗相关接口 =====================

// 获取所有狗狗
app.get('/api/dogs', async (req, res, next) => {
    try {
        if (!pool) throw new Error('数据库未连接');

        const [rows] = await pool.query('SELECT * FROM dogs ORDER BY id ASC');

        const dogList = rows.map(item => ({
            ...item,
            rescue_track: jsonHelper.parseJSONField(item.rescue_track)
        }));

        res.json({
            code: 200,
            data: {
                list: dogList,
                total: dogList.length,
                page: 1,
                pageSize: 10
            },
            message: '获取成功'
        });

    } catch (error) {
        next(error);
    }
});

// 获取单个狗狗
app.get('/api/dogs/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({
                code: 400,
                message: '狗狗ID格式不正确'
            });
        }

        if (!pool) throw new Error('数据库未连接');

        const [rows] = await pool.query('SELECT * FROM dogs WHERE id = ?', [id]);

        if (rows.length === 0) {
            return res.status(404).json({
                code: 404,
                message: `未找到ID为${id}的狗狗`
            });
        }

        const dog = {
            ...rows[0],
            rescue_track: jsonHelper.parseJSONField(rows[0].rescue_track)
        };

        res.json({
            code: 200,
            data: dog,
            message: '获取狗狗信息成功'
        });

    } catch (error) {
        next(error);
    }
});

// 更新狗狗
app.put('/api/dogs/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({
                code: 400,
                message: '狗狗ID格式不正确'
            });
        }

        const { name, gender, health, adopted, rescue_track } = req.body;

        if (!pool) throw new Error('数据库未连接');

        const [existing] = await pool.query('SELECT * FROM dogs WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({
                code: 404,
                message: `未找到ID为${id}的狗狗`
            });
        }

        const rescueTrackStr = jsonHelper.stringifyIfObject(rescue_track);

        await pool.query(
            'UPDATE dogs SET name = ?, gender = ?, health = ?, adopted = ?, rescue_track = ? WHERE id = ?',
            [name, gender, health, adopted, rescueTrackStr, id]
        );

        res.json({
            code: 200,
            data: {
                id,
                name,
                gender,
                health,
                adopted,
                rescue_track: jsonHelper.parseJSONField(rescueTrackStr)
            },
            message: '狗狗信息更新成功'
        });

    } catch (error) {
        next(error);
    }
});

// ===================== 员工相关接口 =====================

// 员工验证规则
const staffValidation = [
    body('name').trim().notEmpty().withMessage('姓名不能为空').escape(),
    body('position').trim().notEmpty().withMessage('职位不能为空').escape(),
    body('department').trim().notEmpty().withMessage('部门不能为空').escape(),
    body('status').isIn(['在职', '离职']).withMessage('状态必须是在职或离职'),
    body('join_date').isDate().withMessage('入职日期格式不正确'),
    body('monthly_data').custom(value => {
        if (!jsonHelper.isValidJSON(value)) {
            throw new Error('monthly_data 必须是有效的 JSON');
        }
        return true;
    })
];

// 获取所有员工
app.get('/api/staff', async (req, res, next) => {
    try {
        if (!pool) throw new Error('数据库未连接');

        const [rows] = await pool.query('SELECT * FROM staff ORDER BY id DESC');

        const staffList = rows.map(item => ({
            ...item,
            monthly_data: jsonHelper.parseJSONField(item.monthly_data)
        }));

        res.json({
            code: 200,
            data: {
                list: staffList,
                total: staffList.length
            },
            message: '获取员工列表成功'
        });

    } catch (error) {
        next(error);
    }
});

// 获取单个员工
app.get('/api/staff/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({
                code: 400,
                message: '员工ID格式不正确'
            });
        }

        if (!pool) throw new Error('数据库未连接');

        const [rows] = await pool.query('SELECT * FROM staff WHERE id = ?', [id]);

        if (rows.length === 0) {
            return res.status(404).json({
                code: 404,
                message: `未找到ID为${id}的员工`
            });
        }

        const staff = {
            ...rows[0],
            monthly_data: jsonHelper.parseJSONField(rows[0].monthly_data)
        };

        res.json({
            code: 200,
            data: staff,
            message: '获取员工信息成功'
        });

    } catch (error) {
        next(error);
    }
});

// 创建新员工
app.post('/api/staff', staffValidation, async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                code: 400,
                message: '输入验证失败',
                errors: errors.array()
            });
        }

        const { name, position, department, status, join_date, monthly_data } = req.body;

        if (!pool) throw new Error('数据库未连接');

        const monthlyDataStr = jsonHelper.stringifyIfObject(monthly_data);

        const [result] = await pool.query(
            'INSERT INTO staff (name, position, department, status, join_date, monthly_data) VALUES (?, ?, ?, ?, ?, ?)',
            [name, position, department, status, join_date, monthlyDataStr]
        );

        res.status(201).json({
            code: 201,
            data: {
                id: result.insertId,
                name,
                position,
                department,
                status,
                join_date,
                monthly_data: jsonHelper.parseJSONField(monthlyDataStr)
            },
            message: '员工创建成功'
        });

    } catch (error) {
        next(error);
    }
});

// 更新员工
app.put('/api/staff/:id', staffValidation, async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({
                code: 400,
                message: '员工ID格式不正确'
            });
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                code: 400,
                message: '输入验证失败',
                errors: errors.array()
            });
        }

        const { name, position, department, status, join_date, monthly_data } = req.body;

        if (!pool) throw new Error('数据库未连接');

        const [existing] = await pool.query('SELECT * FROM staff WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({
                code: 404,
                message: `未找到ID为${id}的员工`
            });
        }

        const monthlyDataStr = jsonHelper.stringifyIfObject(monthly_data);

        await pool.query(
            'UPDATE staff SET name = ?, position = ?, department = ?, status = ?, join_date = ?, monthly_data = ? WHERE id = ?',
            [name, position, department, status, join_date, monthlyDataStr, id]
        );

        res.json({
            code: 200,
            data: {
                id,
                name,
                position,
                department,
                status,
                join_date,
                monthly_data: jsonHelper.parseJSONField(monthlyDataStr)
            },
            message: '员工信息更新成功'
        });

    } catch (error) {
        next(error);
    }
});

// 删除员工
app.delete('/api/staff/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({
                code: 400,
                message: '员工ID格式不正确'
            });
        }

        if (!pool) throw new Error('数据库未连接');

        const [existing] = await pool.query('SELECT * FROM staff WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({
                code: 404,
                message: `未找到ID为${id}的员工`
            });
        }

        await pool.query('DELETE FROM staff WHERE id = ?', [id]);

        res.json({
            code: 200,
            data: { id },
            message: '员工删除成功'
        });

    } catch (error) {
        next(error);
    }
});

// ===================== 公告相关接口 =====================

// 获取所有公告
app.get('/api/notice', async (req, res, next) => {
    try {
        if (!pool) throw new Error('数据库未连接');

        const [rows] = await pool.query('SELECT * FROM notices ORDER BY publish_time DESC');

        res.json({
            code: 200,
            data: rows,
            message: '获取公告列表成功'
        });

    } catch (error) {
        next(error);
    }
});

// 获取单个公告
app.get('/api/notice/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({
                code: 400,
                message: '公告ID格式不正确'
            });
        }

        if (!pool) throw new Error('数据库未连接');

        const [rows] = await pool.query('SELECT * FROM notices WHERE id = ?', [id]);

        if (rows.length === 0) {
            return res.status(404).json({
                code: 404,
                message: `未找到ID为${id}的公告`
            });
        }

        res.json({
            code: 200,
            data: rows[0],
            message: '获取公告成功'
        });

    } catch (error) {
        next(error);
    }
});

// 创建新公告
app.post('/api/notice', [
    body('title').trim().notEmpty().withMessage('标题不能为空').escape(),
    body('content').trim().notEmpty().withMessage('内容不能为空').escape(),
    body('publisher').trim().notEmpty().withMessage('发布人不能为空').escape()
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                code: 400,
                message: '输入验证失败',
                errors: errors.array()
            });
        }

        const { title, content, publisher } = req.body;

        if (!pool) throw new Error('数据库未连接');

        const [result] = await pool.query(
            'INSERT INTO notices (title, content, publisher) VALUES (?, ?, ?)',
            [title, content, publisher]
        );

        const [newNotice] = await pool.query('SELECT * FROM notices WHERE id = ?', [result.insertId]);

        res.status(201).json({
            code: 201,
            data: newNotice[0],
            message: '公告创建成功'
        });

    } catch (error) {
        next(error);
    }
});

// 更新公告
app.put('/api/notice/:id', [
    body('title').trim().notEmpty().withMessage('标题不能为空').escape(),
    body('content').trim().notEmpty().withMessage('内容不能为空').escape(),
    body('publisher').trim().notEmpty().withMessage('发布人不能为空').escape()
], async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({
                code: 400,
                message: '公告ID格式不正确'
            });
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                code: 400,
                message: '输入验证失败',
                errors: errors.array()
            });
        }

        const { title, content, publisher } = req.body;

        if (!pool) throw new Error('数据库未连接');

        const [existing] = await pool.query('SELECT * FROM notices WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({
                code: 404,
                message: `未找到ID为${id}的公告`
            });
        }

        await pool.query(
            'UPDATE notices SET title = ?, content = ?, publisher = ? WHERE id = ?',
            [title, content, publisher, id]
        );

        const [updated] = await pool.query('SELECT * FROM notices WHERE id = ?', [id]);

        res.json({
            code: 200,
            data: updated[0],
            message: '公告更新成功'
        });

    } catch (error) {
        next(error);
    }
});

// 删除公告
app.delete('/api/notice/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({
                code: 400,
                message: '公告ID格式不正确'
            });
        }

        if (!pool) throw new Error('数据库未连接');

        const [existing] = await pool.query('SELECT * FROM notices WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({
                code: 404,
                message: `未找到ID为${id}的公告`
            });
        }

        await pool.query('DELETE FROM notices WHERE id = ?', [id]);

        res.json({
            code: 200,
            data: { id },
            message: '公告删除成功'
        });

    } catch (error) {
        next(error);
    }
});

// ===================== 财务相关接口 =====================

// 获取收入数据
app.get('/api/financial/income', async (req, res, next) => {
    try {
        const { month = '2025-03' } = req.query;

        if (!pool) throw new Error('数据库未连接');

        const [rows] = await pool.query(
            'SELECT id, name, value FROM financial_income WHERE month = ? ORDER BY id',
            [month]
        );

        res.json({
            code: 200,
            data: {
                month,
                data: rows
            },
            message: '获取收入数据成功'
        });

    } catch (error) {
        next(error);
    }
});

// 获取支出数据
app.get('/api/financial/expense', async (req, res, next) => {
    try {
        const { month = '2025-03' } = req.query;

        if (!pool) throw new Error('数据库未连接');

        const [rows] = await pool.query(
            'SELECT id, name, value FROM financial_expense WHERE month = ? ORDER BY id',
            [month]
        );

        res.json({
            code: 200,
            data: {
                month,
                data: rows
            },
            message: '获取支出数据成功'
        });

    } catch (error) {
        next(error);
    }
});

// 获取折线图数据
app.get('/api/financial/line-data', async (req, res, next) => {
    try {
        if (!pool) throw new Error('数据库未连接');
        const [incomeRows] = await pool.query(`
            SELECT 
                month,
                SUM(value) as total
            FROM financial_income
            GROUP BY month
            ORDER BY month DESC
            LIMIT 6
        `);

        const [expenseRows] = await pool.query(`
            SELECT 
                month,
                SUM(value) as total
            FROM financial_expense
            GROUP BY month
            ORDER BY month DESC
            LIMIT 6
        `);

        const reversedIncome = incomeRows.reverse();
        const reversedExpense = expenseRows.reverse();

        const lineData = {
            months: reversedIncome.map(row => {
                const [year, monthNum] = row.month.split('-');
                const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月',
                    '七月', '八月', '九月', '十月', '十一月', '十二月'];
                return monthNames[parseInt(monthNum) - 1];
            }),
            income: reversedIncome.map(row => parseFloat(row.total) || 0),
            expense: reversedExpense.map(row => parseFloat(row.total) || 0)
        };

        res.json({
            code: 200,
            data: lineData,
            message: '获取折线图数据成功'
        });

    } catch (error) {
        next(error);
    }
});

// 创建收入记录
app.post('/api/financial/income', [
    body('month').trim().notEmpty().withMessage('月份不能为空'),
    body('name').trim().notEmpty().withMessage('收入名称不能为空'),
    body('value').isFloat({ min: 0 }).withMessage('收入金额必须是正数')
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                code: 400,
                message: '输入验证失败',
                errors: errors.array()
            });
        }

        const { month, name, value } = req.body;

        if (!pool) throw new Error('数据库未连接');

        const [result] = await pool.query(
            'INSERT INTO financial_income (month, name, value) VALUES (?, ?, ?)',
            [month, name, value]
        );

        const [newRecord] = await pool.query(
            'SELECT * FROM financial_income WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json({
            code: 201,
            data: newRecord[0],
            message: '收入记录创建成功'
        });

    } catch (error) {
        next(error);
    }
});

// 创建支出记录
app.post('/api/financial/expense', [
    body('month').trim().notEmpty().withMessage('月份不能为空'),
    body('name').trim().notEmpty().withMessage('支出名称不能为空'),
    body('value').isFloat({ min: 0 }).withMessage('支出金额必须是正数')
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                code: 400,
                message: '输入验证失败',
                errors: errors.array()
            });
        }

        const { month, name, value } = req.body;

        if (!pool) throw new Error('数据库未连接');

        const [result] = await pool.query(
            'INSERT INTO financial_expense (month, name, value) VALUES (?, ?, ?)',
            [month, name, value]
        );

        const [newRecord] = await pool.query(
            'SELECT * FROM financial_expense WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json({
            code: 201,
            data: newRecord[0],
            message: '支出记录创建成功'
        });

    } catch (error) {
        next(error);
    }
});

// ===================== 志愿者申请相关接口 =====================

// 获取所有志愿者申请
app.get('/api/volunteer-applications', async (req, res, next) => {
    try {
        if (!pool) throw new Error('数据库未连接');

        const [rows] = await pool.query(
            'SELECT * FROM volunteer_applications ORDER BY id ASC'
        );

        res.json({
            code: 200,
            data: {
                list: rows,
                total: rows.length
            },
            message: '获取志愿者申请列表成功'
        });

    } catch (error) {
        next(error);
    }
});

// 获取单个志愿者申请
app.get('/api/volunteer-applications/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({
                code: 400,
                message: '申请ID格式不正确'
            });
        }

        if (!pool) throw new Error('数据库未连接');

        const [rows] = await pool.query(
            'SELECT * FROM volunteer_applications WHERE id = ?',
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                code: 404,
                message: `未找到ID为${id}的志愿者申请`
            });
        }

        res.json({
            code: 200,
            data: rows[0],
            message: '获取志愿者申请成功'
        });

    } catch (error) {
        next(error);
    }
});

// 创建志愿者申请
app.post('/api/volunteer-applications', [
    body('name').trim().notEmpty().withMessage('姓名不能为空').escape(),
    body('email').trim().isEmail().withMessage('邮箱格式不正确').normalizeEmail(),
    body('phone').optional().trim().isMobilePhone('zh-CN').withMessage('手机号码格式不正确'),
    body('introduce').trim().notEmpty().withMessage('自我介绍不能为空').escape()
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                code: 400,
                message: '输入验证失败',
                errors: errors.array()
            });
        }

        const { name, email, phone, introduce } = req.body;

        if (!pool) throw new Error('数据库未连接');

        const [result] = await pool.query(
            'INSERT INTO volunteer_applications (name, email, phone, application_date, introduce) VALUES (?, ?, ?, CURDATE(), ?)',
            [name, email, phone, introduce]
        );

        const [newApplication] = await pool.query(
            'SELECT * FROM volunteer_applications WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json({
            code: 201,
            data: newApplication[0],
            message: '志愿者申请提交成功'
        });

    } catch (error) {
        next(error);
    }
});

// 更新志愿者申请状态
app.put('/api/volunteer-applications/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({
                code: 400,
                message: '申请ID格式不正确'
            });
        }

        const { status } = req.body;

        if (!['待处理', '已通过', '未通过'].includes(status)) {
            return res.status(400).json({
                code: 400,
                message: '状态必须是"待处理"、"已通过"或"未通过"'
            });
        }

        if (!pool) throw new Error('数据库未连接');

        const [existing] = await pool.query(
            'SELECT * FROM volunteer_applications WHERE id = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                code: 404,
                message: `未找到ID为${id}的志愿者申请`
            });
        }

        await pool.query(
            'UPDATE volunteer_applications SET status = ? WHERE id = ?',
            [status, id]
        );

        // 返回更新后的数据
        const [updated] = await pool.query(
            'SELECT * FROM volunteer_applications WHERE id = ?',
            [id]
        );

        res.json({
            code: 200,
            data: updated[0],
            message: '志愿者申请状态更新成功'
        });

    } catch (error) {
        next(error);
    }
});

// 删除志愿者申请
app.delete('/api/volunteer-applications/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({
                code: 400,
                message: '申请ID格式不正确'
            });
        }

        if (!pool) throw new Error('数据库未连接');

        const [existing] = await pool.query(
            'SELECT * FROM volunteer_applications WHERE id = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                code: 404,
                message: `未找到ID为${id}的志愿者申请`
            });
        }

        await pool.query('DELETE FROM volunteer_applications WHERE id = ?', [id]);

        res.json({
            code: 200,
            data: { id },
            message: '志愿者申请删除成功'
        });

    } catch (error) {
        next(error);
    }
});

// ===================== 收养者相关接口 =====================

// 获取所有收养者
app.get('/api/adopter', async (req, res, next) => {
    try {
        if (!pool) throw new Error('数据库未连接');

        const [rows] = await pool.query(
            'SELECT * FROM adopter ORDER BY id DESC'
        );

        res.json({
            code: 200,
            data: rows,
            message: '获取收养者列表成功'
        });

    } catch (error) {
        next(error);
    }
});

// 获取单个收养者
app.get('/api/adopter/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({
                code: 400,
                message: '收养者ID格式不正确'
            });
        }

        if (!pool) throw new Error('数据库未连接');

        const [rows] = await pool.query(
            'SELECT * FROM adopter WHERE id = ?',
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                code: 404,
                message: `未找到ID为${id}的收养者`
            });
        }

        res.json({
            code: 200,
            data: rows[0],
            message: '获取收养者信息成功'
        });

    } catch (error) {
        next(error);
    }
});

// 创建收养者
app.post('/api/adopter', [
    body('name').trim().notEmpty().withMessage('姓名不能为空').escape(),
    body('age').optional().isInt({ min: 18, max: 100 }).withMessage('年龄必须在18-100之间'),
    body('sex').optional().isIn(['男', '女']).withMessage('性别必须是男或女'),
    body('pet').optional().trim().escape(),
    body('visit').optional().isIn(['是', '否']).withMessage('回访必须是是或否')
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                code: 400,
                message: '输入验证失败',
                errors: errors.array()
            });
        }

        const { name, age, sex, pet, visit } = req.body;

        if (!pool) throw new Error('数据库未连接');

        const [result] = await pool.query(
            'INSERT INTO adopter (name, age, sex, pet, visit) VALUES (?, ?, ?, ?, ?)',
            [name, age, sex, pet, visit]
        );

        const [newAdopter] = await pool.query(
            'SELECT * FROM adopter WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json({
            code: 201,
            data: newAdopter[0],
            message: '收养者创建成功'
        });

    } catch (error) {
        next(error);
    }
});

// 更新收养者
app.put('/api/adopter/:id', [
    body('name').optional().trim().escape(),
    body('age').optional().isInt({ min: 18, max: 100 }).withMessage('年龄必须在18-100之间'),
    body('sex').optional().isIn(['男', '女']).withMessage('性别必须是男或女'),
    body('pet').optional().trim().escape(),
    body('visit').optional().isIn(['是', '否']).withMessage('回访必须是是或否')
], async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({
                code: 400,
                message: '收养者ID格式不正确'
            });
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                code: 400,
                message: '输入验证失败',
                errors: errors.array()
            });
        }

        const { name, age, sex, pet, visit } = req.body;

        if (!pool) throw new Error('数据库未连接');

        const [existing] = await pool.query('SELECT * FROM adopter WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({
                code: 404,
                message: `未找到ID为${id}的收养者`
            });
        }

        // 构建更新字段
        const updateFields = [];
        const updateValues = [];

        if (name !== undefined) {
            updateFields.push('name = ?');
            updateValues.push(name);
        }
        if (age !== undefined) {
            updateFields.push('age = ?');
            updateValues.push(age);
        }
        if (sex !== undefined) {
            updateFields.push('sex = ?');
            updateValues.push(sex);
        }
        if (pet !== undefined) {
            updateFields.push('pet = ?');
            updateValues.push(pet);
        }
        if (visit !== undefined) {
            updateFields.push('visit = ?');
            updateValues.push(visit);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({
                code: 400,
                message: '至少提供一个更新字段'
            });
        }

        updateValues.push(id);
        const query = `UPDATE adopter SET ${updateFields.join(', ')} WHERE id = ?`;

        await pool.query(query, updateValues);

        const [updated] = await pool.query('SELECT * FROM adopter WHERE id = ?', [id]);

        res.json({
            code: 200,
            data: updated[0],
            message: '收养者信息更新成功'
        });

    } catch (error) {
        next(error);
    }
});

// 删除收养者
app.delete('/api/adopter/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({
                code: 400,
                message: '收养者ID格式不正确'
            });
        }

        if (!pool) throw new Error('数据库未连接');

        const [existing] = await pool.query('SELECT * FROM adopter WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({
                code: 404,
                message: `未找到ID为${id}的收养者`
            });
        }

        await pool.query('DELETE FROM adopter WHERE id = ?', [id]);

        res.json({
            code: 200,
            data: { id },
            message: '收养者删除成功'
        });

    } catch (error) {
        next(error);
    }
});

// ===================== 其他接口 =====================
app.use((req, res) => {
    res.status(404).json({
        code: 404,
        message: `接口 ${req.method} ${req.url} 不存在`,
        timestamp: new Date().toISOString()
    });
});

// ===================== 使用统一的错误处理中间件 =====================
app.use(errorHandler);

// ===================== 启动服务器 =====================
const PORT = process.env.PORT || 3000;

async function startServer() {
    console.log('🚀 启动宠物救助平台后端服务器...');
    console.log('数据库连接配置:');
    console.log('  - 主机:', process.env.DB_HOST || 'localhost');
    console.log('  - 端口:', process.env.DB_PORT || 3306);
    console.log('  - 用户:', process.env.DB_USER || 'pet_user');
    console.log('  - 数据库:', process.env.DB_NAME || 'pet_backend');

    try {
        // 测试数据库连接
        console.log('\n🔍 正在测试数据库连接...');
        const dbConnected = await testConnection();

        if (dbConnected) {
            console.log('✅ 数据库连接成功');
            await initDatabase();
            console.log('✅ 数据库初始化完成');
        } else {
            console.warn('⚠️  数据库连接失败，但服务器将继续启动');
            console.warn('⚠️  部分数据库相关功能可能无法使用');
        }

        // 启动HTTP服务器
        app.listen(PORT, '0.0.0.0', () => {

            console.log(`✅ 服务器启动成功!`);
        });

    } catch (error) {
        console.error('❌ 启动失败:', error.message);
        process.exit(1);
    }
}

// 启动服务器
startServer();

// 导出app供测试或其他用途
module.exports = app;