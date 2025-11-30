import http, { Response } from 'k6/http';
import { BaseService } from '../../../core/service.js';

export class ExampleService extends BaseService {
  constructor(baseUrl: string) {
    super(baseUrl);
  }

  public getHomepage(): Response {
    return http.get(this.getUrl('/'));
  }

  public getFeatures(): Response {
    return http.get(this.getUrl('/features'));
  }
}
