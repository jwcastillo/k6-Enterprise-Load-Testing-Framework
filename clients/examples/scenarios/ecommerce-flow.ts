import { check, group, sleep } from 'k6';
import { EcommerceService } from '../lib/services/EcommerceService.js';
import { DataHelper } from '../../../shared/helpers/DataHelper.js';

const config = JSON.parse(open('../config/default.json'));
const service = new EcommerceService(config.baseUrl);

export const options = {
  scenarios: {
    ecommerce: config.scenarios.ecommerce
  },
  thresholds: config.thresholds
};

export default function () {
  const user = DataHelper.randomUser();
  let productId: string;

  group('1. Visit Home', () => {
    const res = service.visitHome();
    check(res, { 'home status 200': (r) => r.status === 200 });
    sleep(1);
  });

  group('2. Search Product', () => {
    const res = service.searchProduct('laptop');
    check(res, { 'search status 200': (r) => r.status === 200 });
    
    // Extract a product ID from response (mocked logic)
    // In real world: productId = res.json('data.0.id');
    productId = 'prod_' + DataHelper.randomInt(1, 100);
    sleep(2);
  });

  group('3. View Details', () => {
    const res = service.getProductDetails(productId);
    check(res, { 'details status 200': (r) => r.status === 200 });
    sleep(3);
  });

  group('4. Add to Cart', () => {
    const res = service.addToCart(user.id, productId, 1);
    check(res, { 'cart add status 201': (r) => r.status === 201 });
    sleep(1);
  });

  group('5. Checkout', () => {
    const res = service.checkout(user.id, user.address, DataHelper.randomCreditCard());
    check(res, { 'checkout status 200': (r) => r.status === 200 });
  });
}
