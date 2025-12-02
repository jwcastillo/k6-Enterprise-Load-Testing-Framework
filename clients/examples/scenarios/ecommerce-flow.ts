import { check, group, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import { EcommerceService } from '../lib/services/EcommerceService.js';
import { DataHelper } from '../../../shared/helpers/DataHelper.js';
// @ts-ignore
import papaparse from 'https://jslib.k6.io/papaparse/5.1.1/index.js';

const config = JSON.parse(open('../config/default.json'));
const service = new EcommerceService(config.baseUrl);

interface Product {
  id: string;
  name: string;
  category: string;
}

// Load products from CSV
const products = new SharedArray('products', function () {
  return papaparse.parse(open('../data/products.csv'), { header: true }).data as Product[];
});

export const options = {
  scenarios: {
    ecommerce: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 5 },
        { duration: '20s', target: 5 },
        { duration: '10s', target: 0 },
      ],
      gracefulRampDown: '0s',
    },
  },
  thresholds: config.thresholds
};

export default function () {
  const user = DataHelper.randomUser();
  // Select a random product from the CSV data
  const product = products[Math.floor(Math.random() * products.length)];
  
  group('1. Visit Home', () => {
    const res = service.visitHome();
    check(res, { 'home status 200': (r) => r.status === 200 });
    sleep(1);
  });

  group('2. Search Product', () => {
    // Use product name from CSV
    const res = service.searchProduct(product.name);
    check(res, { 'search status 200': (r) => r.status === 200 });
    sleep(2);
  });

  group('3. View Details', () => {
    // Use product ID from CSV
    const res = service.getProductDetails(product.id);
    check(res, { 'details status 200': (r) => r.status === 200 });
    sleep(3);
  });

  group('4. Add to Cart', () => {
    const res = service.addToCart(user.id, product.id, 1);
    check(res, { 'cart add status 201': (r) => r.status === 201 });
    sleep(1);
  });

  group('5. Checkout', () => {
    const res = service.checkout(user.id, user.address, DataHelper.randomCreditCard());
    check(res, { 'checkout status 200': (r) => r.status === 200 });
  });
}
