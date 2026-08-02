/**
 * PURPOSE: All direct Mongoose/User queries live here and ONLY here.
 *
 * WHY A REPOSITORY LAYER AT ALL (why not call User.find() in the service?)
 * 1. Testability: services can be unit-tested by mocking the repository
 *    interface instead of spinning up a real MongoDB.
 * 2. Swappability: if we ever migrated off Mongoose (or added a cache
 *    in front of reads), only this file changes -- services are untouched.
 * 3. Query reuse: the exact same "find active user by email" query is
 *    used by login AND registration duplicate-check; defining it once
 *    here avoids subtly different query logic drifting apart.
 *
 * INTERVIEW TALKING POINT: this is the Repository Pattern from DDD --
 * it decouples business logic from persistence technology.
 */
import { User, IUser } from '../models/User';

export const userRepository = {
  findByEmail(email: string, withPassword = false) {
    const query = User.findOne({ email: email.toLowerCase() });
    return withPassword ? query.select('+password') : query;
  },
  findById(id: string) {
    return User.findById(id);
  },
  create(data: Pick<IUser, 'name' | 'email' | 'password'>) {
    return User.create(data);
  },
};
