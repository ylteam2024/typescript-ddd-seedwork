import { DataSourceOptions } from 'typeorm';
import { PostgresDatabaseConfig } from './dbconfig.base';

export function generateDatasourcePostgresOpts(params: {
  postgresConfig: PostgresDatabaseConfig;
  absEntityPath: string;
  absMigrationPath: string;
}) {
  const { postgresConfig, absEntityPath, absMigrationPath } = params;
  return {
    type: 'postgres',
    host: postgresConfig.host,
    port: postgresConfig.port,
    username: postgresConfig.username,
    password: postgresConfig.password,
    database: postgresConfig.database,
    dropSchema: false,
    keepConnectionAlive: true,
    logging: false, // Assuming logging is false by default, adjust as needed
    entities: [absEntityPath],
    migrations: [absMigrationPath],
    extra: {
      max: postgresConfig.maxConnections,
      ssl: postgresConfig.sslEnabled
        ? {
            rejectUnauthorized: true,
            ca: postgresConfig.ca ?? undefined,
            key: postgresConfig.key ?? undefined,
            cert: postgresConfig.cert ?? undefined,
          }
        : undefined,
    },
  } as DataSourceOptions;
}
