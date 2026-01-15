export * from './credentials';

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
  containerId: string;
  name: string;
  image: string;
  ports?: string;
  state: string;
  status: string;
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
  composeFile?: string;
  composeStatus: ApplicationStatus;
  environmentId: string;
  createdAt: string;
  sourceType?: string;
  repository?: string;
  branch?: string;
  owner?: string;
  autoDeploy?: boolean;
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

// Swarm Types
export interface SwarmNode {
  ID: string;
  Description: {
    Hostname: string;
    Platform: {
      Architecture: string;
      OS: string;
    };
    Resources: {
      NanoCPUs: number;
      MemoryBytes: number;
    };
    Engine: {
      EngineVersion: string;
    };
  };
  Status: {
    State: 'ready' | 'down' | 'disconnected' | 'unknown';
    Addr: string;
  };
  Spec: {
    Role: 'manager' | 'worker';
    Availability: 'active' | 'pause' | 'drain';
  };
  ManagerStatus?: {
    Leader: boolean;
    Reachability: 'reachable' | 'unreachable';
    Addr: string;
  };
}

export interface SwarmService {
  ID: string;
  Spec: {
    Name: string;
    Mode: {
      Replicated?: { Replicas: number };
      Global?: {};
    };
    TaskTemplate: {
      ContainerSpec: {
        Image: string;
      };
    };
  };
  ServiceStatus?: {
    RunningTasks: number;
    DesiredTasks: number;
  };
  CreatedAt: string;
  UpdatedAt: string;
}

export interface SwarmTask {
  ID: string;
  ServiceID: string;
  NodeID: string;
  Status: {
    State: string;
    Timestamp: string;
    Message: string;
  };
  DesiredState: string;
  Spec: {
    ContainerSpec: {
      Image: string;
    };
  };
}

export interface SwarmInfo {
  ID: string;
  JoinTokens: {
    Worker: string;
    Manager: string;
  };
  Spec: {
    Name: string;
  };
}

// Monitoring Types
export interface SystemStats {
  cpu: {
    usage: number;
    cores: number;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  disk: {
    used: number;
    total: number;
    percentage: number;
  };
  uptime?: number;
}

export interface ApplicationWithDomains extends Application {
  domains?: Domain[];
}

export interface ComposeWithDomains extends ComposeService {
  domains?: Domain[];
}
