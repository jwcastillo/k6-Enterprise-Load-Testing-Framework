/**
 * Base Factory Class
 * 
 * Abstract class for creating domain-specific data factories.
 * Supports building single objects or arrays of objects with overrides.
 */
import { DataHelper } from '../helpers/DataHelper.js';

export abstract class BaseFactory<T> {
  /**
   * Define the default attributes for the model
   */
  protected abstract definition(): T;

  /**
   * Create a single object instance
   * @param overrides Properties to override the default definition
   */
  public create(overrides: Partial<T> = {}): T {
    const defaults = this.definition();
    return DataHelper.merge(defaults as unknown as Record<string, any>, overrides) as T;
  }

  /**
   * Create multiple object instances
   * @param count Number of objects to create
   * @param overrides Properties to override (applied to all instances)
   */
  public createMany(count: number, overrides: Partial<T> = {}): T[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }

  /**
   * Create objects with dynamic overrides per instance
   * @param count Number of objects to create
   * @param callback Function to generate overrides based on index
   */
  public createSequence(count: number, callback: (index: number) => Partial<T>): T[] {
    return Array.from({ length: count }, (_, index) => this.create(callback(index)));
  }
}
