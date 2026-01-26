-- =====================================
-- WEAZEL NEWS DATABASE SETUP
-- =====================================

-- Table des articles (brouillons et publies)
CREATE TABLE IF NOT EXISTS `weazelnews_articles` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `subtitle` VARCHAR(255) DEFAULT NULL,
    `content` TEXT NOT NULL,
    `author` VARCHAR(100) NOT NULL,
    `category` VARCHAR(50) DEFAULT 'Actualites',
    `identifier` VARCHAR(60) NOT NULL,
    `images` JSON DEFAULT NULL,
    `status` ENUM('draft', 'published', 'printed') DEFAULT 'draft',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_author` (`author`),
    INDEX `idx_category` (`category`),
    INDEX `idx_status` (`status`),
    INDEX `idx_created_at` (`created_at`),
    INDEX `idx_identifier` (`identifier`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des notes des reporters
CREATE TABLE IF NOT EXISTS `weazelnews_notes` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `identifier` VARCHAR(60) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `content` TEXT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_identifier` (`identifier`),
    INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des journaux imprimes (editions)
CREATE TABLE IF NOT EXISTS `weazelnews_editions` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `edition_name` VARCHAR(255) NOT NULL,
    `article_ids` JSON NOT NULL,
    `ads_data` JSON DEFAULT NULL,
    `layout_data` JSON DEFAULT NULL,
    `template` VARCHAR(50) DEFAULT 'classic',
    `printed_by` VARCHAR(100) NOT NULL,
    `identifier` VARCHAR(60) NOT NULL,
    `price` INT(11) DEFAULT 50,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_identifier` (`identifier`),
    INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Migration pour les anciennes tables (ajouter les colonnes si elles n'existent pas)
-- ALTER TABLE `weazelnews_editions` ADD COLUMN IF NOT EXISTS `ads_data` JSON DEFAULT NULL;
-- ALTER TABLE `weazelnews_editions` ADD COLUMN IF NOT EXISTS `layout_data` JSON DEFAULT NULL;
-- ALTER TABLE `weazelnews_editions` ADD COLUMN IF NOT EXISTS `template` VARCHAR(50) DEFAULT 'classic';

-- Table du stock des points de vente
CREATE TABLE IF NOT EXISTS `weazelnews_vendor_stock` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `vendor_id` INT(11) NOT NULL,
    `edition_id` INT(11) NOT NULL,
    `quantity` INT(11) DEFAULT 0,
    `added_by` VARCHAR(60) NOT NULL,
    `added_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `unique_vendor_edition` (`vendor_id`, `edition_id`),
    INDEX `idx_vendor_id` (`vendor_id`),
    INDEX `idx_edition_id` (`edition_id`),
    FOREIGN KEY (`edition_id`) REFERENCES `weazelnews_editions`(`id`) ON DELETE CASCADE
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
