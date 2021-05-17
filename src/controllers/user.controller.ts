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
import { validateCredentials } from '../services/validator-service';



export class UserController {
  constructor(
    @repository(UserRepository)
    public userRepository : UserRepository,
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
    validateCredentials(_.pick(user, ['email', 'password']))
    return this.userRepository.create(user);
  }
}
