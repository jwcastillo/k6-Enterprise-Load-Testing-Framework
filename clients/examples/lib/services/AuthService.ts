import { BaseService } from '../../../../shared/base-service.js';
import { RequestHelper } from '../../../../shared/helpers/RequestHelper.js';

export class AuthService extends BaseService {
  private requestHelper: RequestHelper;

  constructor(baseUrl: string) {
    super(baseUrl);
    this.requestHelper = new RequestHelper(baseUrl);
  }

  login(credentials: any) {
    return this.requestHelper.post('/api/auth/login', credentials);
  }

  getProfile() {
    return this.requestHelper.get('/api/user/profile');
  }

  refreshToken(token: string) {
    return this.requestHelper.post('/api/auth/refresh', { token });
  }

  logout() {
    return this.requestHelper.post('/api/auth/logout');
  }

  setToken(token: string) {
    this.requestHelper.setAuth(token);
  }
}
