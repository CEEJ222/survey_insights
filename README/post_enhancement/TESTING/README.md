# Testing & Quality Assurance Guide

## Overview

This directory contains comprehensive testing documentation and guidelines for the Unified Feedback Platform. Our testing strategy ensures reliability, performance, and maintainability across all system components.

## Testing Strategy

### 1. Test Pyramid Structure

```
    /\
   /  \
  /E2E \     End-to-End Tests (10%)
 /______\
/        \
/Integration\  Integration Tests (20%)
/____________\
/              \
/   Unit Tests   \  Unit Tests (70%)
/________________\
```

### 2. Testing Levels

- **Unit Tests**: Individual functions, components, and modules
- **Integration Tests**: API endpoints, database interactions, and service integration
- **End-to-End Tests**: Complete user workflows and system behavior

## Test Configuration

### Jest Configuration

Our Jest setup includes:
- Multiple test environments (jsdom for React, node for APIs)
- Coverage thresholds and reporting
- Custom matchers and utilities
- Mock configurations for external services

### Test Environment Setup

```bash
# Run all tests
npm test

# Run specific test types
npm run test:unit
npm run test:integration
npm run test:e2e

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

## Test Categories

### Unit Tests

**Location**: `__tests__/components/`, `__tests__/lib/`

**Coverage**:
- React components and hooks
- Utility functions
- AI modules and engines
- Business logic functions

**Key Files**:
- `StrategicAnalysisModal.test.tsx` - Component testing
- `theme-discovery.test.ts` - AI module testing
- `strategic-intelligence.test.ts` - AI service testing

### Integration Tests

**Location**: `__tests__/api/`

**Coverage**:
- API endpoint functionality
- Database interactions
- Authentication flows
- Error handling

**Key Files**:
- `themes.test.ts` - Themes API testing
- `strategic-scoring.test.ts` - Strategic scoring API testing
- `strategy.test.ts` - Strategy management API testing

### End-to-End Tests

**Location**: `__tests__/e2e/`

**Coverage**:
- Complete user workflows
- Cross-browser compatibility
- Performance testing
- Accessibility testing

**Key Files**:
- `themes-workflow.test.ts` - Complete themes workflow
- `authentication-flow.test.ts` - Login/logout flows
- `performance.test.ts` - Load and performance testing

## Testing Best Practices

### 1. Test Structure (AAA Pattern)

```typescript
describe('ComponentName', () => {
  it('should do something specific', async () => {
    // Arrange - Set up test data and mocks
    const mockData = createMockData()
    
    // Act - Execute the function/component
    const result = await functionUnderTest(mockData)
    
    // Assert - Verify the expected outcome
    expect(result).toBe(expectedValue)
  })
})
```

### 2. Mocking Strategy

- **External APIs**: Mock OpenAI, Redis, and Supabase clients
- **Browser APIs**: Mock window, localStorage, and other browser features
- **Time**: Mock Date and setTimeout for consistent testing
- **Network**: Mock fetch and API responses

### 3. Test Data Management

```typescript
// Use test data generators
const mockTheme = generateTestTheme({ name: 'Custom Theme' })
const mockStrategy = generateTestStrategy({ title: 'Custom Strategy' })
```

### 4. Async Testing

```typescript
// Use proper async/await patterns
it('should handle async operations', async () => {
  await expect(asyncFunction()).resolves.toBe(expectedValue)
})

// Use waitFor for DOM updates
await waitFor(() => {
  expect(screen.getByText('Expected Text')).toBeInTheDocument()
})
```

## Coverage Requirements

### Global Coverage Thresholds

- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

### Component-Specific Thresholds

- **API Endpoints**: 80% coverage
- **AI Modules**: 75% coverage
- **Critical Business Logic**: 90% coverage

## Performance Testing

### Load Testing

- Test with large datasets (1000+ themes)
- Measure response times for API endpoints
- Verify memory usage and resource consumption

### Stress Testing

- Test concurrent user scenarios
- Verify system behavior under high load
- Test database performance with large datasets

## Accessibility Testing

### Automated Testing

- Use Jest DOM matchers for accessibility
- Test keyboard navigation
- Verify ARIA attributes and roles

### Manual Testing

- Screen reader compatibility
- Color contrast verification
- Focus management testing

## CI/CD Integration

### GitHub Actions

```yaml
- name: Run Tests
  run: |
    npm run test:ci
    npm run test:coverage
    
- name: Upload Coverage
  uses: codecov/codecov-action@v3
```

### Quality Gates

- All tests must pass
- Coverage thresholds must be met
- No linting errors allowed
- Security scans must pass

## Debugging Tests

### Common Issues

1. **Async Timing**: Use proper waitFor and async/await
2. **Mock Configuration**: Ensure mocks are properly configured
3. **Environment Variables**: Set correct test environment variables
4. **Database State**: Clean up test data between tests

### Debug Commands

```bash
# Run specific test with debugging
npm run test:debug -- --testNamePattern="specific test"

# Run with verbose output
npm test -- --verbose

# Run single test file
npm test -- themes.test.ts
```

## Test Maintenance

### Regular Tasks

- Update tests when adding new features
- Refactor tests when changing implementation
- Review and update test data
- Monitor test performance and optimize

### Test Review Process

1. All new code must include tests
2. Tests must be reviewed with code changes
3. Coverage reports must be checked
4. Test performance must be monitored

## Resources

### Documentation

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library Documentation](https://testing-library.com/docs/)
- [Playwright Documentation](https://playwright.dev/docs/intro)

### Tools

- **Jest**: Test runner and framework
- **Testing Library**: React component testing
- **Playwright**: End-to-end testing
- **Codecov**: Coverage reporting

### Best Practices

- Write tests that are readable and maintainable
- Focus on testing behavior, not implementation
- Use descriptive test names
- Keep tests independent and isolated
- Mock external dependencies appropriately
