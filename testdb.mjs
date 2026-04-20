import { MongoClient } from 'mongodb';

const uri = 'mongodb+srv://Tirjet:Tirjet3.@tirjet.nr8gfsr.mongodb.net/test?retryWrites=true&w=majority';

const client = new MongoClient(uri);

try {
  await client.connect();
  console.log('✅ Connected!');
} catch (err) {
  console.log('❌ Error:', err.message, err.code);
} finally {
  await client.close();
}