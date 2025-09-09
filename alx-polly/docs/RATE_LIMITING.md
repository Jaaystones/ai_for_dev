# Rate Limiting Implementation

This document describes the comprehensive rate limiting system implemented for the ALX Polly application.

## Overview

The rate limiting system provides:

- **Request throttling** to prevent abuse
- **Burst protection** for sudden traffic spikes
- **IP-based tracking** with fingerprinting
- **Configurable limits** per endpoint
- **Admin monitoring** and management
- **Production-ready** Redis support

## Architecture

### Core Components

1. **Rate Limit Engine** (`/lib/rate-limit.ts`)

   - Memory-based storage with automatic cleanup
   - Configurable rules per endpoint
   - Burst protection mechanism
   - IP fingerprinting for anonymous users

2. **Middleware** (`/lib/middleware/rate-limit.ts`)

   - Reusable middleware factory
   - Standard HTTP 429 responses
   - Rate limit headers
   - Error handling

3. **Redis Adapter** (`/lib/redis-rate-limit.ts`)

   - Production Redis support
   - Automatic failover to memory
   - Connection health monitoring
   - TTL-based cleanup

4. **Client Hooks** (`/hooks/useRateLimit.ts`)

   - React hooks for client-side handling
   - Toast notifications
   - Automatic retry logic
   - Response checking

5. **Admin Dashboard** (`/components/admin/RateLimitDashboard.tsx`)
   - Real-time monitoring
   - IP status lookup
   - Rate limit reset functionality
   - Traffic analytics

## Rate Limit Rules

### Default Configuration

| Endpoint         | Limit        | Window       | Description        |
| ---------------- | ------------ | ------------ | ------------------ |
| `api:general`    | 100 requests | 60 seconds   | General API access |
| `polls:create`   | 5 requests   | 300 seconds  | Poll creation      |
| `polls:vote`     | 10 requests  | 60 seconds   | Voting on polls    |
| `polls:view`     | 50 requests  | 60 seconds   | Viewing polls      |
| `auth:login`     | 5 requests   | 300 seconds  | Login attempts     |
| `auth:register`  | 3 requests   | 3600 seconds | Registration       |
| `upload:avatar`  | 3 requests   | 300 seconds  | Avatar uploads     |
| `analytics:view` | 100 requests | 300 seconds  | Analytics access   |

### Burst Protection

- **Limit**: 50 requests
- **Window**: 10 seconds
- **Purpose**: Prevent rapid-fire requests

## Implementation Examples

### 1. Basic API Route Protection

```typescript
import { rateLimit, burstRateLimit } from "@/lib/rate-limit";
import { isWhitelistedIP, getClientIP } from "@/lib/utils/auth";
import config from "@/lib/config";

export async function POST(request: NextRequest) {
  // Check if rate limiting is enabled and IP is not whitelisted
  if (config.rateLimiting.enabled && !isWhitelistedIP(getClientIP(request))) {
    // Apply burst protection
    if (config.rateLimiting.burstProtection.enabled) {
      const burstResult = await burstRateLimit.checkBurst(
        request,
        config.rateLimiting.burstProtection.limit,
        config.rateLimiting.burstProtection.window
      );

      if (!burstResult.success) {
        return NextResponse.json(
          { error: burstResult.error, rateLimitExceeded: true },
          { status: 429 }
        );
      }
    }

    // Apply standard rate limiting
    const rateLimitResult = await rateLimit(request, "polls:create");

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: rateLimitResult.error, rateLimitExceeded: true },
        { status: 429 }
      );
    }
  }

  // Your API logic here
  return NextResponse.json({ success: true });
}
```

### 2. Using Middleware

```typescript
import { withRateLimit } from "@/lib/middleware/rate-limit";

const handler = async (request: NextRequest) => {
  // Your API logic
  return NextResponse.json({ data: "success" });
};

export const POST = withRateLimit("polls:vote")(handler);
```

### 3. Client-Side Usage

```typescript
import { useRateLimit } from "@/hooks/useRateLimit";

function CreatePollForm() {
  const { checkResponse, isRateLimited } = useRateLimit({
    showToast: true,
    onRateLimit: (error) => {
      console.log("Rate limited:", error);
    },
  });

  const handleSubmit = async (data: PollData) => {
    if (isRateLimited) return;

    const response = await fetch("/api/polls", {
      method: "POST",
      body: JSON.stringify(data),
    });

    const wasRateLimited = await checkResponse(response);
    if (wasRateLimited) return;

    // Handle successful response
    const result = await response.json();
    // ...
  };
}
```

## Configuration

### Environment Variables

```env
# Enable/disable rate limiting
RATE_LIMITING_ENABLED=true

# Store type: 'memory' or 'redis'
RATE_LIMIT_STORE=memory

# Redis URL (if using Redis)
REDIS_URL=redis://localhost:6379

# Strict mode
RATE_LIMIT_STRICT_MODE=false

# Trusted proxies (comma-separated)
TRUSTED_PROXIES=127.0.0.1,::1

# Whitelisted IPs (comma-separated)
WHITELISTED_IPS=127.0.0.1

# Burst protection
BURST_PROTECTION_ENABLED=true
BURST_LIMIT=50
BURST_WINDOW=10
```

