const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

// 创建数据库连接池
function createConnectionPool() {
    // 从环境变量获取配置，支持阿里云和本地开发
    const config = {
        host: process.env.DB_HOST || '1.tcp.cpolar.top',  // 你的cpolar地址
        port: parseInt(process.env.DB_PORT) || 12345,     // 你的cpolar端口
        user: process.env.DB_USER || 'root',              // MySQL用户名
        password: process.env.DB_PASSWORD || '123456',    // MySQL密码
        database: process.env.DB_NAME || 'pet_management',// 数据库名
        waitForConnections: true,
        connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
        charset: 'utf8mb4',
        // 阿里云函数计算需要更短的超时时间
        connectTimeout: 10000,
        acquireTimeout: 10000,
        typeCast: function (field, next) {
            if (field.type === 'JSON') {
                try {
                    return JSON.parse(field.string("utf8"));
                } catch (error) {
                    console.warn(`JSON解析失败: ${field.name}`, error.message);
                    return field.string("utf8");
                }
            }
            return next();
        }
    };

    console.log('数据库连接配置:');
    console.log('  - 主机:', config.host);
    console.log('  - 端口:', config.port);
    console.log('  - 用户:', config.user);
    console.log('  - 数据库:', config.database);

    return mysql.createPool(config);
}

// 创建连接池
const pool = createConnectionPool();

// 测试数据库连接
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ 数据库连接成功');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ 数据库连接失败:', error.message);
        console.error('完整错误信息:', error);
        return false;
    }
}

