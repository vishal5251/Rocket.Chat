// @ts-ignore
import { MatrixBridgedRoom, MatrixBridgedUser, Users } from '../../../models';
// @ts-ignore
import { createRoom } from '../../../lib';
import { IMatrixEvent } from '../definitions/IMatrixEvent';
import { MatrixEventType } from '../definitions/MatrixEventType';
import { checkBridgedRoomExists } from '../methods/checkBridgedRoomExists';
import { createUser } from '../methods/createUser';

export const handleCreateRoom = async (
	event: IMatrixEvent<MatrixEventType.CREATE_ROOM>,
): Promise<void> => {
	const { room_id: matrixRoomId, sender } = event;

	// TODO: fix racing condition
	return new Promise((resolve) => {
		setTimeout(async () => {
			// Check if the room already exists and if so, ignore
			const roomExists = await checkBridgedRoomExists(matrixRoomId);

			if (roomExists) {
				return resolve();
			}

			// Find the bridged user id
			const bridgedUserId = await MatrixBridgedUser.getId(sender);
			let user;

			// Create the user if necessary
			if (!bridgedUserId) {
				user = await createUser(sender, sender);
			} else {
				user = await Users.findOneById(bridgedUserId);
			}

			// Create temp room name
			const roomName = `Federation-${ matrixRoomId.split(':')[0].replace('!', '') }`;

			const { rid: roomId } = createRoom('c', roomName, user.username);

			MatrixBridgedRoom.insert({ rid: roomId, mri: matrixRoomId });

			resolve();
		}, 500);
	});
};
