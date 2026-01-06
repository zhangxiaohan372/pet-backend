/*
 Navicat Premium Dump SQL

 Source Server         : pet_manegement
 Source Server Type    : MySQL
 Source Server Version : 80043 (8.0.43)
 Source Host           : localhost:3306
 Source Schema         : pet_management

 Target Server Type    : MySQL
 Target Server Version : 80043 (8.0.43)
 File Encoding         : 65001

 Date: 24/12/2025 18:19:27
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for adopter
-- ----------------------------
DROP TABLE IF EXISTS `adopter`;
CREATE TABLE `adopter`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `age` int NULL DEFAULT NULL,
  `sex` enum('男','女') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `pet` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `visit` enum('是','否') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `pet_id` int NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `fk_adopter_pet`(`pet_id` ASC) USING BTREE,
  CONSTRAINT `fk_adopter_pet` FOREIGN KEY (`pet_id`) REFERENCES `cats` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 5 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of adopter
-- ----------------------------
INSERT INTO `adopter` VALUES (1, '李华', 30, '女', '小花（猫）', '是', '2023-10-06 10:20:00', 2);
INSERT INTO `adopter` VALUES (2, '王芳', 27, '女', '奶茶（猫）', '是', '2023-10-07 15:30:00', 5);
INSERT INTO `adopter` VALUES (3, '张伟', 35, '男', '贝贝（狗）', '是', '2023-09-21 09:15:00', 2);
INSERT INTO `adopter` VALUES (4, '刘刚', 42, '男', '大壮（狗）', '否', '2023-10-16 14:40:00', 5);

-- ----------------------------
-- Table structure for cats
-- ----------------------------
DROP TABLE IF EXISTS `cats`;
CREATE TABLE `cats`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `gender` enum('公','母') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `health` enum('良好','一般','较差') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '良好',
  `adopted` enum('已收养','未收养') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '未收养',
  `rescue_track` json NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_adopted`(`adopted` ASC) USING BTREE,
  INDEX `idx_health`(`health` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 7 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of cats
-- ----------------------------
INSERT INTO `cats` VALUES (1, '小白', '公', '良好', '未收养', '[{\"time\": \"2023-10-01\", \"event\": \"中心公园发现，右前腿受伤\"}, {\"time\": \"2023-10-02\", \"event\": \"送至宠物医院治疗\"}]', '2025-12-20 20:07:34');
INSERT INTO `cats` VALUES (2, '小花', '母', '良好', '已收养', '[{\"time\": \"2023-09-15\", \"event\": \"幸福小区门口被遗弃\"}]', '2025-12-20 20:07:34');
INSERT INTO `cats` VALUES (3, '小黑', '公', '一般', '未收养', '[{\"time\": \"2023-10-08\", \"event\": \"商业街发现，患轻微猫癣\"}]', '2025-12-20 20:07:34');
INSERT INTO `cats` VALUES (4, '小橘', '公', '良好', '未收养', '[{\"time\": \"2023-11-01\", \"event\": \"垃圾站附近发现\"}, {\"time\": \"2023-11-02\", \"event\": \"完成疫苗注射\"}]', '2025-12-20 20:07:34');
INSERT INTO `cats` VALUES (5, '奶茶', '母', '一般', '已收养', '[{\"time\": \"2023-10-20\", \"event\": \"被遗弃在宠物医院门口\"}, {\"time\": \"2023-10-21\", \"event\": \"进行健康检查\"}, {\"time\": \"2023-10-25\", \"event\": \"完成绝育手术\"}]', '2025-12-20 20:07:34');
INSERT INTO `cats` VALUES (6, '煤球', '公', '良好', '未收养', '[{\"time\": \"2023-11-10\", \"event\": \"在停车场发现\"}]', '2025-12-20 20:07:34');

-- ----------------------------
-- Table structure for dogs
-- ----------------------------
DROP TABLE IF EXISTS `dogs`;
CREATE TABLE `dogs`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `gender` enum('公','母') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `health` enum('良好','一般','较差') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '良好',
  `adopted` enum('已收养','未收养') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '未收养',
  `rescue_track` json NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 7 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of dogs
-- ----------------------------
INSERT INTO `dogs` VALUES (1, '旺财', '公', '良好', '未收养', '[{\"time\": \"2023-10-05\", \"event\": \"流浪在火车站广场\"}, {\"time\": \"2023-10-06\", \"event\": \"接种狂犬疫苗\"}]', '2025-12-20 20:08:06');
INSERT INTO `dogs` VALUES (2, '贝贝', '母', '一般', '已收养', '[{\"time\": \"2023-09-20\", \"event\": \"被救助于郊区公路\"}, {\"time\": \"2023-09-25\", \"event\": \"完成绝育手术\"}]', '2025-12-20 20:08:06');
INSERT INTO `dogs` VALUES (3, '阿黄', '公', '较差', '未收养', '[{\"time\": \"2023-10-10\", \"event\": \"发现时患有细小病毒\"}, {\"time\": \"2023-10-12\", \"event\": \"开始住院治疗\"}, {\"time\": \"2023-10-20\", \"event\": \"病情好转，转入恢复期\"}]', '2025-12-20 20:08:06');
INSERT INTO `dogs` VALUES (4, '豆豆', '母', '良好', '未收养', '[{\"time\": \"2023-11-05\", \"event\": \"在公园发现，无明显外伤\"}, {\"time\": \"2023-11-06\", \"event\": \"进行驱虫和体检\"}]', '2025-12-20 20:08:06');
INSERT INTO `dogs` VALUES (5, '大壮', '公', '一般', '已收养', '[{\"time\": \"2023-10-15\", \"event\": \"被遗弃在救助站门口\"}, {\"time\": \"2023-10-16\", \"event\": \"发现腿部有旧伤\"}, {\"time\": \"2023-10-18\", \"event\": \"进行物理治疗\"}]', '2025-12-20 20:08:06');
INSERT INTO `dogs` VALUES (6, '小白', '母', '良好', '未收养', '[{\"time\": \"2023-11-12\", \"event\": \"在学校附近发现\"}, {\"time\": \"2023-11-13\", \"event\": \"进行疫苗接种\"}]', '2025-12-20 20:08:06');

-- ----------------------------
-- Table structure for financial_expense
-- ----------------------------
DROP TABLE IF EXISTS `financial_expense`;
CREATE TABLE `financial_expense`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `month` varchar(7) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` decimal(10, 2) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_month`(`month` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 31 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of financial_expense
-- ----------------------------
INSERT INTO `financial_expense` VALUES (1, '2025-01', '人员工资', 42000.00, '2025-12-20 20:09:19');
INSERT INTO `financial_expense` VALUES (2, '2025-01', '设备采购', 18000.00, '2025-12-20 20:09:19');
INSERT INTO `financial_expense` VALUES (3, '2025-01', '运营成本', 12000.00, '2025-12-20 20:09:19');
INSERT INTO `financial_expense` VALUES (4, '2025-01', '维护费用', 8000.00, '2025-12-20 20:09:19');
INSERT INTO `financial_expense` VALUES (5, '2025-01', '其他支出', 4000.00, '2025-12-20 20:09:19');
INSERT INTO `financial_expense` VALUES (6, '2025-02', '人员工资', 43000.00, '2025-12-20 20:09:19');
INSERT INTO `financial_expense` VALUES (7, '2025-02', '设备采购', 19000.00, '2025-12-20 20:09:19');
INSERT INTO `financial_expense` VALUES (8, '2025-02', '运营成本', 13000.00, '2025-12-20 20:09:19');
INSERT INTO `financial_expense` VALUES (9, '2025-02', '维护费用', 8500.00, '2025-12-20 20:09:19');
INSERT INTO `financial_expense` VALUES (10, '2025-02', '其他支出', 4500.00, '2025-12-20 20:09:19');
INSERT INTO `financial_expense` VALUES (11, '2025-03', '人员工资', 45000.00, '2025-12-20 20:09:19');
INSERT INTO `financial_expense` VALUES (12, '2025-03', '设备采购', 20000.00, '2025-12-20 20:09:19');
INSERT INTO `financial_expense` VALUES (13, '2025-03', '运营成本', 15000.00, '2025-12-20 20:09:19');
INSERT INTO `financial_expense` VALUES (14, '2025-03', '维护费用', 10000.00, '2025-12-20 20:09:19');
INSERT INTO `financial_expense` VALUES (15, '2025-03', '其他支出', 5000.00, '2025-12-20 20:09:19');
INSERT INTO `financial_expense` VALUES (16, '2025-04', '人员工资', 46000.00, '2025-12-20 20:09:19');
INSERT INTO `financial_expense` VALUES (17, '2025-04', '设备采购', 21000.00, '2025-12-20 20:09:19');
INSERT INTO `financial_expense` VALUES (18, '2025-04', '运营成本', 15500.00, '2025-12-20 20:09:19');
INSERT INTO `financial_expense` VALUES (19, '2025-04', '维护费用', 10500.00, '2025-12-20 20:09:19');
INSERT INTO `financial_expense` VALUES (20, '2025-04', '其他支出', 5500.00, '2025-12-20 20:09:19');
INSERT INTO `financial_expense` VALUES (21, '2025-05', '人员工资', 47000.00, '2025-12-20 20:09:19');
INSERT INTO `financial_expense` VALUES (22, '2025-05', '设备采购', 22000.00, '2025-12-20 20:09:19');
INSERT INTO `financial_expense` VALUES (23, '2025-05', '运营成本', 16000.00, '2025-12-20 20:09:19');
INSERT INTO `financial_expense` VALUES (24, '2025-05', '维护费用', 11000.00, '2025-12-20 20:09:19');
INSERT INTO `financial_expense` VALUES (25, '2025-05', '其他支出', 6000.00, '2025-12-20 20:09:19');
INSERT INTO `financial_expense` VALUES (26, '2025-06', '人员工资', 48000.00, '2025-12-20 20:09:19');
INSERT INTO `financial_expense` VALUES (27, '2025-06', '设备采购', 23000.00, '2025-12-20 20:09:19');
INSERT INTO `financial_expense` VALUES (28, '2025-06', '运营成本', 16500.00, '2025-12-20 20:09:19');
INSERT INTO `financial_expense` VALUES (29, '2025-06', '维护费用', 11500.00, '2025-12-20 20:09:19');
INSERT INTO `financial_expense` VALUES (30, '2025-06', '其他支出', 6500.00, '2025-12-20 20:09:19');

-- ----------------------------
-- Table structure for financial_income
-- ----------------------------
DROP TABLE IF EXISTS `financial_income`;
CREATE TABLE `financial_income`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `month` varchar(7) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` decimal(10, 2) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_month`(`month` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 31 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of financial_income
-- ----------------------------
INSERT INTO `financial_income` VALUES (1, '2025-01', '个人募捐', 32000.00, '2025-12-20 20:09:19');
INSERT INTO `financial_income` VALUES (2, '2025-01', '医院收入', 23000.00, '2025-12-20 20:09:19');
INSERT INTO `financial_income` VALUES (3, '2025-01', '企业赞助', 14000.00, '2025-12-20 20:09:19');
INSERT INTO `financial_income` VALUES (4, '2025-01', '政府补助', 9000.00, '2025-12-20 20:09:19');
INSERT INTO `financial_income` VALUES (5, '2025-01', '其他收入', 2000.00, '2025-12-20 20:09:19');
INSERT INTO `financial_income` VALUES (6, '2025-02', '个人募捐', 33000.00, '2025-12-20 20:09:19');
INSERT INTO `financial_income` VALUES (7, '2025-02', '医院收入', 24000.00, '2025-12-20 20:09:19');
INSERT INTO `financial_income` VALUES (8, '2025-02', '企业赞助', 14500.00, '2025-12-20 20:09:19');
INSERT INTO `financial_income` VALUES (9, '2025-02', '政府补助', 8500.00, '2025-12-20 20:09:19');
INSERT INTO `financial_income` VALUES (10, '2025-02', '其他收入', 3000.00, '2025-12-20 20:09:19');
INSERT INTO `financial_income` VALUES (11, '2025-03', '个人募捐', 35000.00, '2025-12-20 20:09:19');
INSERT INTO `financial_income` VALUES (12, '2025-03', '医院收入', 25000.00, '2025-12-20 20:09:19');
INSERT INTO `financial_income` VALUES (13, '2025-03', '企业赞助', 15000.00, '2025-12-20 20:09:19');
INSERT INTO `financial_income` VALUES (14, '2025-03', '政府补助', 8000.00, '2025-12-20 20:09:19');
INSERT INTO `financial_income` VALUES (15, '2025-03', '其他收入', 2000.00, '2025-12-20 20:09:19');
INSERT INTO `financial_income` VALUES (16, '2025-04', '个人募捐', 38000.00, '2025-12-20 20:09:19');
INSERT INTO `financial_income` VALUES (17, '2025-04', '医院收入', 26000.00, '2025-12-20 20:09:19');
INSERT INTO `financial_income` VALUES (18, '2025-04', '企业赞助', 16000.00, '2025-12-20 20:09:19');
INSERT INTO `financial_income` VALUES (19, '2025-04', '政府补助', 8500.00, '2025-12-20 20:09:19');
INSERT INTO `financial_income` VALUES (20, '2025-04', '其他收入', 1500.00, '2025-12-20 20:09:19');
INSERT INTO `financial_income` VALUES (21, '2025-05', '个人募捐', 40000.00, '2025-12-20 20:09:19');
INSERT INTO `financial_income` VALUES (22, '2025-05', '医院收入', 27000.00, '2025-12-20 20:09:19');
INSERT INTO `financial_income` VALUES (23, '2025-05', '企业赞助', 16500.00, '2025-12-20 20:09:19');
INSERT INTO `financial_income` VALUES (24, '2025-05', '政府补助', 7000.00, '2025-12-20 20:09:19');
INSERT INTO `financial_income` VALUES (25, '2025-05', '其他收入', 1500.00, '2025-12-20 20:09:19');
INSERT INTO `financial_income` VALUES (26, '2025-06', '个人募捐', 42000.00, '2025-12-20 20:09:19');
INSERT INTO `financial_income` VALUES (27, '2025-06', '医院收入', 28000.00, '2025-12-20 20:09:19');
INSERT INTO `financial_income` VALUES (28, '2025-06', '企业赞助', 17000.00, '2025-12-20 20:09:19');
INSERT INTO `financial_income` VALUES (29, '2025-06', '政府补助', 6500.00, '2025-12-20 20:09:19');
INSERT INTO `financial_income` VALUES (30, '2025-06', '其他收入', 1500.00, '2025-12-20 20:09:19');

-- ----------------------------
-- Table structure for notices
-- ----------------------------
DROP TABLE IF EXISTS `notices`;
CREATE TABLE `notices`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `publisher` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `status` enum('active','inactive') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'active',
  `publish_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE,
  INDEX `idx_publish_time`(`publish_time` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 10 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of notices
-- ----------------------------
INSERT INTO `notices` VALUES (1, '系统维护通知', '本周六晚上10点至周日凌晨2点进行系统维护，届时系统将无法访问，请提前安排好工作。', '管理员', 'active', '2024-06-10 09:00:00');
INSERT INTO `notices` VALUES (2, '领养日活动通知', '本周末将在中心公园举办宠物领养日活动，现场有多只可爱的猫狗等待领养，欢迎大家前来参与！', '领养协调员', 'active', '2024-06-12 14:30:00');
INSERT INTO `notices` VALUES (3, '志愿者招募', '救助站现招募周末志愿者，主要负责照顾动物、清洁笼舍等工作，有意者请联系我们。', '志愿者管理部', 'active', '2024-06-13 10:15:00');
INSERT INTO `notices` VALUES (4, '捐款渠道更新', '感谢各位爱心人士的支持！我们的捐款渠道已更新，新增支付宝和微信支付方式，详情请查看官网。', '财务部', 'active', '2024-06-14 16:20:00');
INSERT INTO `notices` VALUES (5, '医疗物资捐赠', '现急需宠物医疗物资：宠物专用消毒液、绷带、注射器等，如有捐赠意向请联系我们。', '医疗部', 'active', '2024-06-15 11:45:00');
INSERT INTO `notices` VALUES (6, '领养成功案例', '恭喜\"小白\"和\"奶茶\"找到了温暖的家！感谢领养者的爱心，让它们有了新的生活。', '宣传与运营部', 'active', '2024-06-16 15:10:00');
INSERT INTO `notices` VALUES (7, '紧急求助：狗狗阿黄需要帮助', '狗狗阿黄目前病情较重，治疗费用较高，恳请爱心人士伸出援手，帮助它渡过难关。', '医疗部', 'active', '2024-06-17 08:30:00');
INSERT INTO `notices` VALUES (8, '社区宣传活动', '下周将在各社区开展宠物保护宣传活动，普及科学养宠知识，欢迎居民参与。', '宣传与运营部', 'active', '2024-06-18 13:25:00');

-- ----------------------------
-- Table structure for staff
-- ----------------------------
DROP TABLE IF EXISTS `staff`;
CREATE TABLE `staff`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `position` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `department` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('在职','离职') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '在职',
  `monthly_data` json NOT NULL,
  `join_date` date NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 8 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of staff
-- ----------------------------
INSERT INTO `staff` VALUES (1, '张三', '兽医', '医护岗', '在职', '{\"surgeryCount\": 30, \"healthRecords\": 50, \"diagnosisCount\": 45, \"vaccineInjections\": 100}', '2021-03-15', '2025-12-20 19:39:16', '2025-12-20 19:39:16');
INSERT INTO `staff` VALUES (2, '李四', '兽医助理', '医护岗', '在职', '{\"cleanCages\": 120, \"careAnimals\": 60, \"monitorRecovery\": 25, \"assistOperations\": 40}', '2022-07-08', '2025-12-20 19:39:16', '2025-12-20 19:39:16');
INSERT INTO `staff` VALUES (3, '王五', '行政专员', '行政岗', '离职', '{\"fileArrangements\": 150, \"attendanceRecords\": 25, \"procurementCategories\": 8}', '2022-01-20', '2025-12-20 19:39:16', '2025-12-20 19:39:16');
INSERT INTO `staff` VALUES (4, '赵六', '领养协调员', '行政岗', '在职', '{\"promotionArticles\": 10, \"approvedApplications\": 20, \"postAdoptionTracking\": 15, \"adoptionConsultations\": 60}', '2023-02-10', '2025-12-20 19:39:16', '2025-12-20 19:39:16');
INSERT INTO `staff` VALUES (5, '孙七', '财务专员', '行政岗', '在职', '{\"financialReports\": 2, \"publicDisclosures\": 1, \"donationManagement\": 30000, \"transactionRecords\": 100}', '2021-11-05', '2025-12-20 19:39:16', '2025-12-20 19:39:16');
INSERT INTO `staff` VALUES (6, '周八', '宣传与运营专员', '行政岗', '在职', '{\"socialReach\": 80000, \"petInfoUpdates\": 20, \"fundraisingEvents\": 1, \"platformAnnouncements\": 8}', '2023-05-18', '2025-12-20 19:39:16', '2025-12-20 19:39:16');

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('admin','user','veterinarian') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'user',
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `avatar` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `username`(`username` ASC) USING BTREE,
  UNIQUE INDEX `email`(`email` ASC) USING BTREE,
  INDEX `idx_username`(`username` ASC) USING BTREE,
  INDEX `idx_email`(`email` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of users
-- ----------------------------
INSERT INTO `users` VALUES (1, 'admin', 'admin@example.com', '$2b$10$bnaoSwN7ybXUV3DtOcPrIuOHH7zLydN13smajtodakGfI2o5/x//.', 'admin', '系统管理员', NULL, '2025-12-20 19:39:16', '2025-12-20 19:39:16');
INSERT INTO `users` VALUES (2, 'user', 'user@example.com', '$2b$10$yzHBSj4GF6exD6sW/swldehzZEcK8VP7cqtqoUOkOFB4rMn/EGade', 'user', '普通用户', NULL, '2025-12-20 19:39:16', '2025-12-20 19:39:16');

-- ----------------------------
-- Table structure for volunteer_applications
-- ----------------------------
DROP TABLE IF EXISTS `volunteer_applications`;
CREATE TABLE `volunteer_applications`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `application_date` date NOT NULL,
  `introduce` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `status` enum('待处理','已通过','未通过') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '待处理',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 9 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of volunteer_applications
-- ----------------------------
INSERT INTO `volunteer_applications` VALUES (1, '杨紫涵', 'yangzihan@example.com', '13800138000', '2025-12-01', '本人有5年宠物救助经验，每周可参与3天志愿工作，擅长宠物护理和喂养。', '待处理', '2025-12-20 20:38:56');
INSERT INTO `volunteer_applications` VALUES (2, '李浩宇', 'lihaoyu@example.com', '13900139000', '2025-12-03', '退休人员，时间充裕，家住救助站附近，可负责日常清洁和宠物陪伴。', '待处理', '2025-12-20 20:38:56');
INSERT INTO `volunteer_applications` VALUES (3, '王嘉怡', 'wangjiayi@example.com', '13700137000', '2025-12-05', '学生，周末可参与志愿活动，擅长新媒体运营，可帮忙宣传救助信息。', '待处理', '2025-12-20 20:38:56');
INSERT INTO `volunteer_applications` VALUES (4, '陈俊辉', 'chenjunhui@example.com', '13600136000', '2025-11-20', '兽医专业毕业，可提供免费的宠物健康检查，已通过面试和背景审核。', '已通过', '2025-12-20 20:38:56');
INSERT INTO `volunteer_applications` VALUES (5, '刘思琪', 'liusiqi@example.com', '13500135000', '2025-11-15', '企业职员，每月捐赠物资并周末参与志愿，考核合格已通过。', '已通过', '2025-12-20 20:38:56');
INSERT INTO `volunteer_applications` VALUES (6, '张宇轩', 'zhangyuxuan@example.com', '13400134000', '2025-11-10', '宠物训练师，可免费训练救助宠物，提升领养率，已通过资质审核。', '已通过', '2025-12-20 20:38:56');
INSERT INTO `volunteer_applications` VALUES (7, '周梦婷', 'zhoumengting@example.com', '13200132000', '2025-12-02', '申请信息填写不完整，且无相关宠物照料经验，审核未通过。', '未通过', '2025-12-20 20:38:56');
INSERT INTO `volunteer_applications` VALUES (8, '马子昂', 'maziang@example.com', '13100131000', '2025-12-04', '背景调查发现有虐待宠物记录，不符合志愿条件，审核未通过。', '未通过', '2025-12-20 20:38:56');

SET FOREIGN_KEY_CHECKS = 1;
