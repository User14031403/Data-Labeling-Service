CREATE TABLE `apiKeys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`keyHash` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`lastUsedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`revokedAt` timestamp,
	CONSTRAINT `apiKeys_id` PRIMARY KEY(`id`),
	CONSTRAINT `apiKeys_keyHash_unique` UNIQUE(`keyHash`)
);
--> statement-breakpoint
CREATE TABLE `batchJobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`batchId` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`dataType` enum('text','image','audio') NOT NULL,
	`taxonomyId` int NOT NULL,
	`status` enum('submitted','processing','completed','failed') NOT NULL DEFAULT 'submitted',
	`totalItems` int NOT NULL,
	`processedItems` int NOT NULL DEFAULT 0,
	`resultsUrl` varchar(2048),
	`errorMessage` text,
	`submittedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`expiresAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `batchJobs_id` PRIMARY KEY(`id`),
	CONSTRAINT `batchJobs_batchId_unique` UNIQUE(`batchId`)
);
--> statement-breakpoint
CREATE TABLE `datasetItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`datasetId` int NOT NULL,
	`content` text,
	`fileUrl` varchar(2048),
	`fileKey` varchar(1024),
	`mimeType` varchar(100),
	`metadata` text,
	`status` enum('raw','cleaned','labeled','error') NOT NULL DEFAULT 'raw',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `datasetItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `datasets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`dataType` enum('text','image','audio','mixed') NOT NULL,
	`ownerId` int NOT NULL,
	`status` enum('active','archived','processing') NOT NULL DEFAULT 'active',
	`itemCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `datasets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `labelTaxonomy` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`dataType` enum('text','image','audio') NOT NULL,
	`description` text,
	`labels` text NOT NULL,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `labelTaxonomy_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `labelingTasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`datasetId` int NOT NULL,
	`taxonomyId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`progress` int NOT NULL DEFAULT 0,
	`totalItems` int NOT NULL,
	`processedItems` int NOT NULL DEFAULT 0,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `labelingTasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `labels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`itemId` int NOT NULL,
	`taskId` int NOT NULL,
	`predictedLabel` text,
	`manualLabel` text,
	`confidence` int,
	`source` enum('ai','manual','hybrid') NOT NULL DEFAULT 'ai',
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `labels_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `apiKeys` ADD CONSTRAINT `apiKeys_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `batchJobs` ADD CONSTRAINT `batchJobs_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `batchJobs` ADD CONSTRAINT `batchJobs_taxonomyId_labelTaxonomy_id_fk` FOREIGN KEY (`taxonomyId`) REFERENCES `labelTaxonomy`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `datasetItems` ADD CONSTRAINT `datasetItems_datasetId_datasets_id_fk` FOREIGN KEY (`datasetId`) REFERENCES `datasets`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `datasets` ADD CONSTRAINT `datasets_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `labelTaxonomy` ADD CONSTRAINT `labelTaxonomy_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `labelingTasks` ADD CONSTRAINT `labelingTasks_datasetId_datasets_id_fk` FOREIGN KEY (`datasetId`) REFERENCES `datasets`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `labelingTasks` ADD CONSTRAINT `labelingTasks_taxonomyId_labelTaxonomy_id_fk` FOREIGN KEY (`taxonomyId`) REFERENCES `labelTaxonomy`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `labelingTasks` ADD CONSTRAINT `labelingTasks_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `labels` ADD CONSTRAINT `labels_itemId_datasetItems_id_fk` FOREIGN KEY (`itemId`) REFERENCES `datasetItems`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `labels` ADD CONSTRAINT `labels_taskId_labelingTasks_id_fk` FOREIGN KEY (`taskId`) REFERENCES `labelingTasks`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `labels` ADD CONSTRAINT `labels_reviewedBy_users_id_fk` FOREIGN KEY (`reviewedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;