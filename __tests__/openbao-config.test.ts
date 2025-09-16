import { validateConfig } from '../src/config/schema';

describe('OpenBao Configuration Integration', () => {
  test('should validate configuration with OpenBao provider', () => {
    const configData = {
      variables: [
        {
          name: 'SECRET_KEY',
          required: true,
          description: 'Secret key from OpenBao',
          source: {
            type: 'openbao',
            path: 'secret/data/myapp',
            key: 'secret_key'
          }
        }
      ]
    };

    const config = validateConfig(configData);
    expect(config.variables).toHaveLength(1);
    expect(config.variables[0].source).toBeDefined();
    expect(config.variables[0].source?.type).toBe('openbao');
  });

  test('should validate configuration with new provider format', () => {
    const configData = {
      variables: [
        {
          name: 'SECRET_KEY',
          required: true,
          description: 'Secret key from OpenBao',
          source: {
            type: 'openbao',
            path: 'secret/data/myapp',
            key: 'secret_key'
          }
        }
      ],
      providers: {
        openbao: {
          type: 'openbao',
          enabled: true,
          config: {
            address: 'http://localhost:8200',
            token: '${OPENBAO_TOKEN}'
          }
        }
      }
    };

    const config = validateConfig(configData);
    expect(config.providers?.openbao).toBeDefined();
    expect(config.providers?.openbao.type).toBe('openbao');
    expect(config.providers?.openbao.enabled).toBe(true);
  });

  test('should handle backward compatibility with Vault and OpenBao', () => {
    const configData = {
      variables: [
        {
          name: 'OLD_SECRET',
          required: true,
          description: 'Secret from Vault',
          source: {
            type: 'vault',
            path: 'secret/data/myapp',
            key: 'old_secret'
          }
        },
        {
          name: 'NEW_SECRET',
          required: true,
          description: 'Secret from OpenBao',
          source: {
            type: 'openbao',
            path: 'secret/data/myapp',
            key: 'new_secret'
          }
        }
      ]
    };

    const config = validateConfig(configData);
    expect(config.variables[0].source).toBeDefined();
    expect(config.variables[0].source?.type).toBe('vault');
    expect(config.variables[1].source?.type).toBe('openbao');
  });

  test('should reject invalid provider type', () => {
    const configData = {
      variables: [
        {
          name: 'SECRET_KEY',
          required: true,
          description: 'Secret key',
          source: {
            type: 'invalid_provider' as any,
            path: 'secret/data/myapp',
            key: 'secret_key'
          }
        }
      ]
    };

    expect(() => validateConfig(configData)).toThrow();
  });

  test('should reject invalid provider configuration', () => {
    const configData = {
      variables: [
        {
          name: 'SECRET_KEY',
          required: true,
          description: 'Secret key'
        }
      ],
      providers: {
        openbao: {
          type: 'invalid_provider' as any,
          enabled: true
        }
      }
    };

    expect(() => validateConfig(configData)).toThrow();
  });
});