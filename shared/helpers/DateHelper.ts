/**
 * DateHelper - Utility functions for date manipulation in k6 tests
 * 
 * Provides utilities for:
 * - Date formatting (ISO 8601, custom formats)
 * - Date arithmetic (add/subtract time units)
 * - Timestamp generation
 * - Date parsing and comparisons
 * - Relative dates (yesterday, tomorrow, etc.)
 */

export class DateHelper {
  /**
   * Get current date in ISO format
   */
  public static now(): string {
    return new Date().toISOString();
  }

  /**
   * Get current date object
   */
  public static nowDate(): Date {
    return new Date();
  }

  /**
   * Get current timestamp in milliseconds
   */
  public static timestamp(): number {
    return Date.now();
  }

  /**
   * Get current Unix timestamp in seconds
   */
  public static timestampSeconds(): number {
    return Math.floor(Date.now() / 1000);
  }

  /**
   * Parse ISO 8601 string to Date
   */
  public static parseISO(isoString: string): Date {
    return new Date(isoString);
  }

  /**
   * Parse Unix timestamp (seconds) to Date
   */
  public static fromTimestamp(timestamp: number): Date {
    return new Date(timestamp * 1000);
  }

  /**
   * Format date as ISO 8601 string (YYYY-MM-DDTHH:mm:ss.sssZ)
   */
  public static formatISO(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toISOString();
  }

  /**
   * Format date to YYYY-MM-DD
   */
  public static formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toISOString().split('T')[0];
  }

  /**
   * Format date to YYYY-MM-DD HH:mm:ss
   */
  public static formatDateTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toISOString().replace('T', ' ').substring(0, 19);
  }

  /**
   * Format date as ISO time only (HH:mm:ss)
   */
  public static formatTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toISOString().split('T')[1].split('.')[0];
  }

  /**
   * Format date with custom format
   * Supports: YYYY, MM, DD, HH, mm, ss
   * Example: DateHelper.format(date, 'YYYY-MM-DD HH:mm:ss')
   */
  public static format(date: Date | string, format: string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');

    return format
      .replace('YYYY', String(year))
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  }

  /**
   * Add days to a date
   */
  public static addDays(date: Date | string, days: number): Date {
    const d = typeof date === 'string' ? new Date(date) : new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }

  /**
   * Add hours to a date
   */
  public static addHours(date: Date | string, hours: number): Date {
    const d = typeof date === 'string' ? new Date(date) : new Date(date);
    d.setHours(d.getHours() + hours);
    return d;
  }

  /**
   * Add minutes to a date
   */
  public static addMinutes(date: Date | string, minutes: number): Date {
    const d = typeof date === 'string' ? new Date(date) : new Date(date);
    d.setMinutes(d.getMinutes() + minutes);
    return d;
  }

  /**
   * Add seconds to a date
   */
  public static addSeconds(date: Date | string, seconds: number): Date {
    const d = typeof date === 'string' ? new Date(date) : new Date(date);
    d.setSeconds(d.getSeconds() + seconds);
    return d;
  }

  /**
   * Subtract days from a date
   */
  public static subtractDays(date: Date | string, days: number): Date {
    return this.addDays(date, -days);
  }

  /**
   * Subtract hours from a date
   */
  public static subtractHours(date: Date | string, hours: number): Date {
    return this.addHours(date, -hours);
  }

  /**
   * Subtract minutes from a date
   */
  public static subtractMinutes(date: Date | string, minutes: number): Date {
    return this.addMinutes(date, -minutes);
  }

  /**
   * Subtract seconds from a date
   */
  public static subtractSeconds(date: Date | string, seconds: number): Date {
    return this.addSeconds(date, -seconds);
  }

  /**
   * Get yesterday's date
   */
  public static yesterday(): Date {
    return this.subtractDays(new Date(), 1);
  }

  /**
   * Get tomorrow's date
   */
  public static tomorrow(): Date {
    return this.addDays(new Date(), 1);
  }

  /**
   * Get date for next week (7 days from now)
   */
  public static nextWeek(): Date {
    return this.addDays(new Date(), 7);
  }

  /**
   * Get date for last week (7 days ago)
   */
  public static lastWeek(): Date {
    return this.subtractDays(new Date(), 7);
  }

  /**
   * Get date range (start and end dates)
   */
  public static getDateRange(startDate: Date | string, days: number): { start: string; end: string } {
    const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
    const end = this.addDays(start, days);
    return {
      start: this.formatDate(start),
      end: this.formatDate(end)
    };
  }

  /**
   * Check if date1 is before date2
   */
  public static isBefore(date1: Date | string, date2: Date | string): boolean {
    const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
    const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
    return d1.getTime() < d2.getTime();
  }

  /**
   * Check if date1 is after date2
   */
  public static isAfter(date1: Date | string, date2: Date | string): boolean {
    const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
    const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
    return d1.getTime() > d2.getTime();
  }

  /**
   * Check if date is in the past
   */
  public static isPast(date: Date | string): boolean {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.getTime() < Date.now();
  }

  /**
   * Check if date is in the future
   */
  public static isFuture(date: Date | string): boolean {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.getTime() > Date.now();
  }

  /**
   * Check if two dates are the same (ignoring milliseconds)
   */
  public static isSame(date1: Date | string, date2: Date | string): boolean {
    const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
    const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
    return Math.floor(d1.getTime() / 1000) === Math.floor(d2.getTime() / 1000);
  }

  /**
   * Get difference between two dates in days
   */
  public static diffInDays(date1: Date | string, date2: Date | string): number {
    const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
    const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
    const diffMs = d2.getTime() - d1.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Get difference between two dates in hours
   */
  public static diffInHours(date1: Date | string, date2: Date | string): number {
    const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
    const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
    const diffMs = d2.getTime() - d1.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60));
  }

  /**
   * Get difference between two dates in minutes
   */
  public static diffInMinutes(date1: Date | string, date2: Date | string): number {
    const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
    const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
    const diffMs = d2.getTime() - d1.getTime();
    return Math.floor(diffMs / (1000 * 60));
  }

  /**
   * Get difference between two dates in seconds
   */
  public static diffInSeconds(date1: Date | string, date2: Date | string): number {
    const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
    const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
    const diffMs = d2.getTime() - d1.getTime();
    return Math.floor(diffMs / 1000);
  }

  /**
   * Get start of day (00:00:00)
   */
  public static startOfDay(date: Date | string): Date {
    const d = typeof date === 'string' ? new Date(date) : new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /**
   * Get end of day (23:59:59)
   */
  public static endOfDay(date: Date | string): Date {
    const d = typeof date === 'string' ? new Date(date) : new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
  }

  /**
   * Check if date is today
   */
  public static isToday(date: Date | string): boolean {
    const d = typeof date === 'string' ? new Date(date) : date;
    const today = this.startOfDay(new Date());
    const checkDate = this.startOfDay(d);
    return this.isSame(today, checkDate);
  }

  /**
   * Get random date between two dates
   */
  public static randomDate(start: Date | string, end: Date | string): Date {
    const startDate = typeof start === 'string' ? new Date(start) : start;
    const endDate = typeof end === 'string' ? new Date(end) : end;
    const startTime = startDate.getTime();
    const endTime = endDate.getTime();
    const randomTime = startTime + Math.random() * (endTime - startTime);
    return new Date(randomTime);
  }
}

