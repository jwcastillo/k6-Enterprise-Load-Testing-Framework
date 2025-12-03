import { check, sleep } from 'k6';
import http from 'k6/http';
// @ts-ignore
import { FormData } from 'https://jslib.k6.io/formdata/0.0.2/index.js';
import { ConfigLoader } from '../../../core/config.js';

const config = new ConfigLoader().load();

export const options = {
  scenarios: {
    upload: {
      executor: 'constant-vus',
      vus: 5,
      duration: '30s'
    }
  }
};

export default function () {
  // Create a sample file content
  const fileContent = 'This is a test file content for upload testing.\n'.repeat(100);
  
  // Create FormData
  const formData = new FormData();
  formData.append('file', http.file(fileContent, 'test-file.txt', 'text/plain'));
  formData.append('description', 'Test file upload from k6');
  formData.append('category', 'testing');

  // Upload file to local mock server
  const uploadRes = http.post(`${config.baseUrl}/api/upload`, formData.body(), {
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
}
