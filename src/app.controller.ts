import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthResponseDto } from './health/dto/health-response.dto';
import { ExampleDto } from './common/dto/example.dto';
@ApiTags('Health')
@Controller()
export class AppController {
  @Get('health')
  @ApiOperation({ summary: 'Check API health' })
  @ApiOkResponse({
    description: 'The API is available',
    type: HealthResponseDto,
  })
  getHealth(): HealthResponseDto {
    return { status: 'ok' };
  }

  @Post('example')
  @ApiOperation({ summary: 'Example endpoint to test global validation' })
  createExample(@Body() dto: ExampleDto) {
    return dto;
  }
}
