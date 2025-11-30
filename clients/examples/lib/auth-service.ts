import http, { Response } from 'k6/http';
import { BaseService } from '../../../core/service.js';

export class AuthService extends BaseService {
  public login(username: string, password: string): Response {
    return http.post(this.getUrl('/auth/token/login/'), JSON.stringify({
      username,
      password
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  public register(username: string, email: string, password: string): Response {
    return http.post(this.getUrl('/auth/users/'), JSON.stringify({
      username,
      email,
      password
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  public logout(token: string): Response {
    return http.post(this.getUrl('/auth/token/logout/'), null, {
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Token ${token}`
      }
    });
  }
}
