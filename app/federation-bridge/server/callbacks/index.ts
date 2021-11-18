import { callbacks } from '../../../callbacks/server';
import { IUser } from '../../../../definition/IUser';
import { IRoom } from '../../../../definition/IRoom';
import { IMessage } from '../../../../definition/IMessage';
import { afterSaveMessage } from './afterSaveMessage';
import { afterCreateRoom } from './afterCreateRoom';
import { afterAddedToRoom } from './afterAddedToRoom';

callbacks.add(
	'afterSaveMessage',
	(message: IMessage, room: IRoom) => Promise.await(afterSaveMessage(message, room)),
	callbacks.priority.LOW,
	'federation-after-save-message',
);

callbacks.add(
	'afterCreateRoom',
	(user: IUser, room: IRoom) => Promise.await(afterCreateRoom(user, room)),
	callbacks.priority.LOW,
	'federation-after-create-room',
);

callbacks.add(
	'afterAddedToRoom',
	(involvedUsers: any, room: IRoom) => Promise.await(afterAddedToRoom(involvedUsers, room)),
	callbacks.priority.LOW,
	'federation-after-added-to-room',
);
