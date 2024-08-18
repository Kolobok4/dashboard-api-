import 'reflect-metadata';
import { Container } from 'inversify';
import { IConfigService } from '../config/config.service.interface';
import { IUsersRepository } from './users.repository.interface';
import { IUserService } from './users.service.interface';
import { TYPES } from '../types';
import { UserService } from './users.service';
import { UserModel } from '@prisma/client';
import { User } from './user.entity';

const ConfigServiceMock: IConfigService = {
	get: jest.fn(),
};

const UsersRepositoryMock: IUsersRepository = {
	find: jest.fn(),
	create: jest.fn(),
};

const container = new Container();
let configService: IConfigService;
let usersRepository: IUsersRepository;
let usersService: IUserService;

beforeAll(() => {
	container.bind<IUserService>(TYPES.UserService).to(UserService);
	container.bind<IConfigService>(TYPES.ConfigService).toConstantValue(ConfigServiceMock);
	container.bind<IUsersRepository>(TYPES.UsersRepository).toConstantValue(UsersRepositoryMock);

	configService = container.get<IConfigService>(TYPES.ConfigService);
	usersRepository = container.get<IUsersRepository>(TYPES.UsersRepository);
	usersService = container.get<IUserService>(TYPES.UserService);
});

let createdUser: UserModel | null = null;

describe('User Service', () => {
	it('createUser', async () => {
		configService.get = jest.fn().mockReturnValue('1');
		usersRepository.create = jest.fn().mockImplementationOnce(
			(user: User): UserModel => ({
				name: user.name,
				email: user.email,
				password: user.password,
				id: 3,
			}),
		);
		createdUser = await usersService.createUser({
			email: 'test@com.ua',
			password: '1',
			name: 'Tester',
		});
		expect(createdUser?.id).toEqual(3);
		expect(createdUser?.password).not.toEqual('1');
	});

	it('validateUser - success ', async () => {
		usersRepository.find = jest.fn().mockReturnValueOnce(createdUser);
		const res = await usersService.validateUser({
			email: 'test@com.ua',
			password: '1',
		});
		expect(res).toBeTruthy();
	});

	it('validateUser - wrong password ', async () => {
		usersRepository.find = jest.fn().mockReturnValueOnce(createdUser);
		const res = await usersService.validateUser({
			email: 'test@com.ua',
			password: '2',
		});
		expect(res).toBeFalsy();
	});

	it('validateUser - wrong user ', async () => {
		usersRepository.find = jest.fn().mockReturnValueOnce(null);
		const res = await usersService.validateUser({
			email: 'test-2@com.ua',
			password: '2',
		});
		expect(res).toBeFalsy();
	});
});
