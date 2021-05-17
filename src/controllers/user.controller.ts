import { inject } from '@loopback/core';
import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where,
} from '@loopback/repository';
import {
  post,
  param,
  get,
  getModelSchemaRef,
  patch,
  put,
  del,
  requestBody,
  response,
} from '@loopback/rest';
import _ from 'lodash';
import { User } from '../models';
import { UserRepository } from '../repositories';
import { BcryptHasher } from '../services/hash.password.bcrypt';
import { validateCredentials } from '../services/validator-service';



export class UserController {
  constructor(
    @repository(UserRepository)
    public userRepository : UserRepository,
    @inject('service.hasher')
    public hasher: BcryptHasher,
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
            exclude: ['id'],
          }),
        },
      },
    })
    user: Omit<User, 'id'>,
  ): Promise<User> {
    //validate user credentials
    validateCredentials(_.pick(user, ['email', 'password']));
    //encrypt user password
    user.password = await this.hasher.hashPassword(user.password);
    return this.userRepository.create(user);
  }
}
