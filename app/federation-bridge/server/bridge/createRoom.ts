// @ts-ignore
import { MatrixBridgedRoom, MatrixBridgedUser, Users } from '../../../models';
// @ts-ignore
import { createRoom } from '../../../lib';
import { IMatrixEvent } from '../definitions/IMatrixEvent';
import { MatrixEventType } from '../definitions/MatrixEventType';

export const handleCreateRoom = async (
	event: IMatrixEvent<MatrixEventType.CREATE_ROOM>,
): Promise<void> => {
	const { room_id: matrixRoomId, sender } = event;

	// Find the bridged user id
	const userId = await MatrixBridgedUser.getId(sender);

	// Find the user
	const user = await Users.findOneById(userId);

	// Create temp room name
	const roomName = `Federation-${ matrixRoomId.split(':')[0].replace('!', '') }`;

	const { rid: roomId } = createRoom('c', roomName, user.username);

	MatrixBridgedRoom.insert({ rid: roomId, mri: matrixRoomId });
};
