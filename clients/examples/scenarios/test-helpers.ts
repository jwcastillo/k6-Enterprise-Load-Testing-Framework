import { check } from 'k6';
import { DataHelper } from '../../../shared/helpers/DataHelper.js';
import { ValidationHelper } from '../../../shared/helpers/ValidationHelper.js';
import { DateHelper } from '../../../shared/helpers/DateHelper.js';

export const options = {
  vus: 1,
  iterations: 1,
};

export default function () {
  console.log('🧪 Testing All Helper Utilities\n');

  // ============================================
  // DataHelper Tests
  // ============================================
  console.log('📦 DataHelper Tests:');
  
  const randomStr = DataHelper.randomString(10);
  const randomNum = DataHelper.randomInt(1, 100);
  const randomEmail = DataHelper.randomEmail();
  const randomPhone = DataHelper.randomPhone();
  const randomPassword = DataHelper.randomPassword();
  const randomBool = DataHelper.randomBoolean();
  const randomPrice = DataHelper.randomPrice(10, 100);
  const name = DataHelper.randomName();
  const company = DataHelper.randomCompany();
  const address = DataHelper.randomAddress();
  const product = DataHelper.randomProduct();
  const creditCard = DataHelper.randomCreditCard();
  const user = DataHelper.randomUser();
  const uuid = DataHelper.uuid();

  check(null, {
    'randomString generates string': () => typeof randomStr === 'string' && randomStr.length === 10,
    'randomInt in range': () => randomNum >= 1 && randomNum <= 100,
    'randomEmail has @': () => randomEmail.includes('@'),
    'randomPhone has digits': () => /\d+/.test(randomPhone),
    'randomPassword has length': () => randomPassword.length === 12,
    'randomBoolean is boolean': () => typeof randomBool === 'boolean',
    'randomPrice in range': () => randomPrice >= 10 && randomPrice <= 100,
    'randomName has properties': () => !!(name.first && name.last && name.full),
    'randomCompany is string': () => typeof company === 'string' && company.length > 0,
    'randomAddress has street': () => !!(address.street && address.city && address.zipCode),
    'randomProduct has id': () => !!(product.id && product.name) && product.price > 0,
    'randomCreditCard has number': () => !!(creditCard.number && creditCard.cvv && creditCard.expiry),
    'randomUser has email': () => !!(user.email && user.username && user.id),
    'uuid has correct format': () => uuid.includes('-') && uuid.length === 36,
  });

  console.log(`  ✅ randomString: ${randomStr}`);
  console.log(`  ✅ randomInt: ${randomNum}`);
  console.log(`  ✅ randomEmail: ${randomEmail}`);
  console.log(`  ✅ randomBoolean: ${randomBool}`);
  console.log(`  ✅ randomPrice: $${randomPrice}`);
  console.log(`  ✅ randomName: ${name.full}`);
  console.log(`  ✅ randomCompany: ${company}`);
  console.log(`  ✅ randomProduct: ${product.name} ($${product.price})`);
  console.log(`  ✅ randomUser: ${user.username} (${user.email})`);

  // ============================================
  // ValidationHelper Tests
  // ============================================
  console.log('\n✅ ValidationHelper Tests:');

  const validEmail = 'test@example.com';
  const invalidEmail = 'not-an-email';
  const validUrl = 'https://example.com';
  const invalidUrl = 'not-a-url';
  const validPhone = '+12025551234';
  const invalidPhone = '123';
  const validCreditCard = '4532015112830366'; // Valid test card
  const invalidCreditCard = '1234567890123456';
  const validUUID = '550e8400-e29b-41d4-a716-446655440000';
  const invalidUUID = 'not-a-uuid';
  const validIP = '192.168.1.1';
  const invalidIP = '999.999.999.999';
  const validZip = '12345';
  const invalidZip = 'ABCDE';

  check(null, {
    'validates email correctly': () => 
      ValidationHelper.isValidEmail(validEmail) && !ValidationHelper.isValidEmail(invalidEmail),
    'validates URL correctly': () => 
      ValidationHelper.isValidUrl(validUrl) && !ValidationHelper.isValidUrl(invalidUrl),
    'validates phone correctly': () => 
      ValidationHelper.isValidPhone(validPhone) && !ValidationHelper.isValidPhone(invalidPhone),
    'validates credit card correctly': () => 
      ValidationHelper.isValidCreditCard(validCreditCard) && !ValidationHelper.isValidCreditCard(invalidCreditCard),
    'validates UUID correctly': () => 
      ValidationHelper.isValidUUID(validUUID) && !ValidationHelper.isValidUUID(invalidUUID),
    'validates IP correctly': () => 
      ValidationHelper.isValidIPAddress(validIP) && !ValidationHelper.isValidIPAddress(invalidIP),
    'validates postal code correctly': () => 
      ValidationHelper.isValidPostalCode(validZip) && !ValidationHelper.isValidPostalCode(invalidZip),
    'validates positive numbers': () => 
      ValidationHelper.isPositive(10) && !ValidationHelper.isPositive(-10),
    'validates integers': () => 
      ValidationHelper.isInteger(10) && !ValidationHelper.isInteger(10.5),
    'validates JSON': () => 
      ValidationHelper.isValidJson('{"key":"value"}') && !ValidationHelper.isValidJson('not json'),
  });

  console.log(`  ✅ Email validation: ${validEmail} = valid`);
  console.log(`  ✅ URL validation: ${validUrl} = valid`);
  console.log(`  ✅ Phone validation: ${validPhone} = valid`);
  console.log(`  ✅ Credit card validation: ${validCreditCard} = valid`);
  console.log(`  ✅ UUID validation: ${validUUID} = valid`);
  console.log(`  ✅ IP validation: ${validIP} = valid`);

  // ============================================
  // DateHelper Tests
  // ============================================
  console.log('\n📅 DateHelper Tests:');

  const now = DateHelper.nowDate();
  const tomorrow = DateHelper.addDays(now, 1);
  const yesterday = DateHelper.subtractDays(now, 1);
  const isoString = DateHelper.formatISO(now);
  const dateString = DateHelper.formatDate(now);
  const timeString = DateHelper.formatTime(now);
  const customFormat = DateHelper.format(now, 'YYYY-MM-DD HH:mm:ss');

  check(null, {
    'now returns Date': () => now instanceof Date,
    'addDays works': () => DateHelper.isAfter(tomorrow, now),
    'subtractDays works': () => DateHelper.isBefore(yesterday, now),
    'formatISO works': () => isoString.includes('T') && isoString.includes('Z'),
    'formatDate works': () => /^\d{4}-\d{2}-\d{2}$/.test(dateString),
    'formatTime works': () => /^\d{2}:\d{2}:\d{2}$/.test(timeString),
    'custom format works': () => /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(customFormat),
    'isPast works': () => DateHelper.isPast(yesterday),
    'isFuture works': () => DateHelper.isFuture(tomorrow),
    'isToday works': () => DateHelper.isToday(now),
  });

  console.log(`  ✅ Now: ${dateString} ${timeString}`);
  console.log(`  ✅ Tomorrow: ${DateHelper.formatDate(tomorrow)}`);
  console.log(`  ✅ Yesterday: ${DateHelper.formatDate(yesterday)}`);
  console.log(`  ✅ ISO format: ${isoString}`);
  console.log(`  ✅ Custom format: ${customFormat}`);

  console.log('\n🎉 All Helper Tests Completed!');
}
