import { Controller, Get } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

@Controller('test-throttle')
export class TestThrottleController {
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Get('strict')
  checkStrictLimit() {
    return { message: 'Request succeeded' };
  }
}
