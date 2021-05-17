import { authenticate, TokenService } from '@loopback/authentication';
import { authorize } from '@loopback/authorization';
import { inject } from '@loopback/core';
import { Count, CountSchema, Filter, FilterExcludingWhere, model, property, repository, Where } from '@loopback/repository';
import { post, param, get, getModelSchemaRef, patch, put, del, requestBody, response } from '@loopback/rest';
import { SecurityBindings, securityId, UserProfile } from '@loopback/security';
import _ from 'lodash';
import { PasswordHasherBindings, TokenServiceBindings, UserServiceBindings } from '../keys';
import { basicAuthorization } from '../middlewares/auth.midd';
import { User } from '../models';
import { Credentials, UserRepository } from '../repositories';
import { BcryptHasher } from '../services/hash.password.bcrypt-service';
import { MyUserService } from '../services/user-service';
import { validateCredentials } from '../services/validator-service';
import { UserProfileSchema } from './specs/user-controller.spec';

@model()
export class NewUserRequest extends User {
  @property({
    type: 'string',
    required: true,
  })
  password: string;
}

export class UserController {
  constructor(
    @repository(UserRepository)
    public userRepository: UserRepository,
    @inject(PasswordHasherBindings.PASSWORD_HASHER)
    public hasher: BcryptHasher,
    @inject(UserServiceBindings.USER_SERVICE)
    public userService: MyUserService,
    @inject(TokenServiceBindings.TOKEN_SERVICE)
    public jwtService: TokenService,
  ) {}

  @post('/users/signup')
  @response(200, {
    description: 'User-Login',
    content: {'application/json': {schema: getModelSchemaRef(User, {exclude: ['password'],})}},
  })
  async signup(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(User, {
            title: 'NewUser',
            exclude: ['id', 'role'],
          }),
        },
      },
    })
    newUserRequest: Credentials,
    //user: Omit<User, 'id'>,
  ): Promise<User> {
    newUserRequest.role = 'user';
    //validate user credentials
    validateCredentials(_.pick(newUserRequest, ['email', 'password']));
    //encrypt user password
    //encrypt the password
    const password = await this.hasher.hashPassword(
    newUserRequest.password,
    );
   
    return await this.userRepository.create(
      _.omit(newUserRequest, 'password'),
    );
  }

  @post('/users/login', {
    responses: {
      '200': {
        description: 'Token',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                token: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
    },
  })
  async login(
    @requestBody({
      description: 'The input of login function',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['email', 'password'],
            properties: {
              email: {
                type: 'string',
                format: 'email',
              },
              password: {
                type: 'string',
                minLength: 8,
              },
            },
          },
        },
      },
    }) credentials: Credentials,
  ): Promise<{token: string}> {
    // ensure the user exists, and the password is correct
    const user = await this.userService.verifyCredentials(credentials);

    // convert a User object into a UserProfile object (reduced set of properties)
    const userProfile = this.userService.convertToUserProfile(user);

    // create a JSON Web Token based on the user profile
    const token = await this.jwtService.generateToken(userProfile);

    return {token};
  }

  @get('/users/me', {
    responses: {
      '200': {
        description: 'The current user profile',
        content: {
          'application/json': {
            schema: UserProfileSchema,
          },
        },
      },
    },
  })
  @authenticate('jwt')
  async printCurrentUser(
    @inject(SecurityBindings.USER)
      currentUserProfile: UserProfile,
  ): Promise<User> {

    const userId = currentUserProfile[securityId];
    return this.userRepository.findById(Number(userId));
  }

  @del('/users/{id}')
  @response(204, {
    description: 'User DELETE success',
  })
  @authenticate('jwt')
  @authorize({
    allowedRoles: ['admin'],
    voters: [basicAuthorization],
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.userRepository.deleteById(id);
  }

  @post('/users/signup/admin')
  @response(200, {
    description: 'User',
    content: {'application/json': {schema: getModelSchemaRef(User, {exclude: ['password'],})}},
  })
  async createAdmin(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(User, {
            title: 'NewAdmin',
            exclude: ['id', 'role'],
          }),
        },
      },
    })
    admin: Credentials,
    //user: Omit<User, 'id'>,
  ): Promise<User> {
    admin.role = 'admin';
    //validate user credentials
    validateCredentials(_.pick(admin, ['email', 'password']));
    //encrypt user password
    admin.password = await this.hasher.hashPassword(admin.password);
    return this.userRepository.create(admin);
  }

  @get('/users/{id}', {
    responses: {
      '200': {
        description: 'User',
        content: {
          'application/json': {
            schema: {
              'x-ts-type': User,
            },
          },
        },
      },
    },
  })
  @authenticate('jwt')
  @authorize({
    allowedRoles: ['admin'],
    voters: [basicAuthorization],
  })
  async findById(@param.path.string('id') userId: string): Promise<User> {
    return this.userRepository.findById(Number(userId));
  }
}
