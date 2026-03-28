CREATE TABLE `documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileUrl` text NOT NULL,
	`fileSize` int NOT NULL,
	`mimeType` varchar(128) NOT NULL,
	`extractedText` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionCode` varchar(32) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`avatarId` varchar(128) NOT NULL,
	`avatarName` varchar(128) NOT NULL,
	`avatarPreviewUrl` text,
	`mode` enum('train','challenge','ask','watch') NOT NULL,
	`language` varchar(16) NOT NULL DEFAULT 'en',
	`voiceId` varchar(128),
	`knowledgeBaseId` varchar(128),
	`systemPrompt` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `sessions_sessionCode_unique` UNIQUE(`sessionCode`)
);
