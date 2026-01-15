export interface Project {
  projectId: string;
  name: string;
  description?: string;
  env?: string;
  createdAt: string;
  organizationId: string;
}

export interface Environment {
  environmentId: string;
  name: string;
  description?: string;
  env?: string;
  createdAt: string;
  projectId: string;
}

export type ApplicationStatus = 'idle' | 'running' | 'done' | 'error';
export type BuildType = 'dockerfile' | 'heroku_buildpacks' | 'paketo_buildpacks' | 'nixpacks' | 'static' | 'railpack';
export type SourceType = 'github' | 'docker' | 'git' | 'gitlab' | 'bitbucket' | 'gitea' | 'drop';

export interface Application {
  applicationId: string;
  name: string;
  appName: string;
  description?: string;
  env?: string;
  buildType: BuildType;
  sourceType?: SourceType;
  dockerImage?: string;
  repository?: string;
  branch?: string;
  owner?: string;
  applicationStatus: ApplicationStatus;
  environmentId: string;
  createdAt: string;
  memoryLimit?: string;
  memoryReservation?: string;
  cpuLimit?: string;
  cpuReservation?: string;
}

export interface Database {
  databaseId: string;
  name: string;
  appName: string;
  description?: string;
  databaseName: string;
  databaseUser: string;
  dockerImage: string;
  applicationStatus: ApplicationStatus;
  environmentId: string;
  createdAt: string;
  externalPort?: number;
}

export interface PostgresDatabase extends Database {
  postgresId: string;
}

export interface MySQLDatabase extends Database {
  mysqlId: string;
  databaseRootPassword: string;
}

export interface MariaDBDatabase extends Database {
  mariadbId: string;
  databaseRootPassword: string;
}

export interface MongoDatabase extends Database {
  mongoId: string;
  replicaSets?: boolean;
}

export interface RedisDatabase extends Database {
  redisId: string;
  databasePassword: string;
}

export interface DockerContainer {
  Id: string;
  Names: string[];
  Image: string;
  State: string;
  Status: string;
  Created: number;
}

export interface Deployment {
  deploymentId: string;
  title?: string;
  description?: string;
  status: 'running' | 'done' | 'error' | 'cancelled';
  logPath: string;
  createdAt: string;
  applicationId?: string;
  composeId?: string;
}

export interface Domain {
  domainId: string;
  host: string;
  path?: string;
  port?: number;
  https: boolean;
  certificateType: 'letsencrypt' | 'none' | 'custom';
  applicationId?: string;
  composeId?: string;
}

export interface Server {
  serverId: string;
  name: string;
  description?: string;
  ipAddress: string;
  port: number;
  username: string;
  serverType: 'deploy' | 'build';
  createdAt: string;
}

export interface ComposeService {
  composeId: string;
  name: string;
  appName: string;
  description?: string;
  composeType: 'docker-compose' | 'stack';
  composeFile: string;
  composeStatus: ApplicationStatus;
  environmentId: string;
  createdAt: string;
}

export interface Notification {
  notificationId: string;
  name: string;
  appBuildError: boolean;
  databaseBackup: boolean;
  volumeBackup: boolean;
  dokployRestart: boolean;
  appDeploy: boolean;
  dockerCleanup: boolean;
  serverThreshold: boolean;
}

export interface ServerMetrics {
  timestamp: string;
  cpu: number;
  memory: number;
  disk: number;
}

export interface ContainerMetrics {
  timestamp: string;
  cpu: number;
  memory: number;
  network: {
    rx: number;
    tx: number;
  };
}
