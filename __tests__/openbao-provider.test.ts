import { OpenBaoProvider } from '../src/providers/openbao';
import { VariableSource } from '../src/types';

// Mock node-fetch at the module level
jest.mock('node-fetch', () => jest.fn());

// Import the mocked module
import fetch from 'node-fetch';
const mockedFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock Response class
class MockResponse {
  constructor(
    public ok: boolean,
    public status: number,
    public statusText: string,
    private jsonData: any
  ) {}

  async json() {
    return this.jsonData;
  }
}

describe('OpenBaoProvider', () => {
  let provider: OpenBaoProvider;
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment variables
    process.env = { ...originalEnv };
    process.env.OPENBAO_TOKEN = 'test-token';
    
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create new provider instance
    provider = new OpenBaoProvider();
  });

  afterEach(() => {
    // Restore original environment variables
    process.env = originalEnv;
  });

  test('should initialize with default address', () => {
    delete process.env.OPENBAO_ADDR;
    const provider = new OpenBaoProvider();
    expect(provider).toBeDefined();
  });

  test('should initialize with custom address', () => {
    process.env.OPENBAO_ADDR = 'http://custom:8200';
    const provider = new OpenBaoProvider();
    expect(provider).toBeDefined();
  });

  test('should throw error when token is missing', () => {
    delete process.env.OPENBAO_TOKEN;
    expect(() => new OpenBaoProvider()).toThrow(
      'OPENBAO_TOKEN environment variable is required for OpenBao provider'
    );
  });

  test('should resolve variable from OpenBao', async () => {
    const mockResponse = {
      data: {
        data: {
          secret_key: 'secret_value'
        }
      }
    };

    mockedFetch.mockResolvedValueOnce(new MockResponse(true, 200, 'OK', mockResponse) as any);

    const source: VariableSource = {
      type: 'openbao',
      path: 'secret/data/myapp',
      key: 'secret_key'
    };

    const value = await provider.resolve(source);
    expect(value).toBe('secret_value');
    
    expect(mockedFetch).toHaveBeenCalledWith(
      'http://127.0.0.1:8200/v1/secret/data/myapp',
      {
        method: 'GET',
        headers: {
          'X-Vault-Token': 'test-token',
          'Content-Type': 'application/json',
        },
      }
    );
  });

  test('should handle custom OpenBao address', async () => {
    process.env.OPENBAO_ADDR = 'http://custom:8200';
    const provider = new OpenBaoProvider();
    
    const mockResponse = {
      data: {
        data: {
          secret_key: 'secret_value'
        }
      }
    };

    mockedFetch.mockResolvedValueOnce(new MockResponse(true, 200, 'OK', mockResponse) as any);

    const source: VariableSource = {
      type: 'openbao',
      path: 'secret/data/myapp',
      key: 'secret_key'
    };

    await provider.resolve(source);
    
    expect(mockedFetch).toHaveBeenCalledWith(
      'http://custom:8200/v1/secret/data/myapp',
      expect.any(Object)
    );
  });

  test('should throw error for non-openbao source type', async () => {
    const source: VariableSource = {
      type: 'vault',
      path: 'secret/data/myapp',
      key: 'secret_key'
    } as any;

    await expect(provider.resolve(source)).rejects.toThrow(
      'OpenBaoProvider cannot handle source type: vault'
    );
  });

  test('should throw error when path is missing', async () => {
    const source: VariableSource = {
      type: 'openbao',
      key: 'secret_key'
    };

    await expect(provider.resolve(source)).rejects.toThrow(
      'OpenBao provider requires a "path" specification'
    );
  });

  test('should throw error when key is missing', async () => {
    const source: VariableSource = {
      type: 'openbao',
      path: 'secret/data/myapp'
    };

    await expect(provider.resolve(source)).rejects.toThrow(
      'OpenBao provider requires a "key" specification'
    );
  });

  test('should throw error for HTTP error response', async () => {
    mockedFetch.mockResolvedValueOnce(new MockResponse(false, 404, 'Not Found', null) as any);

    const source: VariableSource = {
      type: 'openbao',
      path: 'secret/data/myapp',
      key: 'secret_key'
    };

    await expect(provider.resolve(source)).rejects.toThrow(
      'OpenBao API request failed: 404 Not Found'
    );
  });

  test('should throw error for missing secret data', async () => {
    const mockResponse = {
      data: {
        data: {}
      }
    };

    mockedFetch.mockResolvedValueOnce(new MockResponse(true, 200, 'OK', mockResponse) as any);

    const source: VariableSource = {
      type: 'openbao',
      path: 'secret/data/myapp',
      key: 'missing_key'
    };

    await expect(provider.resolve(source)).rejects.toThrow(
      'Key "missing_key" not found in OpenBao secret at path: secret/data/myapp'
    );
  });

  test('should throw error for null value', async () => {
    const mockResponse = {
      data: {
        data: {
          secret_key: null
        }
      }
    };

    mockedFetch.mockResolvedValueOnce(new MockResponse(true, 200, 'OK', mockResponse) as any);

    const source: VariableSource = {
      type: 'openbao',
      path: 'secret/data/myapp',
      key: 'secret_key'
    };

    await expect(provider.resolve(source)).rejects.toThrow(
      'Key "secret_key" not found in OpenBao secret at path: secret/data/myapp'
    );
  });

  test('should throw error for non-string value', async () => {
    const mockResponse = {
      data: {
        data: {
          secret_key: 123
        }
      }
    };

    mockedFetch.mockResolvedValueOnce(new MockResponse(true, 200, 'OK', mockResponse) as any);

    const source: VariableSource = {
      type: 'openbao',
      path: 'secret/data/myapp',
      key: 'secret_key'
    };

    await expect(provider.resolve(source)).rejects.toThrow(
      'Expected string value for key "secret_key", but got number'
    );
  });

  test('should handle network errors', async () => {
    mockedFetch.mockRejectedValueOnce(new Error('Network error'));

    const source: VariableSource = {
      type: 'openbao',
      path: 'secret/data/myapp',
      key: 'secret_key'
    };

    await expect(provider.resolve(source)).rejects.toThrow(
      'Failed to read from OpenBao at secret/data/myapp: Network error'
    );
  });

  test('should handle invalid JSON response', async () => {
    const badResponse = new MockResponse(true, 200, 'OK', null);
    jest.spyOn(badResponse, 'json').mockRejectedValue(new Error('Invalid JSON'));
    mockedFetch.mockResolvedValueOnce(badResponse as any);

    const source: VariableSource = {
      type: 'openbao',
      path: 'secret/data/myapp',
      key: 'secret_key'
    };

    await expect(provider.resolve(source)).rejects.toThrow(
      'Failed to read from OpenBao at secret/data/myapp: Invalid JSON'
    );
  });

  test('should handle missing response data', async () => {
    const mockResponse = {};

    mockedFetch.mockResolvedValueOnce(new MockResponse(true, 200, 'OK', mockResponse) as any);

    const source: VariableSource = {
      type: 'openbao',
      path: 'secret/data/myapp',
      key: 'secret_key'
    };

    await expect(provider.resolve(source)).rejects.toThrow(
      'No data found at OpenBao path: secret/data/myapp'
    );
  });
});