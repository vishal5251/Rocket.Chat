import yaml from 'js-yaml';
import * as fastq from 'fastq';
import type { queueAsPromised } from 'fastq';
import { AppServiceRegistration, Bridge } from 'matrix-appservice-bridge';

import { currentServer } from '../servers';
import { IMatrixEvent } from '../definitions/IMatrixEvent';
import { MatrixEventType } from '../definitions/MatrixEventType';
import { handleSendMessage } from './sendMessage';
import { handleCreateRoom } from './createRoom';
import { handleAddMemberToRoom } from './addMemberToRoom';
import { setRoomJoinRules } from './setRoomJoinRules';
import { setRoomName } from './setRoomName';
import { setRoomTopic } from './setRoomTopic';

const registration: AppServiceRegistration = yaml.load(
	currentServer.registrationFile,
);

// Define the event handler
const eventHandler = async (event: IMatrixEvent<MatrixEventType>): Promise<void> => {
	switch (event.type) {
		case MatrixEventType.CREATE_ROOM: {
			await handleCreateRoom(event as IMatrixEvent<MatrixEventType.CREATE_ROOM>);

			break;
		}
		case MatrixEventType.ADD_MEMBER_TO_ROOM: {
			await handleAddMemberToRoom(event as IMatrixEvent<MatrixEventType.ADD_MEMBER_TO_ROOM>);

			break;
		}
		case MatrixEventType.SET_ROOM_JOIN_RULES: {
			await setRoomJoinRules(event as IMatrixEvent<MatrixEventType.SET_ROOM_JOIN_RULES>);

			break;
		}
		case MatrixEventType.SET_ROOM_NAME: {
			await setRoomName(event as IMatrixEvent<MatrixEventType.SET_ROOM_NAME>);

			break;
		}
		case MatrixEventType.SET_ROOM_TOPIC: {
			await setRoomTopic(event as IMatrixEvent<MatrixEventType.SET_ROOM_TOPIC>);

			break;
		}
		case MatrixEventType.SEND_MESSAGE: {
			await handleSendMessage(event as IMatrixEvent<MatrixEventType.SEND_MESSAGE>);

			break;
		}
		case MatrixEventType.SET_ROOM_POWER_LEVELS:
		case MatrixEventType.SET_ROOM_CANONICAL_ALIAS:
		case MatrixEventType.SET_ROOM_HISTORY_VISIBILITY:
		case MatrixEventType.SET_ROOM_GUEST_ACCESS: {
			console.log(`Ignoring ${ event.type }`);

			break;
		}
		default:
			console.log(`Could not find handler for ${ event.type }`, event);
	}
};

// Create the queue
export const matrixEventQueue: queueAsPromised<IMatrixEvent<MatrixEventType>> = fastq.promise(eventHandler, 1);

export const bridge = new Bridge({
	homeserverUrl: currentServer.homeserverUrl,
	domain: 'localhost',
	registration,
	suppressEcho: true,
	disableStores: true,

	controller: {
		onUserQuery(queriedUser): Record<string, unknown> {
			console.log('==================================================================');
			console.log('onUserQuery', queriedUser);
			console.log('==================================================================');
			return {}; // auto-provision users with no additional data
		},

		async onEvent(request/* , context*/): Promise<void> {
			// Get the event
			const event = request.getData() as unknown as IMatrixEvent<MatrixEventType>;

			console.log(`Queueing ${ event.type }...`, event);

			// TODO: Handle error
			matrixEventQueue.push(event).catch((err) => console.error(err));
		},
	},
});
