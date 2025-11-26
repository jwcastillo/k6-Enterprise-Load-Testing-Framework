import { Response } from 'k6/http';

export abstract class BaseService {
  protected baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  protected getUrl(path: string): string {
    return `${this.baseUrl}${path}`;
  }

  // Helper to handle response validation or common headers could go here
  protected validate(response: Response, checkName: string): boolean {
    // This can be expanded to use k6 checks
    return response.status === 200;
  }
}
