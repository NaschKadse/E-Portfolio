import { UserService } from '@loopback/authentication';
import { repository } from '@loopback/repository';
import { HttpErrors } from '@loopback/rest';
import { securityId, UserProfile } from '@loopback/security';
import { inject } from '@loopback/core';
import { User } from '../models';
import { Credentials, UserRepository } from '../repositories/user.repository';
import { BcryptHasher } from './hash.password.bcrypt-service';
import { PasswordHasherBindings } from '../keys';



export class MyUserService implements UserService<User, Credentials> {
    constructor(
    @repository(UserRepository)
    public userRepository: UserRepository,
    @inject(PasswordHasherBindings.PASSWORD_HASHER)
    public hasher: BcryptHasher,
    ){}
    async verifyCredentials(credentials: Credentials): Promise<User> {
    
        const foundUser = await this.userRepository.findOne({
          where: {email: credentials.email},
        });
        if (!foundUser) {
          throw new HttpErrors.Unauthorized(`invalid email: ${credentials.email}`);
        }
    
        const passwordMatched = await this.hasher.comparePassword(
          credentials.password,
          foundUser.password,
        );
    
        if (!passwordMatched) {
          throw new HttpErrors.Unauthorized('invalid password');
        }
    
        return foundUser;
      }
    
      convertToUserProfile(user: User): UserProfile {
        let userName = ''
        if(user.firstName){
          userName = user.firstName;
        }
        if(user.lastName){
          userName = user.firstName ?
          `${user.firstName} ${user.lastName}`:
          user.lastName
        }
        const userProfile = {
          id: user.id,
          name: userName,
          [securityId]: `${user.id}`,
          role: user.role,
        }
        return userProfile;
      }
    
}