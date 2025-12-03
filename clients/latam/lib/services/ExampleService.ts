import { BaseService } from "../../../../shared/base-service.js";
import { RequestHelper } from "../../../../shared/helpers/RequestHelper.js";

export class ExampleService extends BaseService {
  private requestHelper: RequestHelper;

  constructor(baseUrl: string) {
    super(baseUrl);
    this.requestHelper = new RequestHelper(baseUrl);
  }

  /**
   * Get example resource
   */
  getExample(id: string) {
    return this.requestHelper.get(`/api/examples/${id}`);
  }

  /**
   * Create example resource
   */
  createExample(data: any) {
    return this.requestHelper.post("/api/examples", data);
  }

  /**
   * Update example resource
   */
  updateExample(id: string, data: any) {
    return this.requestHelper.put(`/api/examples/${id}`, data);
  }

  /**
   * Delete example resource
   */
  deleteExample(id: string) {
    return this.requestHelper.del(`/api/examples/${id}`);
  }
}
