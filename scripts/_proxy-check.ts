import 'dotenv/config';
import { redactPII } from '../src/lib/resumeProcessor';

const proxyText =
  'Amara Okafor graduated in 2012 from the University of Nairobi, located at 12 Riverside Drive, Nairobi. Contact: +250 788 123 456; Email: amara.okafor@example.com';

const r = redactPII(proxyText);
console.log('REDACTED:', JSON.stringify(r));
console.log('');
console.log('name   removed?', !/Amara Okafor|Okafor/.test(r));
console.log('year   removed?', !/\b2012\b/.test(r));
console.log('institution removed?', !/University of Nairobi/.test(r));
console.log('address removed?', !/12 Riverside Drive/.test(r));
console.log('city   removed?', !/\bNairobi\b/.test(r));
console.log('phone  removed?', !/\+250\s788\s123\s456/.test(r) && !/\+250/.test(r));
console.log('email  removed?', !/amara.okafor@example.com/.test(r));
