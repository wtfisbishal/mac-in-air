//@ts-nocheck
import dotenv from 'dotenv';
import { getRedis } from '.';
dotenv.config();

const redis = getRedis();

async function test() {
    try {

        await redis.set('test', 'hello');
        const val = await redis.get('test');
        console.log('SUCCESS! Got value:', val);
        process.exit(0);
    } catch (err) {
        console.error('ERROR:', err);
        process.exit(1);
    }
}

test();
