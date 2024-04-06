import { ConnectionSettings } from '@ports/pubsub/rabbitmq';

describe('Connection Settings Test', () => {
  const hostname = 'localhost';
  const port = 15672;
  const username = 'test';
  const password = 'x8oKC7rtXfBWNoprXV6bkdXTuX4yk';
  const connectionSettingIns = ConnectionSettings.factory(
    hostname,
    port,
    username,
    password,
  );
  it('should constructor running normally', () => {
    expect(connectionSettingIns.hostname).toBe(hostname);
    expect(connectionSettingIns.port).toBe(port);
    expect(connectionSettingIns.username).toBe(username);
    expect(connectionSettingIns.password).toBe(password);
  });
  it('should return correct url', () => {
    const url = connectionSettingIns.toUrl();
    expect(url).toBe(`amqp://${username}:${password}@${hostname}:${port}//`);
  });
});
