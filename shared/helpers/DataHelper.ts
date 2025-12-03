/**
 * DataHelper - Utility functions for data manipulation and generation
 */
import crypto from "crypto";
export class DataHelper {
  /**
   * Generate random string
   */
  public static randomString(length: number = 10): string {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      const idx = crypto.randomInt(0, chars.length);
      result += chars.charAt(idx);
    }
    return result;
  }

  /**
   * Generate random number between min and max
   */
  public static randomInt(min: number, max: number): number {
    // Use crypto.randomInt, which gives [min, max] inclusive
    return crypto.randomInt(min, max + 1);
  }

  /**
   * Generate random email
   */
  public static randomEmail(domain: string = "test.com"): string {
    return `user_${this.randomString(8)}@${domain}`;
  }

  /**
   * Generate random phone number
   */
  public static randomPhone(countryCode: string = "+1"): string {
    const areaCode = this.randomInt(200, 999);
    const prefix = this.randomInt(200, 999);
    const lineNumber = this.randomInt(1000, 9999);
    return `${countryCode}${areaCode}${prefix}${lineNumber}`;
  }

  /**
   * Generate random password
   */
  public static randomPassword(length: number = 12): string {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let result = "";
    for (let i = 0; i < length; i++) {
      const idx = crypto.randomInt(0, chars.length);
      result += chars.charAt(idx);
    }
    return result;
  }

  /**
   * Pick random item from array
   */
  public static randomItem<T>(array: T[]): T {
    // Use crypto.randomInt to securely pick index
    if (array.length === 0) {
      throw new Error("Cannot pick random item from empty array");
    }
    const idx = crypto.randomInt(0, array.length);
    return array[idx];
  }

  /**
   * Shuffle array
   */
  public static shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = crypto.randomInt(0, i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Generate array of unique random numbers
   */
  public static uniqueRandomInts(
    count: number,
    min: number,
    max: number
  ): number[] {
    const numbers: number[] = [];
    while (numbers.length < count) {
      const num = this.randomInt(min, max);
      if (!numbers.includes(num)) {
        numbers.push(num);
      }
    }
    return numbers;
  }

  /**
   * Deep clone object
   */
  public static clone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }

  /**
   * Merge objects deeply
   */
  public static merge<T extends Record<string, any>>(
    target: T,
    ...sources: Partial<T>[]
  ): T {
    const result = this.clone(target);

    for (const source of sources) {
      for (const key in source) {
        if (source.hasOwnProperty(key)) {
          const sourceValue = source[key];
          const targetValue = result[key];

          if (
            sourceValue &&
            typeof sourceValue === "object" &&
            !Array.isArray(sourceValue)
          ) {
            result[key] = this.merge(targetValue || {}, sourceValue) as any;
          } else {
            result[key] = sourceValue as any;
          }
        }
      }
    }

    return result;
  }

  /**
   * Generate UUID v4
   */
  public static uuid(): string {
    // Use cryptographically secure random values to generate UUID v4
    const bytes = new Uint8Array(16);
    // In browser/k6, window.crypto or globalThis.crypto is available
    // In k6/node/browser environments, try to find a suitable crypto implementation
    if (typeof crypto !== "undefined" && (crypto as any).getRandomValues) {
      (crypto as any).getRandomValues(bytes);
    } else if (
      typeof globalThis !== "undefined" &&
      globalThis.crypto &&
      globalThis.crypto.getRandomValues
    ) {
      globalThis.crypto.getRandomValues(bytes);
    } else {
      // Fallback for environments where getRandomValues is not available directly on crypto
      // This might happen in some Node.js versions or specific contexts
      throw new Error("Secure random number generator not available");
    }
    // Per RFC4122: set bits for version and `clock_seq_hi_and_reserved`
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // UUID version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // UUID variant 10
    // Convert bytes to UUID string
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0"));
    return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex
      .slice(6, 8)
      .join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10, 16).join("")}`;
  }

  /**
   * Format number with thousand separators
   */
  public static formatNumber(num: number, separator: string = ","): string {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, separator);
  }

  /**
   * Parse CSV line
   */
  public static parseCsvLine(line: string, delimiter: string = ","): string[] {
    return line.split(delimiter).map((field) => field.trim());
  }

  /**
   * Convert object to query string
   */
  public static toQueryString(obj: Record<string, any>): string {
    const parts: string[] = [];
    for (const [key, value] of Object.entries(obj)) {
      if (value !== null && value !== undefined) {
        parts.push(
          `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`
        );
      }
    }
    return parts.join("&");
  }

  /**
   * Generate random boolean
   */
  public static randomBoolean(): boolean {
    return Math.random() < 0.5;
  }

  /**
   * Generate random price with decimals
   */
  public static randomPrice(min: number = 1, max: number = 1000): number {
    return Math.round((Math.random() * (max - min) + min) * 100) / 100;
  }

  /**
   * Generate random person name
   */
  public static randomName(): { first: string; last: string; full: string } {
    const firstNames = [
      "John",
      "Jane",
      "Michael",
      "Sarah",
      "David",
      "Emily",
      "Robert",
      "Lisa",
      "James",
      "Mary",
    ];
    const lastNames = [
      "Smith",
      "Johnson",
      "Williams",
      "Brown",
      "Jones",
      "Garcia",
      "Miller",
      "Davis",
      "Rodriguez",
      "Martinez",
    ];

    const first = this.randomItem(firstNames);
    const last = this.randomItem(lastNames);

    return {
      first,
      last,
      full: `${first} ${last}`,
    };
  }

  /**
   * Generate random company name
   */
  public static randomCompany(): string {
    const prefixes = [
      "Tech",
      "Global",
      "Digital",
      "Smart",
      "Innovative",
      "Advanced",
    ];
    const suffixes = [
      "Solutions",
      "Systems",
      "Technologies",
      "Enterprises",
      "Group",
      "Corp",
    ];

    return `${this.randomItem(prefixes)} ${this.randomItem(suffixes)}`;
  }

  /**
   * Generate random address object
   */
  public static randomAddress(): {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  } {
    const streets = [
      "Main St",
      "Oak Ave",
      "Maple Dr",
      "Park Rd",
      "Washington Blvd",
    ];
    const cities = ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix"];
    const states = ["NY", "CA", "IL", "TX", "AZ"];

    return {
      street: `${this.randomInt(100, 9999)} ${this.randomItem(streets)}`,
      city: this.randomItem(cities),
      state: this.randomItem(states),
      zipCode: String(this.randomInt(10000, 99999)),
      country: "USA",
    };
  }

  /**
   * Generate random product object
   */
  public static randomProduct(): {
    id: string;
    name: string;
    price: number;
    category: string;
    inStock: boolean;
  } {
    const adjectives = [
      "Premium",
      "Deluxe",
      "Professional",
      "Standard",
      "Basic",
    ];
    const products = ["Laptop", "Mouse", "Keyboard", "Monitor", "Headphones"];
    const categories = ["electronics", "accessories", "peripherals"];

    return {
      id: `prod_${this.randomString(8)}`,
      name: `${this.randomItem(adjectives)} ${this.randomItem(products)}`,
      price: this.randomPrice(10, 2000),
      category: this.randomItem(categories),
      inStock: this.randomBoolean(),
    };
  }

  /**
   * Generate random credit card number (fake, for testing only)
   * Uses Luhn algorithm to generate valid-looking numbers
   */
  public static randomCreditCard(): {
    number: string;
    cvv: string;
    expiry: string;
  } {
    // Generate 15 random digits
    let cardNumber = "";
    for (let i = 0; i < 15; i++) {
      cardNumber += this.randomInt(0, 9);
    }

    // Calculate Luhn check digit
    let sum = 0;
    let isEven = true;

    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber[i]);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    const checkDigit = (10 - (sum % 10)) % 10;
    cardNumber += checkDigit;

    // Format as XXXX XXXX XXXX XXXX
    const formatted = cardNumber.match(/.{1,4}/g)?.join(" ") || cardNumber;

    // Generate CVV and expiry
    const cvv = String(this.randomInt(100, 999));
    const month = String(this.randomInt(1, 12)).padStart(2, "0");
    const year = String(this.randomInt(25, 30));

    return {
      number: formatted,
      cvv,
      expiry: `${month}/${year}`,
    };
  }

  /**
   * Generate random date between two dates
   */
  public static randomDate(start: Date, end: Date): Date {
    const startTime = start.getTime();
    const endTime = end.getTime();
    const randomTime = startTime + Math.random() * (endTime - startTime);
    return new Date(randomTime);
  }

  /**
   * Generate random user object
   */
  public static randomUser(): {
    id: string;
    username: string;
    email: string;
    password: string;
    name: { first: string; last: string; full: string };
    phone: string;
    address: ReturnType<typeof DataHelper.randomAddress>;
  } {
    const name = this.randomName();
    return {
      id: this.uuid(),
      username: `${name.first.toLowerCase()}_${this.randomString(4)}`,
      email: this.randomEmail(),
      password: this.randomPassword(),
      name,
      phone: this.randomPhone(),
      address: this.randomAddress(),
    };
  }

  /**
   * Weighted switch - Execute functions based on probability weights
   * @param weightedFuncs Array of [weight, function] tuples where weights sum to 1.0
   * @returns A function that returns one of the provided functions based on weights
   *
   * @example
   * const action = DataHelper.weightedSwitch([
   *   [0.7, () => console.log('Browse')],
   *   [0.2, () => console.log('Add to cart')],
   *   [0.1, () => console.log('Checkout')]
   * ]);
   * action(); // Executes one function based on probability
   */
  public static weightedSwitch<T extends () => any>(
    weightedFuncs: Array<[number, T]>
  ): T {
    interface FuncInterval {
      start: number;
      end: number;
      func: T;
    }

    const funcIntervals: FuncInterval[] = [];
    let weightSum = 0;

    for (let i = 0; i < weightedFuncs.length; i++) {
      funcIntervals.push({
        start: weightSum,
        end: weightSum + weightedFuncs[i][0],
        func: weightedFuncs[i][1],
      });
      weightSum += weightedFuncs[i][0];
    }

    if (Math.abs(weightSum - 1) > 0.0001) {
      throw new Error(
        `The sum of function weights should be 1.0 (100%), but is ${weightSum}`
      );
    }

    const val = Math.random();
    let min = 0;
    let max = funcIntervals.length - 1;

    while (min <= max) {
      const guess = Math.floor((max + min) / 2);

      if (val >= funcIntervals[guess].end) {
        min = guess + 1;
      } else if (val < funcIntervals[guess].start) {
        max = guess - 1;
      } else {
        return funcIntervals[guess].func;
      }
    }

    // Fallback (should never reach here if weights sum to 1.0)
    return funcIntervals[funcIntervals.length - 1].func;
  }
}
