import { callbacks } from '../../../lib/callbacks';
import { MetricsCallbackWrapper } from './MetricsCallbackWrapper';

callbacks.wrapper = new MetricsCallbackWrapper(callbacks.wrapper);
