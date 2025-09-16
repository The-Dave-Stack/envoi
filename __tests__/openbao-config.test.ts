import { validateConfig } from '../src/config/schema';

describe('OpenBao Configuration Integration', () => {
  test('should validate configuration with OpenBao provider', () => {
    const configData = {
      variables: [
        {
          name: 'SECRET_KEY',
          required: true,
          description: 'Secret key from OpenBao'
        }
      ],
      sources: {
        SECRET_KEY: {
          type: 'openbao',
          path: 'secret/data/myapp',
          key: 'secret_key'
        }
      }
    };

    const config = validateConfig(configData);
    expect(config.variables).toHaveLength(1);
    expect(config.sources?.SECRET_KEY).toBeDefined();
    expect(config.sources?.SECRET_KEY.type).toBe('openbao');
  });

  test('should validate configuration with new provider format', () => {
    const configData = {
      variables: [
        {
          name: 'SECRET_KEY',
          required: true,
          description: 'Secret key from OpenBao'
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
      },
      sources: {
        SECRET_KEY: {
          type: 'openbao',
          path: 'secret/data/myapp',
          key: 'secret_key'
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
          description: 'Secret from Vault'
        },
        {
          name: 'NEW_SECRET',
          required: true,
          description: 'Secret from OpenBao'
        }
      ],
      sources: {
        OLD_SECRET: {
          type: 'vault',
          path: 'secret/data/myapp',
          key: 'old_secret'
        },
        NEW_SECRET: {
          type: 'openbao',
          path: 'secret/data/myapp',
          key: 'new_secret'
        }
      }
    };

    const config = validateConfig(configData);
    expect(config.sources).toBeDefined();
    expect(config.sources?.OLD_SECRET.type).toBe('vault');
    expect(config.sources?.NEW_SECRET.type).toBe('openbao');
  });

  test('should reject invalid provider type', () => {
    const configData = {
      variables: [
        {
          name: 'SECRET_KEY',
          required: true,
          description: 'Secret key'
        }
      ],
      sources: {
        SECRET_KEY: {
          type: 'invalid_provider' as any,
          path: 'secret/data/myapp',
          key: 'secret_key'
        }
      }
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