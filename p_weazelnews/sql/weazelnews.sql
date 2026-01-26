-- =====================================
-- WEAZEL NEWS DATABASE SETUP
-- =====================================

-- Table des articles
CREATE TABLE IF NOT EXISTS `weazelnews_articles` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `content` TEXT NOT NULL,
    `author` VARCHAR(100) NOT NULL,
    `category` VARCHAR(50) DEFAULT 'Actualites',
    `identifier` VARCHAR(60) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_author` (`author`),
    INDEX `idx_category` (`category`),
    INDEX `idx_created_at` (`created_at`),
    INDEX `idx_identifier` (`identifier`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Job Weazel News pour ESX
INSERT INTO `jobs` (`name`, `label`) VALUES
    ('reporter', 'Weazel News')
ON DUPLICATE KEY UPDATE `label` = 'Weazel News';

-- Grades du job
INSERT INTO `job_grades` (`job_name`, `grade`, `name`, `label`, `salary`, `skin_male`, `skin_female`) VALUES
    ('reporter', 0, 'stagiaire', 'Stagiaire', 500, '{}', '{}'),
    ('reporter', 1, 'journaliste', 'Journaliste', 750, '{}', '{}'),
    ('reporter', 2, 'cameraman', 'Cameraman', 800, '{}', '{}'),
    ('reporter', 3, 'redacteur', 'Redacteur en Chef', 1000, '{}', '{}'),
    ('reporter', 4, 'boss', 'Directeur', 1500, '{}', '{}')
ON DUPLICATE KEY UPDATE
    `label` = VALUES(`label`),
    `salary` = VALUES(`salary`);