// 初始化数据库表结构
async function initDatabase() {
    const connection = await pool.getConnection();

    try {
        console.log('🔄 开始初始化数据库表结构...');

        // 1. 创建用户表
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT PRIMARY KEY AUTO_INCREMENT,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role ENUM('admin', 'user', 'veterinarian') DEFAULT 'user',
                name VARCHAR(50),
                avatar VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_username (username),
                INDEX idx_email (email)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ 用户表创建/检查完成');

        // 2. 创建猫咪表
        await connection.query(`
            CREATE TABLE IF NOT EXISTS cats (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(50) NOT NULL,
                gender ENUM('公', '母') NOT NULL,
                health ENUM('良好', '一般', '较差') DEFAULT '良好',
                adopted ENUM('已收养', '未收养') DEFAULT '未收养',
                rescue_track JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_adopted (adopted),
                INDEX idx_health (health)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ 猫咪表创建/检查完成');

        // 3. 创建狗狗表
        await connection.query(`
            CREATE TABLE IF NOT EXISTS dogs (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(50) NOT NULL,
                gender ENUM('公', '母') NOT NULL,
                health ENUM('良好', '一般', '较差') DEFAULT '良好',
                adopted ENUM('已收养', '未收养') DEFAULT '未收养',
                rescue_track JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ 狗狗表创建/检查完成');

        // 4. 创建员工表
        await connection.query(`
            CREATE TABLE IF NOT EXISTS staff (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(50) NOT NULL,
                position VARCHAR(50) NOT NULL,
                department VARCHAR(50) NOT NULL,
                status ENUM('在职', '离职') DEFAULT '在职',
                monthly_data JSON NOT NULL,
                join_date DATE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ 员工表创建/检查完成');

        // 5. 创建公告表
        await connection.query(`
            CREATE TABLE IF NOT EXISTS notices (
                id INT PRIMARY KEY AUTO_INCREMENT,
                title VARCHAR(200) NOT NULL,
                content TEXT,
                publisher VARCHAR(50),
                status ENUM('active', 'inactive') DEFAULT 'active',
                publish_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_status (status),
                INDEX idx_publish_time (publish_time)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ 公告表创建/检查完成');

        // 6. 创建志愿者申请表
        await connection.query(`
            CREATE TABLE IF NOT EXISTS volunteer_applications (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(50) NOT NULL,
                email VARCHAR(100) NOT NULL,
                phone VARCHAR(20),
                application_date DATE NOT NULL,
                introduce TEXT,
                status ENUM('待处理', '已通过', '未通过') DEFAULT '待处理',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ 志愿者申请表创建/检查完成');

        // 7. 创建财务收入表
        await connection.query(`
            CREATE TABLE IF NOT EXISTS financial_income (
                id INT PRIMARY KEY AUTO_INCREMENT,
                month VARCHAR(7) NOT NULL,
                name VARCHAR(50) NOT NULL,
                value DECIMAL(10, 2) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_month (month)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ 财务收入表创建/检查完成');

        // 8. 创建财务支出表
        await connection.query(`
            CREATE TABLE IF NOT EXISTS financial_expense (
                id INT PRIMARY KEY AUTO_INCREMENT,
                month VARCHAR(7) NOT NULL,
                name VARCHAR(50) NOT NULL,
                value DECIMAL(10, 2) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_month (month)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ 财务支出表创建/检查完成');

        // 9. 创建收养者表
        await connection.query(`
            CREATE TABLE IF NOT EXISTS adopter (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(50) NOT NULL,
                age INT,
                sex ENUM('男', '女'),
                pet VARCHAR(100),
                visit ENUM('是', '否'),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ 收养者表创建/检查完成');

        // 插入默认用户（使用动态生成的哈希）
        const [userCount] = await connection.query('SELECT COUNT(*) as count FROM users');
        if (userCount[0].count === 0) {
            console.log('🔑 正在创建默认用户...');

            const adminPassword = await bcrypt.hash('123456', 10);
            const userPassword = await bcrypt.hash('123456', 10);

            await connection.query(`
                INSERT INTO users (username, email, password, role, name) VALUES 
                ('admin', 'admin@example.com', ?, 'admin', '系统管理员'),
                ('user', 'user@example.com', ?, 'user', '普通用户')
            `, [adminPassword, userPassword]);

            console.log('✅ 已创建默认用户：admin (123456) 和 user (123456)');
        } else {
            console.log('ℹ️ 用户表已有数据，跳过用户初始化');
        }

        // 插入员工初始数据
        const [staffCount] = await connection.query('SELECT COUNT(*) as count FROM staff');
        if (staffCount[0].count === 0) {
            console.log('👥 正在初始化员工数据...');

            const initialStaff = [
                [1, '张三', '兽医', '医护岗', '在职',
                    '{"diagnosisCount":45,"surgeryCount":30,"healthRecords":50,"vaccineInjections":100}',
                    '2021-03-15'],
                [2, '李四', '兽医助理', '医护岗', '在职',
                    '{"assistOperations":40,"careAnimals":60,"cleanCages":120,"monitorRecovery":25}',
                    '2022-07-08'],
                [3, '王五', '行政专员', '行政岗', '离职',
                    '{"attendanceRecords":25,"procurementCategories":8,"fileArrangements":150}',
                    '2022-01-20'],
                [4, '赵六', '领养协调员', '行政岗', '在职',
                    '{"adoptionConsultations":60,"approvedApplications":20,"postAdoptionTracking":15,"promotionArticles":10}',
                    '2023-02-10'],
                [5, '孙七', '财务专员', '行政岗', '在职',
                    '{"financialReports":2,"transactionRecords":100,"publicDisclosures":1,"donationManagement":30000}',
                    '2021-11-05'],
                [6, '周八', '宣传与运营专员', '行政岗', '在职',
                    '{"platformAnnouncements":8,"petInfoUpdates":20,"fundraisingEvents":1,"socialReach":80000}',
                    '2023-05-18']
            ];

            await connection.query(`
                INSERT INTO staff (id, name, position, department, status, monthly_data, join_date)
                VALUES ?
            `, [initialStaff]);

            console.log('✅ 已创建默认员工数据，共6条');
        } else {
            console.log('ℹ️ 员工表已有数据，跳过员工初始化');
        }

        console.log('🎉 数据库表初始化完成');

    } catch (error) {
        console.error('❌ 数据库初始化失败:', error);
        throw error;
    } finally {
        connection.release();
    }
}

module.exports = {
    pool,
    testConnection,
    initDatabase
};