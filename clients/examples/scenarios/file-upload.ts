import { check, sleep } from 'k6';
import http from 'k6/http';
import { FormData } from 'https://jslib.k6.io/formdata/0.0.2/index.js';

export const options = {
  vus: 5,
  duration: '30s'
};

export default function () {
  // Create a sample file content
  const fileContent = 'This is a test file content for upload testing.\n'.repeat(100);
  
  // Create FormData
  const formData = new FormData();
  formData.append('file', http.file(fileContent, 'test-file.txt', 'text/plain'));
  formData.append('description', 'Test file upload from k6');
  formData.append('category', 'testing');

  // Upload file (using httpbin.org for testing)
  const uploadRes = http.post('https://httpbin.org/post', formData.body(), {
    headers: {
      'Content-Type': 'multipart/form-data; boundary=' + formData.boundary
    }
  });

  check(uploadRes, {
    'upload status is 200': (r) => r.status === 200,
    'upload successful': (r) => {
      try {
        const body = JSON.parse(r.body as string);
        return body.files && Object.keys(body.files).length > 0;
      } catch {
        return false;
      }
    }
  });

  sleep(1);

  // Test file download
  const downloadRes = http.get('https://httpbin.org/bytes/1024');

  check(downloadRes, {
    'download status is 200': (r) => r.status === 200,
    'downloaded correct size': (r) => r.body?.length === 1024
  });

  // Test large file download
  const largeFileRes = http.get('https://httpbin.org/bytes/10240');

  check(largeFileRes, {
    'large file download status is 200': (r) => r.status === 200,
    'large file correct size': (r) => r.body?.length === 10240,
    'large file download time acceptable': (r) => r.timings.duration < 5000
  });
}
