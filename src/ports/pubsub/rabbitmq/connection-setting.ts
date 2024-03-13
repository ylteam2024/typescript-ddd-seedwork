export class ConnectionSettings {
  hostname: string;
  port?: number;
  username?: string;
  password?: string;
  vhost?: string;

  constructor(
    hostname: string,
    port?: number,
    username?: string,
    password?: string,
    vhost?: string,
  ) {
    // TODO: Validation
    this.hostname = hostname;
    this.port = port;
    this.username = username;
    this.password = password;
    this.vhost = vhost;
  }

  static factory(
    hostname: string,
    port?: number,
    username?: string,
    password?: string,
    vhost?: string,
  ) {
    return new ConnectionSettings(hostname, port, username, password, vhost);
  }

  toUrl() {
    const hostPortPath = `${this.hostname}${this.port ? `:${this.port}` : ''}/${
      this.vhost || '/'
    }`;
    if (this.hasCredential()) {
      return `amqp://${this.username}:${this.password}@${hostPortPath}`;
    }
    return `amqp://${hostPortPath}`;
  }

  hasCredential() {
    return this.username && this.password;
  }
}
