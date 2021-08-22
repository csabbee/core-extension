import { connectionLog } from '@src/utils/logging';
import { providerConnectionHandlers } from './providerController';

export function providerConnection(connection) {
  const onMessageHandler = providerConnectionHandlers(connection);

  connectionLog('dApp Provider');

  connection.onMessage.addListener(onMessageHandler);

  connection.onDisconnect.addListener(function onDisconnectHandler() {
    connection.onMessage.removeListener(onMessageHandler);
    connection.onDisconnect.removeListener(onDisconnectHandler);
    console.log('provider disconnected and cleaned up');
  });
}