import { callbacks, TimedCallbackWrapper } from '../../lib/callbacks';
import { getConfig } from '../lib/utils/getConfig';

if ([getConfig('debug'), getConfig('timed-callbacks')].includes('true')) {
	callbacks.wrapper = new TimedCallbackWrapper();
}
