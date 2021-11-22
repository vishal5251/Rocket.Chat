import { MatrixBridgedRoom, MatrixBridgedUser } from '../../../models/server';
import { IUser } from '../../../../definition/IUser';
import { IRoom } from '../../../../definition/IRoom';
import { bridge } from '../bridge';

export const initRoomBridge = async (user: IUser, room: IRoom): Promise<void> => {
	// Check if this room already exists (created by another method)
	// and if so, ignore the callback
	const roomMatrixId = MatrixBridgedRoom.getMatrixId(room._id);
	if (roomMatrixId) {
		return;
	}

	const intent = bridge.getIntent();

	const roomName = `@rc_${ room.name }`;

	// Create the matrix room
	const matrixRoom = await intent.createRoom({
		createAsClient: true,
		options: {
			name: roomName,
			topic: room.topic,
			visibility: room.t === 'p' ? 'invite' : 'public',
			preset: room.t === 'p' ? 'private_chat' : 'public_chat',
		},
	});

	// Add to the map
	MatrixBridgedRoom.insert({ rid: room._id, mri: matrixRoom.room_id });

	// Retrieve the matrix user
	const userMatrixId = MatrixBridgedUser.getMatrixId(user._id);

	if (!userMatrixId) {
		throw new Error(`Could not find user matrix id for ${ user._id }`);
	}

	// Add our user
	await intent.invite(matrixRoom.room_id, userMatrixId);
};
