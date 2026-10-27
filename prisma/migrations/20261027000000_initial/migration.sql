-- Use exact, case-sensitive, NO PAD ID comparisons to match Firestore document IDs.
-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci;

-- CreateTable
CREATE TABLE `Chat` (
    `id` VARCHAR(191) NOT NULL,
    `pairKey` CHAR(64) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Chat_pairKey_key`(`pairKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci;

-- CreateTable
CREATE TABLE `ChatMember` (
    `chatId` VARCHAR(100) NOT NULL,
    `userId` VARCHAR(100) NOT NULL,

    INDEX `ChatMember_userId_idx` (`userId`),
    PRIMARY KEY (`chatId`, `userId`)
) ENGINE=InnoDB
DEFAULT CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ChatMember` ADD CONSTRAINT `ChatMember_chatId_fkey` FOREIGN KEY (`chatId`) REFERENCES `Chat`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatMember` ADD CONSTRAINT `ChatMember_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

