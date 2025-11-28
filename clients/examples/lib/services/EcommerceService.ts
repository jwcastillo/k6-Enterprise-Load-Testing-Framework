import { BaseService } from '../../../../shared/base-service';
import { RequestHelper } from '../../../../shared/helpers/RequestHelper';

export class EcommerceService extends BaseService {
  private requestHelper: RequestHelper;

  constructor(baseUrl: string) {
    super(baseUrl);
    this.requestHelper = new RequestHelper(baseUrl);
  }

  visitHome() {
    return this.requestHelper.get('/');
  }

  searchProduct(query: string) {
    return this.requestHelper.get('/api/products', { q: query });
  }

  getProductDetails(productId: string) {
    return this.requestHelper.get(`/api/products/${productId}`);
  }

  addToCart(userId: string, productId: string, quantity: number) {
    return this.requestHelper.post('/api/cart', {
      userId,
      productId,
      quantity
    });
  }

  checkout(userId: string, address: any, payment: any) {
    return this.requestHelper.post('/api/checkout', {
      userId,
      address,
      payment
    });
  }
}
