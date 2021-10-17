import { callbacks, LoggingCallbackWrapper } from '../../lib/callbacks';
import { Logger } from '../lib/logger/Logger';

callbacks.wrapper = new LoggingCallbackWrapper(new Logger('Callbacks'));
