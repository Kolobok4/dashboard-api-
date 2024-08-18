import express, { Express } from 'express';
import { Server } from 'http';
import { UserController } from './users/users.controller';
import { inject, injectable } from 'inversify';
import { TYPES } from './types';
import { ILogger } from './logger/logger.interface';
import { json } from 'body-parser';
import 'reflect-metadata';
import { IExeptionFilter } from './errors/exeption.filter.interface';
import { IConfigService } from './config/config.service.interface';
import { PrismaService } from './database/prisma.service';
import { UsersRepository } from './users/users.repository';
import { AuthMiddleware } from './common/auth.middleware';

@injectable()
export class App {
	app: Express;
	server: Server;
	port: number;

	constructor(
		@inject(TYPES.ILogger) private logger: ILogger,
		@inject(TYPES.UserController) private userController: UserController,
		@inject(TYPES.ExeptionFilter) private exeptionFilter: IExeptionFilter,
		@inject(TYPES.ConfigService) private configService: IConfigService,
		@inject(TYPES.PrismaService) private prismaService: PrismaService,
		@inject(TYPES.UsersRepository) private usersRepository: UsersRepository,
	) {
		this.app = express();
		this.port = 8002;
	}
	useMiddlewares(): void {
		this.app.use(json());
		const authMiddleware = new AuthMiddleware(this.configService.get('SECRET'));
		this.app.use(authMiddleware.execute.bind(authMiddleware));
	}
	useRoutes(): void {
		this.app.use('/users', this.userController.router);
	}
	useExeptionFilters(): void {
		this.app.use(this.exeptionFilter.catch.bind(this.exeptionFilter));
	}
	public async init(): Promise<void> {
		this.useMiddlewares();
		this.useRoutes();
		this.useExeptionFilters();
		await this.prismaService.connect();
		this.server = this.app.listen(this.port);
		this.logger.log(`http://localhost:${this.port}`);
	}

	public close(): void {
		this.server.close();
	}
}
