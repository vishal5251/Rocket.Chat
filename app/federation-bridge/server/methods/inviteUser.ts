import { bridge } from '../bridge';
import { createUser } from './createUser';
import { MatrixBridgedRoom, MatrixBridgedUser } from '../../../models';

export const inviteUser = async (roomId: string, matrixUserId: string): Promise<void> => {
	// Check if the user already exists locally
	const existingUserId = await MatrixBridgedUser.getId(matrixUserId);

	if (!existingUserId) {
		await createUser(matrixUserId, matrixUserId);
	}

	// Find the bridged room id
	const matrixRoomId = await MatrixBridgedRoom.getMatrixId(roomId);

	// Add our user
	await bridge.getIntent().invite(matrixRoomId, matrixUserId);
};
