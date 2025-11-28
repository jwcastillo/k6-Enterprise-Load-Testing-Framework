import { BaseFactory } from './BaseFactory.js';
import { DataHelper } from '../helpers/DataHelper.js';

interface Address {
  street: string;
  city: string;
  zipCode: string;
  country: string;
}

interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
  isActive: boolean;
  profile: {
    firstName: string;
    lastName: string;
    age: number;
  };
  address: Address;
  tags: string[];
}

export class UserFactory extends BaseFactory<User> {
  protected definition(): User {
    const name = DataHelper.randomName();
    
    return {
      id: DataHelper.uuid(),
      username: `${name.first.toLowerCase()}.${name.last.toLowerCase()}`,
      email: DataHelper.randomEmail(),
      role: 'user',
      isActive: true,
      profile: {
        firstName: name.first,
        lastName: name.last,
        age: DataHelper.randomInt(18, 65)
      },
      address: {
        street: '123 Main St', // Simplified for example
        city: 'New York',
        zipCode: '10001',
        country: 'USA'
      },
      tags: []
    };
  }

  /**
   * State: Create an admin user
   */
  public admin(): UserFactory {
    // Note: In a real implementation, we might want a chainable builder pattern.
    // For simplicity in this base version, we'll just return a factory that produces admins.
    // This requires a slightly different architecture or just using overrides.
    // Here is how we handle "states" typically in this simple pattern:
    return new class extends UserFactory {
      create(overrides: Partial<User> = {}): User {
        return super.create({ ...overrides, role: 'admin' });
      }
    }();
  }
}