### Custom Rate Limits

Override default limits with environment variables:

```env
# Format: RATE_LIMIT_{ENDPOINT}={requests}:{window_seconds}
RATE_LIMIT_POLLS_CREATE=10:600  # 10 requests per 10 minutes
RATE_LIMIT_POLLS_VOTE=20:60     # 20 requests per minute
```

## Monitoring & Administration

### Admin Dashboard

Access the rate limiting dashboard at `/admin/rate-limits` (admin access required):

- **Real-time statistics**: Total requests, blocked requests, unique IPs
- **IP lookup**: Check rate limit status for specific IPs
- **Top blocked IPs**: See most frequently blocked addresses
- **Recent activity**: Monitor live traffic
- **Reset functionality**: Clear rate limits for specific IPs

### API Endpoints

- `GET /api/admin/rate-limit/stats` - Get statistics
- `GET /api/admin/rate-limit/status?ip=x.x.x.x` - Check IP status
- `POST /api/admin/rate-limit/reset` - Reset IP limits

### Rate Limit Headers

All responses include rate limit headers:

```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1647887400
Retry-After: 45
```

## Production Deployment

### Redis Setup

For production, use Redis for distributed rate limiting:

1. **Install Redis**:

   ```bash
   # Using Docker
   docker run -d --name redis -p 6379:6379 redis:alpine

   # Using cloud service (Upstash, Redis Cloud, etc.)
   ```

2. **Configure Environment**:

   ```env
   RATE_LIMIT_STORE=redis
   REDIS_URL=redis://your-redis-url:6379
   ```

3. **Add Redis Dependency**:
   ```bash
   npm install redis
   ```

### Load Balancer Considerations

When using multiple server instances:

1. **Use Redis** for shared rate limit state
2. **Configure trusted proxies** properly
3. **Set consistent IP extraction** logic

### Monitoring

1. **Alerts**: Set up alerts for high block rates
2. **Metrics**: Monitor rate limit effectiveness
3. **Logs**: Track blocked requests and patterns

## Security Considerations

### IP Spoofing Protection

- Use trusted proxy configuration
- Validate IP extraction logic
- Consider additional fingerprinting

### Bypass Protection

- Whitelist legitimate services carefully
- Monitor for IP rotation attacks
- Implement progressive penalties

### DDoS Mitigation

- Combine with infrastructure-level protection
- Use burst limits for rapid attack detection
- Implement emergency mode for severe attacks

## Testing

### Unit Tests

Run rate limiting tests:

```bash
npm test src/__tests__/rate-limit.test.ts
```

### Load Testing

Test rate limiting under load:

```bash
# Using Apache Bench
ab -n 1000 -c 10 http://localhost:3000/api/polls

# Using Artillery
artillery quick --count 10 --num 100 http://localhost:3000/api/polls
```

### Integration Testing

Test rate limiting in your API tests:

```typescript
describe("API Rate Limiting", () => {
  it("should block after exceeding limit", async () => {
    // Make requests up to limit
    for (let i = 0; i < 5; i++) {
      const response = await request(app).post("/api/polls");
      expect(response.status).toBe(200);
    }

    // Should be blocked
    const response = await request(app).post("/api/polls");
    expect(response.status).toBe(429);
    expect(response.body.rateLimitExceeded).toBe(true);
  });
});
```

## Troubleshooting

### Common Issues

1. **Rate limits not working**:

   - Check `RATE_LIMITING_ENABLED=true`
   - Verify IP extraction logic
   - Check for whitelisted IPs

2. **Redis connection errors**:

   - Verify Redis URL and connectivity
   - Check Redis service status
   - Review Redis logs

3. **High false positives**:
   - Review rate limit thresholds
   - Check IP extraction for proxies
   - Consider user-based limits

### Debug Mode

Enable debug logging:

```env
DEBUG=rate-limit:*
```

### Health Checks

Check rate limiting health:

```bash
curl -v http://localhost:3000/api/health/rate-limit
```

## Performance Optimization

### Memory Usage

- Regular cleanup of expired entries
- Configurable cleanup intervals
- Memory usage monitoring

### Redis Optimization

- Use Redis pipelines for batch operations
- Configure appropriate TTLs
- Monitor Redis memory usage

### Response Time

- Minimize rate check overhead
- Use efficient data structures
- Cache frequent lookups

## Future Enhancements

1. **Machine Learning**: Detect unusual patterns
2. **Geographic Limits**: Location-based restrictions
3. **User-based Limits**: Authenticated user quotas
4. **Dynamic Limits**: Adjust based on server load
5. **Advanced Analytics**: Detailed traffic insights

---

This rate limiting implementation provides a solid foundation for protecting your API while maintaining good user experience. Regular monitoring and tuning will help optimize the system for your specific use case.
