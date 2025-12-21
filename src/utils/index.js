const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
};

const comparePassword = async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
};

const generateToken = (user) => {
    return jwt.sign(
        {
            userId: user.id,
            username: user.username,
            email: user.email,
            role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
};

const successResponse = (data, message = '操作成功') => {
    return {
        code: 200,
        data,
        message,
        timestamp: new Date().toISOString()
    };
};

const errorResponse = (message, code = 400) => {
    return {
        code,
        message,
        timestamp: new Date().toISOString()
    };
};
const validateRequest = (req, requiredFields) => {
    const missingFields = [];

    for (const field of requiredFields) {
        if (!req.body[field]) {
            missingFields.push(field);
        }
    }

    if (missingFields.length > 0) {
        return {
            valid: false,
            message: `缺少必要参数: ${missingFields.join(', ')}`
        };
    }

    return { valid: true };
};

module.exports = {
    hashPassword,
    comparePassword,
    generateToken,
    successResponse,
    errorResponse,
    validateRequest
};