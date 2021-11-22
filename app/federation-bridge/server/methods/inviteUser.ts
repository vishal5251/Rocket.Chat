import { bridge } from '../bridge';
import { createUser } from './createUser';
import { MatrixBridgedRoom, MatrixBridgedUser } from '../../../models/server';

export const inviteUser = async (roomId: string, matrixUserId: string): Promise<void> => {
	// Check if the user already exists locally
	const existingUserId = await MatrixBridgedUser.getId(matrixUserId);

	if (!existingUserId) {
		await createUser(matrixUserId, matrixUserId);
	}

	// Find the bridged room id
	const roomMatrixId = await MatrixBridgedRoom.getMatrixId(roomId);

	if (!roomMatrixId) {
		throw new Error(`Could not find room matrix id for ${ roomId }`);
	}

	// Add our user
	await bridge.getIntent().invite(roomMatrixId, matrixUserId);
};
