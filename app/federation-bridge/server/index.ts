import { bridge } from './bridge';
import { currentServer } from './servers';

(async (): Promise<void> => {
	await bridge.run(currentServer.port);

	await bridge.initalise();
})();
